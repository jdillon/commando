# Homebrew Tap Investigation for Forge

**Date**: 2025-11-15
**Investigator**: Claude
**Status**: Complete

## Goal

Investigate how to support installing Forge via Homebrew tap (`brew tap jdillon/forge && brew install forge`).

## Background

Forge is currently installed via:
- Bun package manager
- Git repository: `git+ssh://git@github.com/jdillon/forge`
- Installed to `~/.forge`
- Requires Bun runtime
- Bootstrap script at `bin/forge` (bash wrapper that runs Bun)

## Key Findings

### 1. What is a Homebrew Tap?

A tap is a third-party repository of Homebrew formulae. It allows distribution without being in Homebrew's core repository.

**Naming convention**: Repository must be named `homebrew-<name>` (e.g., `homebrew-forge`)

**Installation flow**:
```bash
brew tap jdillon/forge       # Adds tap: clones github.com/jdillon/homebrew-forge
brew install forge           # Installs formula from that tap
```

### 2. Formula Structure

Formulae are Ruby files that define:
- Source URL (tarball, git repo, or binary)
- Dependencies
- Installation steps
- Tests

**Location**: `Formula/forge.rb` in the tap repository

### 3. Approaches for Forge

There are three viable approaches, each with trade-offs:

#### **Approach A: Bun Runtime Dependency** (Recommended)
Install as npm/Bun package with Bun as dependency

**Pros**:
- Most similar to current install.sh behavior
- Can install directly from GitHub
- Uses existing package.json and bin/forge
- Updates are straightforward (bump version in formula)

**Cons**:
- Requires Bun to be installed (adds ~90MB dependency)
- Users must have Bun on system
- Bun is less common than Node.js

**Example formula**:
```ruby
class Forge < Formula
  desc "Modern CLI framework for deployments"
  homepage "https://github.com/jdillon/forge"
  url "https://github.com/jdillon/forge/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "..."

  depends_on "bun"

  def install
    # Install dependencies
    system "bun", "install", "--production"

    # Install to libexec (standard for language-specific packages)
    libexec.install Dir["*"]

    # Create wrapper that sets FORGE_HOME
    (bin/"forge").write_env_script libexec/"bin/forge", FORGE_HOME: libexec
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/forge --version")
  end
end
```

#### **Approach B: Standalone Binary** (Future option)
Compile Forge to standalone executable using `bun build --compile`

**Pros**:
- No runtime dependency
- Smallest install footprint
- Fastest startup
- Users don't need Bun

**Cons**:
- Requires build step to create binary
- Larger binary size (~50MB)
- Need separate binaries for macOS Intel, macOS ARM, Linux
- More complex release process

**Example formula**:
```ruby
class Forge < Formula
  desc "Modern CLI framework for deployments"
  homepage "https://github.com/jdillon/forge"

  if OS.mac? && Hardware::CPU.arm?
    url "https://github.com/jdillon/forge/releases/download/v1.0.0/forge-macos-arm64"
    sha256 "..."
  elsif OS.mac? && Hardware::CPU.intel?
    url "https://github.com/jdillon/forge/releases/download/v1.0.0/forge-macos-x64"
    sha256 "..."
  elsif OS.linux?
    url "https://github.com/jdillon/forge/releases/download/v1.0.0/forge-linux-x64"
    sha256 "..."
  end

  def install
    bin.install "forge-#{OS.mac? ? 'macos' : 'linux'}-#{Hardware::CPU.arch}" => "forge"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/forge --version")
  end
end
```

#### **Approach C: Hybrid - Shell Script Installer**
Formula runs install.sh script

**Pros**:
- Reuses existing install.sh
- Consistent with manual installation

**Cons**:
- Not idiomatic for Homebrew
- install.sh expects interactive use
- Harder to uninstall cleanly
- Doesn't integrate well with Homebrew's management

**Not recommended** - Goes against Homebrew best practices.

### 4. Repository Structure

Recommended structure for `homebrew-forge` repository:

```
homebrew-forge/
├── Formula/
│   └── forge.rb          # Main formula
├── README.md             # Installation instructions
└── LICENSE
```

### 5. Release Process

For Approach A (Bun dependency):
1. Tag release in main repo: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. GitHub auto-creates tarball at: `https://github.com/jdillon/forge/archive/refs/tags/v1.0.0.tar.gz`
4. Download tarball, compute SHA256: `shasum -a 256 forge-1.0.0.tar.gz`
5. Update formula with new URL and SHA256
6. Push formula to tap repo

For Approach B (Standalone binary):
1. Build binaries for each platform: `bun build --compile lib/cli.ts --outfile forge-<platform>`
2. Create GitHub release with binaries as assets
3. Update formula with new URLs and SHA256s
4. Push formula to tap repo

### 6. Dependencies Comparison

| Approach | Runtime Deps | Install Size | User Friction |
|----------|-------------|--------------|---------------|
| A: Bun runtime | Bun (~90MB) | ~5MB + deps | Medium (requires Bun) |
| B: Standalone | None | ~50MB | Low (just works) |
| C: install.sh | Bun (~90MB) | ~5MB + deps | High (not Homebrew-idiomatic) |

### 7. Similar Tools Analysis

**Examples of Bun-based formulae**:
- Bun itself: `oven-sh/homebrew-bun`

**Examples of Node.js CLI tools**:
- Standard pattern: depends_on "node", install with npm, symlink binaries
- Reference: https://docs.brew.sh/Node-for-Formula-Authors

## Recommendation

**Start with Approach A** (Bun runtime dependency) because:
1. Easiest to implement - closest to current installation
2. Smallest code change to Forge itself
3. Can migrate to Approach B later if desired
4. Follows established patterns from Node.js ecosystem

**Future migration to Approach B** when:
- Forge becomes more stable
- Want to reduce user friction
- Ready to add binary build step to CI/CD

## Next Steps

If proceeding with implementation:

1. Create `homebrew-forge` repository at github.com/jdillon/homebrew-forge
2. Create initial formula using Approach A template
3. Test locally: `brew install --build-from-source ./Formula/forge.rb`
4. Tag a release in main forge repo (v1.0.0)
5. Update formula with release tarball URL and SHA256
6. Test end-to-end: `brew tap jdillon/forge && brew install forge`
7. Document in Forge README.md

## Open Questions

1. **Version strategy**: Should we use module-system branch or wait for main merge?
2. **FORGE_HOME**: Current install uses ~/.forge, Homebrew typically uses Cellar - need to reconcile
3. **Updates**: Current install.sh pulls from git, Homebrew pulls from releases - different update mechanisms
4. **Dependencies**: Should user commands also be managed by Homebrew or keep current approach?

## References

- [Homebrew Tap Documentation](https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap)
- [Node for Formula Authors](https://docs.brew.sh/Node-for-Formula-Authors)
- [Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)
- [Bun Homebrew Tap](https://github.com/oven-sh/homebrew-bun)
