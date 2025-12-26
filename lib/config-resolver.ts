/*
 * Copyright 2025 Jason Dillon
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import process from "node:process";
import { resolve, join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { cosmiconfig } from "cosmiconfig";
import type { FilePath, ColorMode, CommandoConfig } from "./types";
import { createBootstrapLogger } from "./logging/bootstrap";

const log = createBootstrapLogger("config-resolver");

/**
 * Bootstrap configuration from CLI argument parsing
 * This is what cli.ts passes to us
 */
export interface BootstrapConfig {
  debug: boolean;
  quiet: boolean;
  silent: boolean;
  logLevel: string;
  logFormat: "json" | "pretty" | undefined;
  colorMode: ColorMode;
  root: FilePath | undefined;
  userDir: FilePath;
  isRestarted: boolean;
}

// ============================================================================
// Private Logging
// ============================================================================

// ============================================================================
// TypeScript Loader
// ============================================================================

/**
 * TypeScript loader for cosmiconfig using Bun's native TS support
 */
async function bunTypescriptLoader(filepath: string): Promise<any> {
  const module = await import(filepath);
  return module.default || module;
}

// ============================================================================
// Project Discovery
// ============================================================================

/**
 * Discover project root by walking up directory tree
 *
 * Searches for .commando/ directory starting from startDir and moving up
 * until it finds one or reaches the filesystem root.
 *
 * @param startDir - Directory to start searching from (defaults to cwd)
 * @returns Project root directory, or null if not found
 */
async function discoverProject(startDir?: FilePath): Promise<FilePath | null> {
  // Start from explicit dir, or fall back to cwd
  let dir = startDir || process.cwd();

  log.debug(`Starting project discovery from: ${dir}`);

  // Walk up to root
  while (dir !== '/' && dir !== '.') {
    const commandoDir = join(dir, '.commando');
    log.debug(`Checking directory: ${dir}`);

    if (existsSync(commandoDir)) {
      log.debug(`Project discovered at: ${dir}`);
      return dir;
    }

    const parent = dirname(dir);
    if (parent === dir) break; // Reached root
    dir = parent;
  }

  log.debug(`Reached filesystem root, no project found`);
  return null;
}

/**
 * Get project root from explicit sources
 *
 * Checks in order:
 * 1. Explicit rootPath parameter (from --root flag)
 * 2. COMMANDO_PROJECT environment variable
 *
 * @param rootPath - Explicit root path from CLI flag
 * @returns Project root directory, or null if not explicitly set
 * @throws Error if COMMANDO_PROJECT is set but invalid
 */
function getExplicitProjectRoot(rootPath?: FilePath): FilePath | null {
  // CLI flag takes precedence
  if (rootPath) {
    log.debug(`Using explicit project root from --root flag: ${rootPath}`);
    return rootPath;
  }

  // Env var override
  if (process.env.COMMANDO_PROJECT) {
    const envPath = process.env.COMMANDO_PROJECT;
    log.debug(`Checking COMMANDO_PROJECT env var: ${envPath}`);

    if (existsSync(join(envPath, '.commando'))) {
      log.debug(`Using project root from COMMANDO_PROJECT env var: ${envPath}`);
      return envPath;
    }

    log.debug(`COMMANDO_PROJECT env var points to invalid directory (no .commando/): ${envPath}`);
    throw new Error(`COMMANDO_PROJECT=${envPath} but .commando/ not found`);
  }

  log.debug('No explicit project root provided');
  return null;
}

/**
 * Find project root using all available methods
 *
 * Tries in order:
 * 1. Explicit root (--root flag or COMMANDO_PROJECT env var)
 * 2. Discovery (walk up from start directory)
 *
 * @param options - Discovery options
 * @returns Project root directory, or null if not found
 */
async function findProjectRoot(options: {
  rootPath?: FilePath;
  startDir?: FilePath;
} = {}): Promise<FilePath | null> {
  // Try explicit sources first
  const explicitRoot = getExplicitProjectRoot(options.rootPath);
  if (explicitRoot) {
    return explicitRoot;
  }

  // Fall back to discovery
  return discoverProject(options.startDir);
}

// ============================================================================
// Config Resolution
// ============================================================================

