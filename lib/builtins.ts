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

import process from 'node:process';
import { getCommandoHomePath } from './commando-home';
import { getVersion } from './version';
import type { CommandoCommand, CommandoModuleMetadata } from './types';

/**
 * Module metadata - top-level commands (no group)
 */
export const __module__: CommandoModuleMetadata = {
  group: false,
  description: 'Built-in commands',
};

/**
 * Show detailed version information.
 */
export const version: CommandoCommand = {
  description: 'Show detailed version information',
  execute: async () => {
    const info = await getVersion();

    console.log('Forge Version Information:');
    console.log();
    console.log(`  Version:    ${info.version}`);
    console.log(`  Full:       ${info.semver}`);
    console.log(`  Commit:     ${info.hashFull}`);
    console.log(`  Branch:     ${info.branch}`);
    console.log(`  Built:      ${info.timestamp}`);
    console.log(`  Dirty:      ${info.dirty ? 'yes (uncommitted changes)' : 'no'}`);
    console.log();
    console.log(`Install location: ${getCommandoHomePath()}`);
  },
};

/**
 * Launch a shell in the forge home directory.
 */
export const cd: CommandoCommand = {
  description: 'Launch a shell in the forge home directory',
  execute: async () => {
    const commandoHome = getCommandoHomePath();

    // Detect shell (use $SHELL env var, fallback to /bin/sh)
    const shell = process.env.SHELL || '/bin/sh';

    // Spawn interactive shell in forge home
    const proc = Bun.spawn([shell], {
      cwd: commandoHome,
      stdio: ['inherit', 'inherit', 'inherit'],
      env: {
        ...process.env,
        COMMANDO_HOME: commandoHome,
      },
    });

    // Wait for shell to exit
    await proc.exited;
    process.exit(proc.exitCode || 0);
  },
};
