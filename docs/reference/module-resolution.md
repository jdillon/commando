# Module Resolution in Commando

**Purpose:** How Commando enables modules in `.commando/` to import packages from the shared commando home.

**Updated:** 2025-11-01

---

## Overview

Commando uses a **shared dependency model** where packages are installed once in `~/.commando/node_modules/` and made available to all projects. This avoids duplicating dependencies across projects while maintaining isolation.

### The Challenge

When a Commando module (e.g., `.commando/moo.ts`) needs to import a package:

```typescript
import cowsay from "cowsay";
```

Bun's default behavior is to look for `cowsay` in:
1. Project's `node_modules/` directory
2. Parent directories walking up to root
3. **Not** in commando home by default

We need to tell Bun to also search `~/.commando/node_modules/`.

---

## Solution: NODE_PATH Environment Variable

### Implementation

Commando sets the `NODE_PATH` environment variable before executing Bun:

```bash
export NODE_PATH="$COMMANDO_HOME/node_modules"
bun run .commando/module.ts
```

This instructs Bun to include commando home's `node_modules` in its module resolution search path.

### Why NODE_PATH?

- ✅ **Simple:** One environment variable, no configuration files
- ✅ **Standard:** Industry-standard approach used across Node.js/Bun ecosystem
- ✅ **Clean:** No warnings, no extra CLI flags
- ✅ **Zero maintenance:** No files to create or manage
- ✅ **Portable:** Works on all platforms

### How It Works

When Bun resolves `import cowsay from "cowsay"`, it searches:

1. Built-in modules (e.g., `node:fs`)
2. Relative/absolute paths (if path-like)
3. `node_modules/` in current directory
4. `node_modules/` in parent directories (walking up)
5. **Directories in NODE_PATH** ← Commando home added here
6. Global installation directories

By setting `NODE_PATH="$COMMANDO_HOME/node_modules"`, commando home becomes part of the search path.

### Source

