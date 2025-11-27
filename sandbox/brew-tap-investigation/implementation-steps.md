# Implementation Steps for Homebrew Tap Support

## Prerequisites

- [ ] Forge is stable enough for v1.0.0 release
- [ ] module-system branch is ready (or merged to main)
- [ ] FORGE_HOME separation is addressed in code

## Phase 1: Prepare Forge Repository

### Step 1: Make FORGE_HOME Configurable

**File**: `bin/forge`

**Current**:
```bash
FORGE_HOME="${HOME}/.forge"
FORGE_CLI="${node_modules}/@planet57/forge/lib/cli.ts"
```

**Needed**:
```bash
# Support both Homebrew installation and manual installation
if [[ -n "${FORGE_INSTALL:-}" ]]; then
  # Homebrew installation - use FORGE_INSTALL for core
  FORGE_CLI="${FORGE_INSTALL}/lib/cli.ts"
else
  # Manual installation - use FORGE_HOME
  FORGE_HOME="${FORGE_HOME:-${HOME}/.forge}"
  FORGE_CLI="${FORGE_HOME}/node_modules/@planet57/forge/lib/cli.ts"
fi

# User data directory (always in FORGE_HOME)
export FORGE_HOME="${FORGE_HOME:-${HOME}/.forge}"
```

### Step 2: Create Release

```bash
# In forge repo
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

GitHub automatically creates release tarball at:
`https://github.com/jdillon/forge/archive/refs/tags/v1.0.0.tar.gz`

### Step 3: Compute SHA256

```bash
# Download tarball
curl -L https://github.com/jdillon/forge/archive/refs/tags/v1.0.0.tar.gz -o forge-1.0.0.tar.gz

# Compute SHA256
shasum -a 256 forge-1.0.0.tar.gz
# Output: abc123... forge-1.0.0.tar.gz
```

## Phase 2: Create Tap Repository

### Step 4: Create homebrew-forge Repository

```bash
# On GitHub, create new repo: jdillon/homebrew-forge
# Clone locally
git clone git@github.com:jdillon/homebrew-forge.git
cd homebrew-forge
```

### Step 5: Create Directory Structure

```bash
mkdir -p Formula
```

### Step 6: Create Formula

**File**: `Formula/forge.rb`

Copy from `forge.rb.example` in this directory, updating:
- `url` - set to tag tarball URL
- `sha256` - set to computed hash from Step 3
- `version` - matches tag

### Step 7: Create README

**File**: `README.md`

```markdown
# Homebrew Forge

Official Homebrew tap for [Forge](https://github.com/jdillon/forge).

## Installation

```bash
brew tap jdillon/forge
brew install forge
```

## Upgrading

```bash
brew upgrade forge
```

## Uninstallation

```bash
brew uninstall forge
brew untap jdillon/forge
```

## About

Forge is a modern CLI framework for deployments.
```

### Step 8: Commit and Push

```bash
git add Formula/forge.rb README.md
git commit -m "Add forge formula v1.0.0"
git push origin main
```

## Phase 3: Local Testing

### Step 9: Test Local Installation

```bash
# In homebrew-forge directory
brew install --build-from-source ./Formula/forge.rb

# Verify
forge --version
forge --help

# Check installation location
which forge
# Should be: /opt/homebrew/bin/forge (on Apple Silicon)
#         or /usr/local/bin/forge (on Intel)

# Check that FORGE_HOME is created
ls -la ~/.forge
```

### Step 10: Test Uninstallation

```bash
brew uninstall forge

# Verify removed
which forge
# Should output nothing

# Note: FORGE_HOME (~/.forge) is preserved (correct behavior)
```

## Phase 4: End-to-End Testing

### Step 11: Test Via Tap

```bash
# From clean state (or different machine)
brew tap jdillon/forge
brew install forge

# Verify
forge --version
```

### Step 12: Test Upgrade Path

```bash
# Create v1.0.1 release in forge repo
cd /path/to/forge
git tag v1.0.1
git push origin v1.0.1

# Update formula in tap repo
cd /path/to/homebrew-forge
# Edit Formula/forge.rb:
#   - Update version to 1.0.1
#   - Update url to v1.0.1 tarball
#   - Update sha256 (download new tarball, compute hash)
git commit -am "Update forge to v1.0.1"
git push

# Test upgrade
brew upgrade forge
forge --version  # Should show 1.0.1
```

## Phase 5: Documentation

### Step 13: Update Forge README

**File**: `README.md` in forge repo

Add installation section:

```markdown
## Installation

### Via Homebrew (macOS/Linux)

```bash
brew tap jdillon/forge
brew install forge
```

### Manual Installation

See [docs/installation.md](docs/installation.md) for manual installation via install.sh.
```

### Step 14: Create Installation Docs

**File**: `docs/installation.md`

Document both methods:
- Homebrew (recommended for most users)
- Manual install.sh (for development or custom setups)

Explain differences:
- Homebrew: stable releases, automatic updates via `brew upgrade`
- Manual: any branch/commit, manual updates via install.sh

## Phase 6: Automation (Optional)

### Step 15: Automate Formula Updates

Create GitHub Action in forge repo to update tap on release:

**.github/workflows/update-homebrew.yml**:
```yaml
name: Update Homebrew Formula

on:
  release:
    types: [published]

jobs:
  update-formula:
    runs-on: ubuntu-latest
    steps:
      - name: Update Homebrew tap
        uses: mislav/bump-homebrew-formula-action@v2
        with:
          formula-name: forge
          homebrew-tap: jdillon/homebrew-forge
        env:
          COMMITTER_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

This automatically updates the formula when you create a GitHub release.

## Verification Checklist

After implementation, verify:

- [ ] `brew tap jdillon/forge` works
- [ ] `brew install forge` works
- [ ] `forge --version` shows correct version
- [ ] `forge --help` works
- [ ] FORGE_HOME is created at ~/.forge
- [ ] User can run forge commands
- [ ] `brew upgrade forge` works when new version released
- [ ] `brew uninstall forge` cleanly removes forge
- [ ] FORGE_HOME persists after uninstall (correct behavior)
- [ ] Installation works on both Intel and Apple Silicon Macs
- [ ] Installation works on Linux (if supported)

## Rollback Plan

If issues arise:

```bash
# User can remove tap
brew untap jdillon/forge

# User can fall back to manual installation
curl -fsSL https://raw.githubusercontent.com/jdillon/forge/main/bin/install.sh | bash
```

## Maintenance

**On each release**:
1. Tag release in forge repo
2. Compute new SHA256
3. Update formula in homebrew-forge repo
4. Push formula update
5. Test locally before pushing

**Automation helps**: Step 15's GitHub Action automates most of this.

## Estimated Time

- Phase 1: 1-2 hours (code changes + testing)
- Phase 2: 30 minutes (repo setup)
- Phase 3: 30 minutes (local testing)
- Phase 4: 30 minutes (tap testing)
- Phase 5: 1 hour (documentation)
- Phase 6: 1 hour (optional automation)

**Total**: 4-6 hours for complete implementation
