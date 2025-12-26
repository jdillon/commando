# XDG Base Directory Compliance

**Status**: Deprecated - Commando uses ~/.commando instead

---

## What is XDG?

The [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/) defines where user-specific files should go on Unix systems. It mirrors the FHS (Filesystem Hierarchy Standard) concepts at the user level.

### Core XDG Directories

```bash
# User configuration files (like /etc for your user)
~/.config/
  └── nvim/, git/, commando/

# User data files (application data, plugins, themes)
~/.local/share/
  └── applications/, fonts/, commando/

# User executables (should be in $PATH)
~/.local/bin/
  └── mise, uv, cmdo

# User state data (logs, history, recent files)
~/.local/state/
  └── commando/

# User cache (safe to delete anytime)
~/.cache/
  └── commando/, uv/
```

### Environment Variables

```bash
$XDG_CONFIG_HOME  → defaults to ~/.config
$XDG_DATA_HOME    → defaults to ~/.local/share
$XDG_STATE_HOME   → defaults to ~/.local/state
$XDG_CACHE_HOME   → defaults to ~/.cache
$XDG_BIN_HOME     → non-standard, but ~/.local/bin is convention
```

### Legacy vs Modern

**Old way (still common):**
```
~/.vimrc
~/.gitconfig
~/my-tool/config
```

**Modern way:**
```
~/.config/nvim/init.vim
~/.config/git/config
~/.local/share/my-tool/
```

---

## Why Commando Uses XDG

Following XDG provides several benefits:

- ✅ **Cleaner home directory** - No more hidden dotfiles cluttering `ls -la ~`
- ✅ **Easier backups** - Just back up `~/.config` and `~/.local/share`
- ✅ **Clear separation** - Config vs data vs cache vs executables
- ✅ **Portable** - Can override via environment variables (useful in containers)
- ✅ **Standard** - Follows convention of modern tools (mise, uv, cargo, etc.)

---

## Commando Directory Layout

### System-Wide Installation

```bash
# Executables (in PATH)
~/.local/bin/
└── cmdo                            # Main executable

# Application data
~/.commando/
├── modules/                        # Shared modules
│   ├── aws/
│   ├── kubernetes/
│   └── terraform/
├── runtime/
│   └── bin/
│       └── bun                     # Bundled Bun binary
└── lib/
    └── core.ts                     # Framework libraries

# User configuration (optional)
~/.config/commando/
└── config.ts                       # Global user config

# Cache (safe to delete anytime)
~/.cache/commando/
├── module-cache/                   # Downloaded modules
└── bun-cache/                      # Bun build artifacts

# State (logs, history)
~/.local/state/commando/
├── update-check.json               # Last update check
└── command-history.json            # Command usage stats
```

### Project Directories

```bash
project/
├── .commando/                      # Project config (prototype)
│   ├── config.yml                  # Module list and settings
│   ├── website.ts                  # Command implementations
│   ├── state.json                  # Project state (git-tracked)
│   └── state.local.json            # User state (gitignored)
└── ...

# In final version, will be .commando/ instead of .commando/
```

---

## Environment Variables

Commando respects XDG environment variables with standard fallbacks:

```bash
# Override data directory
export XDG_DATA_HOME="$HOME/my-data"
# Commando uses: $XDG_DATA_HOME/commando

# Override config directory
export XDG_CONFIG_HOME="$HOME/my-config"
# Commando uses: $XDG_CONFIG_HOME/commando

# Override cache directory
export XDG_CACHE_HOME="$HOME/my-cache"
# Commando uses: $XDG_CACHE_HOME/commando

# Override state directory
export XDG_STATE_HOME="$HOME/my-state"
# Commando uses: $XDG_STATE_HOME/commando
```

**Defaults** (when env vars not set):
- `XDG_DATA_HOME` → `~/.local/share`
- `XDG_CONFIG_HOME` → `~/.config`
- `XDG_CACHE_HOME` → `~/.cache`
- `XDG_STATE_HOME` → `~/.local/state`

---

## Implementation

### Helper Functions (lib/xdg.ts)

```typescript
import { join, homedir } from 'path';

function getXDGDataHome(): string {
  return process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
}

function getXDGConfigHome(): string {
  return process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
}

function getXDGCacheHome(): string {
  return process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
}

function getXDGStateHome(): string {
  return process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state');
}

export function getCommandoPaths() {
  return {
    data: join(getXDGDataHome(), 'commando'),
    config: join(getXDGConfigHome(), 'commando'),
    cache: join(getXDGCacheHome(), 'commando'),
    state: join(getXDGStateHome(), 'commando'),
    modules: join(getXDGDataHome(), 'commando', 'modules'),
    runtime: join(getXDGDataHome(), 'commando', 'runtime'),
  };
}
```

### Module Search Path

Modules are searched in order:

1. **Project modules**: `<project>/.commando/modules/<name>/`
2. **User modules**: `~/.commando/modules/<name>/`
3. **System modules**: (future - for system-wide installs)

```typescript
export function findModulePath(moduleName: string, projectRoot: string): string | null {
  const paths = getCommandoPaths();
  const candidates = [
    join(projectRoot, '.commando', 'modules', moduleName),
    join(paths.modules, moduleName),
  ];

  for (const path of candidates) {
    if (existsSync(join(path, 'module.ts'))) {
      return path;
    }
  }

  return null;
}
```