Per [Bun's official documentation](https://bun.sh/docs/runtime/modules) and `bun-module-resolution.md`:

> **NODE_PATH** - Additional module resolution paths (colon-delimited on Unix, semicolon on Windows)

Bun implements Node.js's module resolution algorithm, including NODE_PATH support.

---

## Alternative: Shared tsconfig.json (Advanced)

For cases requiring explicit configuration or enhanced IDE support, Commando can use a shared `tsconfig.json` in commando home.

### Implementation

**Setup (one-time):**

Create `~/.commando/tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": [
        "~/.commando/node_modules/*",
        "./node_modules/*",
        "*"
      ]
    },
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Usage:**

```bash
bun run --tsconfig-override="$COMMANDO_HOME/tsconfig.json" .commando/module.ts
```

### When to Use

Use the tsconfig approach when:
- Explicit configuration is required for documentation
- IDE path completion needs enhancement
- Team prefers file-based configuration
- More sophisticated path mapping is needed

### Trade-offs

**Pros:**
- ✅ Explicit, visible configuration
- ✅ One shared file (not per-project)
- ✅ Better IDE support (potentially)
- ✅ Native TypeScript path mapping

**Cons:**
- ⚠️ Requires `--tsconfig-override` flag on every `bun run`
- ⚠️ Shows harmless Bun warning: "Internal error: directory mismatch"
- ⚠️ More complex wrapper implementation
- ⚠️ Absolute paths required (can't use `~`)

### The Warning

When using `--tsconfig-override` with a tsconfig outside the project directory, Bun shows:

```
Internal error: directory mismatch for directory "~/.commando/tsconfig.json", fd 3.
You don't need to do anything, but this indicates a bug.
```

This is harmless - module resolution works correctly. It's a Bun internal warning when tsconfig is outside the project root.

---

## What Doesn't Work

Based on comprehensive testing, these approaches **do not** affect module resolution:

### ❌ BUN_INSTALL_GLOBAL_DIR

```bash
BUN_INSTALL_GLOBAL_DIR="$COMMANDO_HOME"  # Only affects `bun install -g`, not resolution
```

This environment variable only controls where `bun install -g` places packages, not where Bun looks during module resolution.

### ❌ bunfig.toml globalDir

```toml
[install]
globalDir = "/path/to/commando"  # Only affects install, not resolution
```

Similar to `BUN_INSTALL_GLOBAL_DIR`, this only affects package installation location.

### ❌ Per-project tsconfig.json

While technically works, this defeats the purpose of a shared configuration:

```bash
# Creates .commando/tsconfig.json in every project
# Not recommended - adds files to each project
```

Commando specifically avoids adding configuration files to `.commando/` directories.

---

## Implementation in Commando

### Wrapper Script (bin/cmdo-bootstrap)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Determine commando home location
export COMMANDO_HOME="${COMMANDO_HOME:-$HOME/.commando}"

# Set NODE_PATH for module resolution
export NODE_PATH="$COMMANDO_HOME/node_modules"

# Optional: Add project-local node_modules if it exists (for overrides)
if [[ -d ".commando/node_modules" ]]; then
  export NODE_PATH=".commando/node_modules:$NODE_PATH"
fi

# Execute commando CLI
exec bun run "$COMMANDO_BIN_DIR/cli.ts" "$@"
```

### Debug Logging

When `--debug` flag is used, Commando logs the NODE_PATH value:

```bash
if [[ "$COMMANDO_DEBUG" == "1" ]]; then
  echo "DEBUG: COMMANDO_HOME=$COMMANDO_HOME"
  echo "DEBUG: NODE_PATH=$NODE_PATH"
fi
```

---

## Testing Module Resolution

### Verify NODE_PATH Approach

```bash
cd examples/deps
export NODE_PATH="$HOME/.commando/node_modules"
bun run .commando/moo2.ts
```

Expected output: Cowsay ASCII art (imports work)

### Verify tsconfig-override Approach

```bash
cd examples/deps
bun run --tsconfig-override="$HOME/.commando/tsconfig.json" .commando/moo2.ts
```

Expected output: Cowsay ASCII art + harmless warning

### Check Resolution Programmatically

```typescript
// test-resolution.ts
console.log("Resolving 'cowsay' from:", process.cwd());
console.log("NODE_PATH:", process.env.NODE_PATH);

try {
  const resolved = Bun.resolveSync("cowsay", process.cwd());
  console.log("✓ Resolved to:", resolved);
} catch (e) {
  console.log("✗ Failed:", e.message);
}
```

```bash
NODE_PATH="$HOME/.commando/node_modules" bun run test-resolution.ts
```

---

## Priority Order

When both local and shared packages exist, Bun uses this priority:

1. **Project's node_modules/** (if exists)
2. **NODE_PATH directories** (commando home)
3. **Parent directory node_modules/** (walking up)

This means project-local packages override commando home packages, allowing selective overrides when needed.

---

## Multiple NODE_PATH Entries

NODE_PATH supports multiple directories (colon-separated on Unix):

```bash
# Local overrides commando home
export NODE_PATH=".commando/node_modules:$COMMANDO_HOME/node_modules"

# Or multiple shared locations
export NODE_PATH="/opt/shared/node_modules:$COMMANDO_HOME/node_modules"
```

First match wins.

---

## Cross-Platform Considerations

### Path Separator

- **Unix/macOS:** Colon `:` separator
  ```bash
  NODE_PATH="/path/one:/path/two"
  ```

- **Windows:** Semicolon `;` separator
  ```bash
  NODE_PATH="C:\path\one;C:\path\two"
  ```

### Wrapper Implementation

```bash
# Cross-platform path separator
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  SEP=";"
else
  SEP=":"
fi

export NODE_PATH="${local_modules}${SEP}${COMMANDO_HOME}/node_modules"
```

---

## Why Not Symlinks?

Previous iterations considered symlinking `.commando/node_modules` → `$COMMANDO_HOME/node_modules`.

**Why we don't use symlinks:**

- ❌ Requires creating symlink per project
- ❌ Needs `.gitignore` entry for each project
- ❌ Requires cleanup on project removal
- ❌ Platform-specific symlink support varies
- ✅ NODE_PATH/tsconfig are simpler and cleaner

Symlinks work but add unnecessary complexity when NODE_PATH handles it elegantly.

---

## Runtime Compatibility

### Bun

✅ **Full support** for both NODE_PATH and tsconfig paths

### Node.js

✅ **NODE_PATH supported** (legacy but works)
⚠️ **tsconfig paths NOT supported** natively (needs ts-node or compilation)

### Deno

❌ **NODE_PATH not supported**
✅ **Import maps** (different approach)

**Conclusion:** NODE_PATH works across Bun and Node.js. If Commando ever supports Deno, we'd need import maps.

---

## Best Practices

### 1. Use NODE_PATH as Default

For most cases, NODE_PATH provides the best balance of simplicity and functionality.

### 2. Reserve tsconfig-override for Special Cases

Use the tsconfig approach only when:
- Explicit config is required for compliance/documentation
- IDE integration demands it
- Complex path mapping is needed

### 3. Document in Projects

Even though NODE_PATH is environment-based, document it in your project README:

```markdown
## Dependencies

This project uses Commando's shared dependency model.
Packages are installed to `~/.commando/node_modules/`
and made available via NODE_PATH.
```

### 4. Debug Resolution Issues

If imports fail, check:

```bash
# Is NODE_PATH set?
echo $NODE_PATH

# Does package exist in commando home?
ls -la ~/.commando/node_modules/package-name

# Can Bun resolve it?
bun run -e 'console.log(Bun.resolveSync("package-name", process.cwd()))'
```

---

## References

### Official Documentation

- [Bun Runtime - Modules](https://bun.sh/docs/runtime/modules)
- [Bun Install Configuration](https://bun.sh/docs/install/cache)
- [Node.js Module Resolution](https://nodejs.org/api/modules.html)

### Commando Documentation

- `docs/reference/bun-env-vars.md` - Bun environment variables
- `tmp/bun-module-resolution.md` - Detailed Bun resolution research
- `tmp/runtime-comparison-module-resolution.md` - Comparison across runtimes

### Test Evidence

Comprehensive testing in `tmp/`:
- `test-experiments.sh` - 7 different approaches tested
- `test-node-path-poc.sh` - NODE_PATH proof of concept
- `test-tsconfig-override-simple.sh` - Shared tsconfig test
- `test-final-comparison.sh` - Side-by-side comparison
- `SOLUTION-SUMMARY.md` - Complete analysis

All tests confirm NODE_PATH and --tsconfig-override work reliably.

---

## Summary

**Primary solution:** Set `NODE_PATH="$COMMANDO_HOME/node_modules"` in wrapper

**Alternative:** Use `--tsconfig-override="$COMMANDO_HOME/tsconfig.json"` for explicit config

**Result:** Modules in `.commando/` can import from commando home without per-project configuration or symlinks

**Recommendation:** Use NODE_PATH unless you have specific needs for explicit configuration
