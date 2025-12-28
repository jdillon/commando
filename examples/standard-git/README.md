# Standard Library Example (Git URL)

This example demonstrates using the `@planet57/commando-standard` package loaded from a **git repository** to load reusable command modules.

## What This Shows

- Loading modules from **git repositories** using `git+ssh://` protocol
- SSH authentication for private repositories
- Package submodule syntax: `@planet57/commando-standard/hello`
- Group name derived from submodule: `hello`
- Auto-install from git on first use

## Setup

### 1. Ensure SSH authentication is configured

```bash
# Test SSH access to GitHub
ssh -T git@github.com

# Should see: Hi <username>! You've successfully authenticated...
```

### 2. Run commands (auto-install will happen automatically)

```bash
cd examples/standard-git

# Use local dev CLI (./cmdo symlink ensures correct version)
./cmdo --help

# Use commands from commando-standard
./cmdo hello greet World
./cmdo hello greet Jason
./cmdo hello info
```

**Note:** The `./cmdo` symlink points to `../../bin/cmdo-dev` to ensure you're testing the local development version, not the installed version.

## Expected Output

### First Run (with auto-install)

```bash
$ ./cmdo --help
Installing dependencies...
  + @planet57/commando-standard@git+ssh://git@github.com/jdillon/commando-standard.git
Restarting to pick up dependency changes...

Usage: cmdo [options] [command]

Commands:
  hello greet [name]  - Greet someone
  hello info          - Show module info
```

### Subsequent Runs

```bash
$ ./cmdo hello greet Jason
Hello, Jason!
Loaded from commando-standard package

$ ./cmdo hello info
Module: @planet57/commando-standard/hello
Version: 0.1.0
Commands: greet, info
```

## How It Works

1. **Config declares dependency**: `git+ssh://git@github.com/jdillon/commando-standard.git`
2. **Auto-install**: On first run, Commando clones the git repo and installs to `~/.commando/node_modules/@planet57/commando-standard/`
3. **SSH authentication**: Uses your SSH keys (~/.ssh/id_rsa) automatically
4. **Module loading**: `@planet57/commando-standard/hello` resolves to `hello.ts`
5. **Group name**: Last path segment `hello` becomes the command group
6. **Commands registered**: `greet` and `info` commands under `hello` group
7. **Restart mechanism**: Exit code 42 signals wrapper to restart after dependency install

## Configuration

See `.commando/config.yml`:

```yaml
dependencies:
  # Git URL with SSH authentication
  - git+ssh://git@github.com/jdillon/commando-standard.git

modules:
  - "@planet57/commando-standard/hello"
```

## Git URL Formats Supported

**SSH (recommended for private repos):**
```yaml
dependencies:
  - git+ssh://git@github.com/jdillon/commando-standard.git
  - git+ssh://git@github.com/jdillon/commando-standard.git#main  # Specific branch
  - git+ssh://git@github.com/jdillon/commando-standard.git#v1.0.0  # Specific tag
```

**HTTPS (public repos):**
```yaml
dependencies:
  - git+https://github.com/jdillon/commando-standard.git
  - github:jdillon/commando-standard  # GitHub shorthand (HTTPS only)
```

## Related Examples

- **examples/standard** - Uses `file:` URL for local development
- **examples/deps** - Uses npm package (cowsay)

## Related Files

- **commando-standard repo**: https://github.com/jdillon/commando-standard
- **Installed location**: `~/.commando/node_modules/@planet57/commando-standard/`
- **Module resolver**: `lib/module-resolver.ts`
- **Package manager**: `lib/package-manager.ts`
- **Phase 2 & 3 docs**: `docs/wip/module-system/`

## Troubleshooting

**Error: "Failed to install git+ssh://..."**
- Check SSH keys: `ssh -T git@github.com`
- Ensure key is added to GitHub: https://github.com/settings/keys
- Try manual install: `cd ~/.commando && bun add git+ssh://git@github.com/jdillon/commando-standard.git`

**Error: "Permission denied (publickey)"**
- SSH key not configured or not added to ssh-agent
- Run: `ssh-add ~/.ssh/id_rsa`

**Module not loading after install:**
- Check commando home: `ls ~/.commando/node_modules/@planet57/`
- Verify package.json has correct name: `cat ~/.commando/node_modules/@planet57/commando-standard/package.json`
- Try clean reinstall: Remove from commando home and run `./cmdo --help` again
