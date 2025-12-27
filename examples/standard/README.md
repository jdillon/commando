# Standard Library Example

This example demonstrates using the `@jdillon/forge-standard` package to load reusable command modules.

## What This Shows

- Loading modules from packages installed to commando home
- Using `file:` protocol for local development
- Package submodule syntax: `@jdillon/forge-standard/hello`
- Group name derived from submodule: `hello`

## Setup

### 1. Install forge-standard to commando home

```bash
cd ~/.commando
bun add file:../../../forge-standard
```

This creates symlinks, so changes to forge-standard are immediately reflected.

### 2. Run commands

```bash
cd examples/standard

# Use local dev CLI (./cmdo symlink ensures correct version)
./cmdo --help

# Use commands from forge-standard
./cmdo hello greet World
./cmdo hello greet Jason
./cmdo hello info
```

**Note:** The `./cmdo` symlink points to `../../bin/cmdo-dev` to ensure you're testing the local development version, not the installed version.

## Expected Output

```bash
$ ./cmdo hello greet Jason
Hello, Jason!
Loaded from forge-standard package

$ ./cmdo hello info
Module: @jdillon/forge-standard/hello
Version: 0.1.0
Commands: greet, info
```

## How It Works

1. **Config declares dependency**: `file:../../../forge-standard` (relative path)
2. **Auto-install**: Commando installs to `~/.commando/node_modules/@jdillon/forge-standard/`
3. **Module loading**: `@jdillon/forge-standard/hello` resolves to `hello.ts`
4. **Group name**: Last path segment `hello` becomes the command group
5. **Commands registered**: `greet` and `info` commands under `hello` group

## Configuration

See `.commando/config.yml`:

```yaml
dependencies:
  - file:../../../forge-standard  # Relative path for portability

modules:
  - "@jdillon/forge-standard/hello"
```

## Production vs Development

**Development** (current):
```yaml
dependencies:
  - file:~/ws/forge-standard  # Local symlink
```

**Production** (future):
```yaml
dependencies:
  - git+ssh://git@github.com/jdillon/forge-standard.git  # Git repo
```

## Related

- **forge-standard source**: `~/ws/forge-standard/`
- **Installed location**: `~/.commando/node_modules/@jdillon/forge-standard/`
- **Module resolver**: `lib/module-resolver.ts`
- **Phase 3 docs**: `docs/wip/module-system/phase3-implementation-proposal.md`