---

## Bun Installation (XDG-Compliant)

### Install Bun to Commando Runtime Directory

```bash
# Set Bun install location
export BUN_INSTALL="$HOME/.commando/runtime"

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Result:
# ~/.commando/runtime/bin/bun
```

### Add to PATH

**Option 1: Symlink** (recommended)
```bash
ln -s ~/.commando/runtime/bin/bun ~/.local/bin/bun
```

**Option 2: Add to PATH**
```bash
# In ~/.bashrc or ~/.zshrc
export PATH="$HOME/.commando/runtime/bin:$PATH"
```

---

## Comparison to Other Tools

### Tools Following XDG

| Tool | Executable | Data | Config | Notes |
|------|-----------|------|--------|-------|
| **mise** | `~/.local/bin/mise` | `~/.local/share/mise/` | `~/.config/mise/` | ✅ Full XDG |
| **uv** | `~/.local/bin/uv` | `~/.local/share/uv/` | `~/.config/uv/` | ✅ Full XDG |
| **commando** | `~/.local/bin/cmdo` | `~/.commando/` | `~/.config/commando/` | ⚠️ Hybrid |
| **cargo** | `~/.cargo/bin/*` | `~/.cargo/` | `~/.cargo/config.toml` | ⚠️ Partial (uses ~/.cargo) |
| **neovim** | `/usr/bin/nvim` | `~/.local/share/nvim/` | `~/.config/nvim/` | ✅ Full XDG |

### Legacy Tools (Non-XDG)

| Tool | Location | Issue |
|------|----------|-------|
| **vim** | `~/.vimrc`, `~/.vim/` | Clutters home |
| **bash** | `~/.bashrc`, `~/.bash_profile` | (Shell configs exempt) |
| **git** | `~/.gitconfig` | Should use `~/.config/git/config` |
| **ssh** | `~/.ssh/` | (Security tools often exempt) |

---

## Benefits for Commando Users

### 1. Clean Installation

```bash
# All commando files in one place
ls ~/.commando/
# modules/  runtime/  lib/

# Easy to back up or remove
cp -r ~/.commando/ /backup/
rm -rf ~/.commando/
```

### 2. Cache Management

```bash
# Clear cache safely
rm -rf ~/.cache/commando/

# Cache rebuilds automatically on next run
cmdo update
```

### 3. Portable Configuration

```bash
# Use different config in container
docker run -e XDG_CONFIG_HOME=/container-config myimage

# Commando uses: /container-config/commando/
```

### 4. Clear Separation

```bash
# Back up user config
cp -r ~/.config/commando/ /backup/config/

# Back up user data (modules, etc.)
cp -r ~/.commando/ /backup/data/

# Skip cache and state (not important)
```

---

## Migration from v1

### Old Paths (v1 - Bash)

```bash
~/.forge/                           # Would have been used
project/.forge/                     # Project config
```

### New Paths (v2 - Bun)

```bash
~/.commando/                       # Application data
~/.local/bin/cmdo                  # Executable
~/.config/commando/                # User config (optional)
project/.commando/                 # Project config (prototype)
```

**No migration needed** - v2 uses completely different locations.

---

## Future Enhancements

### Global User Config

Currently optional, but could be used for:

```typescript
// ~/.config/commando/config.ts
export default {
  // Global module aliases
  modules: {
    aws: 'https://github.com/user/commando-aws-enhanced'
  },

  // Default flags
  defaults: {
    verbose: false,
    dryRun: false
  },

  // Update settings
  updates: {
    checkInterval: '1d',
    autoUpdate: false
  }
}
```

### State Tracking

```bash
# ~/.local/state/commando/update-check.json
{
  "lastCheck": "2025-10-29T12:00:00Z",
  "currentVersion": "2.0.0",
  "latestVersion": "2.1.0",
  "updateAvailable": true
}

# ~/.local/state/commando/command-history.json
{
  "commands": {
    "sync": { "count": 45, "lastUsed": "2025-10-29T11:30:00Z" },
    "publish": { "count": 23, "lastUsed": "2025-10-29T10:15:00Z" }
  }
}
```

---

## References

- **XDG Base Directory Spec**: https://specifications.freedesktop.org/basedir-spec/
- **Arch Wiki - XDG**: https://wiki.archlinux.org/title/XDG_Base_Directory
- **Modern Unix Tools**: https://github.com/ibraheemdev/modern-unix

---

## Summary

Commando follows XDG standards for a cleaner, more maintainable installation:

- ✅ Executable in `~/.local/bin/` (standard location, likely in PATH)
- ✅ Data in `~/.commando/` (modules, runtime)
- ✅ Config in `~/.config/commando/` (optional user config)
- ✅ Cache in `~/.cache/commando/` (safe to delete)
- ✅ State in `~/.local/state/commando/` (logs, history)
- ✅ Respects `XDG_*` environment variables
- ✅ Mirrors FHS (Filesystem Hierarchy Standard) at user level

**This makes commando a good citizen of modern Unix systems.**
