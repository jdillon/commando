# Findings: Homebrew Tap Support for Forge

## What Worked

**Research successful** - Found comprehensive documentation and examples:
- Official Homebrew docs explain tap creation clearly
- Node.js formula patterns applicable to Bun
- Multiple real-world examples (Bun's own tap, Node.js CLIs)

## What Didn't Work

**No blockers identified** - All approaches are technically feasible

## Key Insights

### 1. Homebrew vs Current Installation - Fundamental Difference

**Current approach (install.sh)**:
- User-centric: installs to `~/.forge`
- Mutable: can update dependencies, pull from git branches
- Development-friendly: can point to local tarballs

**Homebrew approach**:
- System-centric: installs to `/opt/homebrew/Cellar/forge/<version>`
- Immutable: each version is isolated
- Release-focused: requires tagged releases, not branches

**Implication**: These are complementary, not replacements:
- `install.sh` → Development/custom installations
- `brew install` → Production/stable installations

### 2. FORGE_HOME Conflict

**Current behavior**:
- Bootstrap script `bin/forge` expects `FORGE_HOME=~/.forge`
- Contains: `node_modules/`, `config/`, `state/`, `cache/`, `logs/`

**Homebrew behavior**:
- Installs to Cellar (e.g., `/opt/homebrew/Cellar/forge/1.0.0`)
- Symlinks to `/opt/homebrew/bin/forge`

**Resolution needed**:
Two options:
1. **Make FORGE_HOME configurable** - Best option
   - Default to `~/.forge` if not set
   - Allow override via environment variable
   - Homebrew formula sets `FORGE_HOME=#{var}/forge`
   - Keeps user data separate from installed code

2. **Use XDG directories** - More complex but cleaner
   - Config: `~/.config/forge`
   - State: `~/.local/state/forge`
   - Cache: `~/.cache/forge`
   - Logs: `~/.local/state/forge/logs`

**Recommendation**: Option 1 (configurable FORGE_HOME) - minimal code change

### 3. Dependency Management Differs

**Current**: User commands installed to `FORGE_HOME/node_modules`

**Homebrew**: Dependencies should be in formula's libexec, not user's home

**Challenge**: How do user-installed plugins/commands work with Homebrew install?

**Options**:
a) Keep current approach - FORGE_HOME for user data, Cellar for forge core
b) Document that Homebrew install is for core CLI only, use `forge plugin install` for extensions
c) Create separate tap for common plugins

### 4. Release Process Implications

**Current**: Can install from any branch (`module-system`)

**Homebrew**: Requires versioned releases (tarball or git tag)

**Action required**:
- Need stable release strategy
- Semantic versioning
- GitHub releases with tarballs
- Update formula on each release

## Architectural Considerations

### Code Changes Needed

**Minimal changes for Approach A**:
1. Make FORGE_HOME configurable (if not already)
2. Ensure `bin/forge` works when installed via Homebrew
3. Handle case where `FORGE_HOME` doesn't exist yet (create on first run)

**Current bin/forge script analysis**:
```bash
FORGE_HOME="${HOME}/.forge"  # Hardcoded - needs to be configurable
FORGE_CLI="${node_modules}/@planet57/forge/lib/cli.ts"  # Expects FORGE_HOME structure
```

**Potential issue**: Homebrew install won't have `@planet57/forge` in `FORGE_HOME/node_modules`

**Resolution**:
- Homebrew formula installs to libexec
- Wrapper script sets:
  - `FORGE_HOME=${FORGE_HOME:-$HOME/.forge}` (user data)
  - `FORGE_INSTALL=/opt/homebrew/Cellar/forge/1.0.0` (core installation)
  - Script needs to check FORGE_INSTALL first, then fall back to FORGE_HOME

### Testing Strategy

**Local testing**:
```bash
# Create formula locally
cd homebrew-forge
brew install --build-from-source ./Formula/forge.rb

# Verify
forge --version
forge --help

# Test uninstall
brew uninstall forge
```

**Tap testing**:
```bash
# From another machine
brew tap jdillon/forge
brew install forge
```

## Recommendations

### Immediate (if implementing now)

1. **Choose Approach A** (Bun runtime dependency)
   - Fastest to implement
   - Most similar to current behavior
   - Can iterate later

2. **Create separate repository**: `github.com/jdillon/homebrew-forge`
   - Keep tap maintenance separate from core development
   - Easier to manage formula updates

3. **Fix FORGE_HOME handling**:
   - Make configurable in bootstrap script
   - Separate "installation directory" from "user data directory"
   - Document the distinction

4. **Create v1.0.0 release**:
   - Tag current stable point
   - Create GitHub release with tarball
   - Test tarball installation

### Future Enhancements

1. **Add Approach B** (standalone binary)
   - Better user experience (no Bun dependency)
   - Add to CI/CD: build binaries on release
   - Provide both options (let users choose)

2. **Cask for GUI** (if Forge gets a GUI)
   - Use Homebrew Cask instead of formula

3. **Auto-update mechanism**:
   - `forge self-update` command
   - Check GitHub releases
   - Respect Homebrew vs manual installation

## Trade-offs Summary

| Aspect | install.sh | Homebrew (Approach A) | Homebrew (Approach B) |
|--------|-----------|---------------------|---------------------|
| **User friction** | High (manual) | Medium (need Homebrew) | Low (one command) |
| **Dependencies** | Bun required | Bun via Homebrew | None |
| **Update mechanism** | Git pull | `brew upgrade` | `brew upgrade` |
| **Version flexibility** | Any branch | Tagged releases | Tagged releases |
| **Platform support** | macOS/Linux | macOS/Linux | macOS/Linux |
| **Size** | ~5MB + Bun | ~5MB + Bun | ~50MB |
| **Integration** | Manual PATH | Automatic | Automatic |
| **Uninstall** | Manual script | `brew uninstall` | `brew uninstall` |

## Conclusion

**Viable**: Yes, Homebrew tap support is definitely doable

**Complexity**: Low-to-medium (mostly boilerplate)

**Value**: High for macOS users who prefer Homebrew

**Risk**: Low - doesn't affect current installation method

**Time estimate**:
- Basic formula (Approach A): 2-4 hours
- Testing and refinement: 2-4 hours
- Documentation: 1-2 hours
- **Total**: ~1 day for working implementation

**Blocker check**:
- ✅ No technical blockers
- ⚠️ Need to decide on release strategy (tags vs branches)
- ⚠️ Need to address FORGE_HOME configurable requirement
- ⚠️ Should wait for module-system to merge to main (or release from branch)