/**
 * Resolve full configuration from bootstrap config
 *
 * Steps:
 * 1. Discover project root (.commando directory)
 * 2. Load .commando/config.yml if project exists
 * 3. DEFERRED: Merge with user config (~/.commando/config) and defaults
 * 4. DEFERRED: Apply ENV var overrides beyond existing COMMANDO_* vars
 * 5. Return CommandoConfig
 *
 * @param bootstrapConfig - Bootstrap options from CLI args
 * @returns CommandoConfig with all data needed for Commando initialization
 * @throws Error on critical failures (e.g., YAML parse error)
 */
export async function resolveConfig(
  bootstrapConfig: BootstrapConfig,
): Promise<CommandoConfig> {
  log.debug("Starting config resolution");
  log.debug(`userDir: ${bootstrapConfig.userDir}`);
  log.debug(`root: ${bootstrapConfig.root}`);

  // 1. Discover project root
  const projectRoot = await findProjectRoot({
    rootPath: bootstrapConfig.root,
    startDir: bootstrapConfig.userDir,
  });

  log.debug(`Project root: ${projectRoot || "(none)"}`);

  // 2. Load project config if present
  let commandoConfig: Partial<CommandoConfig> = {};

  if (projectRoot) {
    try {
      // Configure cosmiconfig to search for config files
      const searchPlaces = [
        "config.yml",
        "config.yaml",
        "config.json",
        "config.js",
        "config.ts",
      ];

      log.debug(`Configuring cosmiconfig to search for: ${searchPlaces.join(', ')}`);

      const explorer = cosmiconfig("commando", {
        searchPlaces,
        loaders: {
          ".ts": bunTypescriptLoader,
        },
      });

      // Search in .commando directory
      const commandoDir = resolve(projectRoot, ".commando");
      log.debug(`Searching for config in: ${commandoDir}`);

      const configLoadStart = Date.now();
      const result = await explorer.search(commandoDir);
      const configLoadDuration = Date.now() - configLoadStart;

      log.debug(`Config search completed in ${configLoadDuration}ms`);

      if (result?.config) {
        commandoConfig = result.config;
        const configKeys = Object.keys(commandoConfig);
        log.debug(`Loaded config from ${result.filepath} (${configKeys.length} keys: ${configKeys.join(', ')})`);
      } else {
        log.debug(`No config file found in ${commandoDir} (using defaults)`);
      }
    } catch (err: any) {
      // Config parse error - throw to let CLI error handler deal with it
      log.debug(`Config load failed: ${err.message}`);
      throw new Error(
        `Failed to load .commando/config: ${err.message}`,
        { cause: err },
      );
    }
  }

  // 3. DEFERRED: Full config merge strategy
  // TODO: Implement layered config merge:
  //   - Defaults
  //   - User config (~/.commando/config)
  //   - Project config (.commando/config)
  //   - Local overrides (.commando/config.local)
  //   - ENV vars (COMMANDO_*)
  // For now: Just use .commando/config directly

  // 4. DEFERRED: Extended ENV var support
  // TODO: Support ENV var overrides for config values
  //   - COMMANDO_INSTALL_MODE=manual
  //   - COMMANDO_OFFLINE=true
  //   - etc.
  // Current: Only COMMANDO_PROJECT, COMMANDO_HOME supported

  // 5. Build CommandoConfig
  const config: CommandoConfig = {
    // Project info
    projectPresent: !!projectRoot,
    projectRoot: projectRoot ? resolve(projectRoot) : undefined,
    commandoDir: projectRoot ? resolve(projectRoot, ".commando") : undefined,
    userDir: resolve(bootstrapConfig.userDir),

    // Bootstrap options
    debug: bootstrapConfig.debug,
    quiet: bootstrapConfig.quiet,
    silent: bootstrapConfig.silent,
    logLevel: bootstrapConfig.logLevel,
    logFormat: bootstrapConfig.logFormat || "pretty",
    colorMode: bootstrapConfig.colorMode,
    isRestarted: bootstrapConfig.isRestarted,

    // Commando config (from .commando/config.yml)
    modules: commandoConfig.modules,
    dependencies: commandoConfig.dependencies,
    settings: commandoConfig.settings,
    installMode: commandoConfig.installMode,
    offline: commandoConfig.offline,
  };

  log.debug(`Config resolved: ${JSON.stringify(config, null, 2)}`);

  return config;
}
