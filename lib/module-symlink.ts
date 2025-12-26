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

import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { symlink, mkdir, readlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createLogger } from './logging/logger';
import { getNodeModulesPath } from './commando-home';

const log = createLogger('module-symlink');

/**
 * Create a symlink to the .commando directory in node_modules/.commando-project/
 * Returns the path to import through the symlink
 */
export async function symlinkCommandoDir(commandoDir: string): Promise<string> {
  log.debug({ commandoDir }, 'Creating symlink for commando directory');

  // Generate hash from absolute commando dir path (16 chars = 64 bits)
  const hash = createHash('sha256').update(commandoDir).digest('hex').slice(0, 16);

  // Bucket by first 2 chars to avoid flat directory (like git objects)
  const bucket = hash.slice(0, 2);
  const hashSuffix = hash.slice(2);

  log.debug({ commandoDir, hash, bucket, hashSuffix }, 'Computed symlink hash');

  // Symlink location in commando-home node_modules
  const nodeModules = getNodeModulesPath();
  const symlinkDir = join(nodeModules, '.commando-project', bucket);
  const symlinkPath = join(symlinkDir, hashSuffix);

  log.debug({ symlinkPath }, 'Computed symlink path');

  // Create .commando-project directory if it doesn't exist
  if (!existsSync(symlinkDir)) {
    log.debug({ symlinkDir }, 'Creating .commando-project bucket directory');
    await mkdir(symlinkDir, { recursive: true });
    log.debug({ symlinkDir }, 'Bucket directory created');
  } else {
    log.debug({ symlinkDir }, 'Bucket directory already exists');
  }

  // Check if symlink already exists and points to the right place
  if (existsSync(symlinkPath)) {
    try {
      const target = await readlink(symlinkPath);
      log.debug({ symlinkPath, target }, 'Symlink exists, checking target');

      if (target === commandoDir) {
        log.debug({ symlinkPath, target }, 'Symlink already correct');
        return symlinkPath;
      } else {
        log.warn({
          symlinkPath,
          currentTarget: target,
          expectedTarget: commandoDir
        }, 'Symlink points to wrong target');
        // Could delete and recreate, but for now just use it
      }
    } catch (e) {
      // Readlink failed, probably not a symlink
      log.warn({ symlinkPath, error: e }, 'Path exists but readlink failed');
    }
  } else {
    // Create the symlink
    log.debug({ symlinkPath }, 'Symlink does not exist, creating');
    try {
      await symlink(commandoDir, symlinkPath, 'dir');
      log.debug({ commandoDir, symlinkPath }, 'Symlink created successfully');
    } catch (e: any) {
      log.debug({ commandoDir, symlinkPath, error: e.message }, 'Symlink creation failed');
      throw e;
    }
  }

  return symlinkPath;
}

/**
 * Convert a module path within .commando to go through the symlink
 *
 * Input: /path/to/user/project/.commando/commands.ts
 * Output: /commando-home/node_modules/.commando-project/abc123/commands.ts
 *
 * If the path is NOT in .commando, returns it unchanged.
 *
 * Note: The symlink should already exist (created during project setup in cli.ts)
 */
export async function rewriteModulePath(fullPath: string, commandoDir: string): Promise<string> {
  log.debug({ fullPath, commandoDir }, 'Checking if path needs rewrite');

  // Only rewrite paths that are actually in the .commando directory
  if (!fullPath.startsWith(commandoDir)) {
    log.debug({
      fullPath,
      commandoDir,
      reason: 'path outside commandoDir'
    }, 'Skipping rewrite');
    return fullPath;
  }

  log.debug({ fullPath }, 'Rewriting path through symlink');

  // Symlink should already exist, just compute the path (16 chars = 64 bits)
  const hash = createHash('sha256').update(commandoDir).digest('hex').slice(0, 16);

  // Bucket by first 2 chars (matching symlinkCommandoDir structure)
  const bucket = hash.slice(0, 2);
  const hashSuffix = hash.slice(2);

  const nodeModules = getNodeModulesPath();
  const symlinkPath = join(nodeModules, '.commando-project', bucket, hashSuffix);

  // Replace the .commando directory with the symlink path
  const relativePath = fullPath.substring(commandoDir.length);
  const rewrittenPath = join(symlinkPath, relativePath);

  log.debug({
    original: fullPath,
    rewritten: rewrittenPath,
    relativePath
  }, 'Path rewritten');

  return rewrittenPath;
}
