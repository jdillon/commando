# Session Handoff: Forge Framework Redesign

**Date**: 2025-10-28
**Context**: Design next-generation CLI framework combining forge simplicity with commando features
**Repository**: `/Users/jason/ws/jdillon/forge-bash/`

---

## What Was Done

### 1. Copied Current Forge Framework

**From**: `/Users/jason/ws/cirqil/admin/` and `/Users/jason/ws/cirqil/website/cirqil.com/`

**To**: `/Users/jason/ws/jdillon/forge-bash/`

**Files copied**:
- `forge` - Main script with error handling and debug logging
- `lib/aws.bash` - AWS/aws-vault wrapper with optional usage
- `lib/terraform.bash` - Terraform wrapper using aws_vault_prefix
- `lib/keybase.bash` - Keybase integration (from admin project)
- `examples/config.bash` - Example project configuration
- `examples/local.bash` - Example user configuration

### 2. Analyzed Both Frameworks

**Forge** (current):
- Simple, project-embedded
- Module-based via sourcing
- ~130 lines core + modules
- No plugin system or help
- Works well but not DRY

**Commando** (reference):
- Installable, feature-rich
- Module/command registration system
- ~480 lines with advanced features
- Help system, color output, stack traces
- Complex but powerful

### 3. Created Documentation

**Created**: `docs/FRAMEWORK_COMPARISON.md`
- Detailed comparison of both frameworks
- Feature matrix
- Usage examples
- Design goals for next generation
- Three implementation strategies
- Specific next steps

---

## Key Insights

### User Requirements

From Jason's description:

> "The thing I would like to do is to re-imagine a framework that will allow a single install of the command into users path like /usr/local/bin or ~/bin, and then based on CWD it can figure out where the config is and etc."

**Critical features**:
1. Single install in system PATH
2. CWD-aware config discovery
3. Reusable plugins/bundles (aws, terraform, etc.)
4. Simple to add project-specific commands
5. Must maintain simplicity of forge
6. Should gain benefits of commando (help, discovery)

### Design Constraints

**Must preserve**:
- Simplicity and understandability
- Minimal abstraction
- Easy to add new commands
- Clear execution flow

**Must add**:
- CWD-aware config discovery
- Plugin/module reusability
- Single installation model

**Should consider**:
- Optional help system
- Command discovery
- Better error messages
- Module versioning

---

## Recommended Approach: Hybrid Design

### Core Concept

**Installable forge with progressive enhancement**

```
forge (in PATH)
  ↓
Discovers config via CWD traversal
  ↓
Loads modules from:
  1. System: /usr/local/share/forge/lib/
  2. User: ~/.forge/lib/
  3. Project: $PROJECT/.forge/lib/
  ↓
Sources project config
  ↓
Executes command
```

### Key Design Decisions

#### 1. Config Discovery

```bash
# Walk up from CWD looking for .forge/
function find_forge_dir {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.forge" ]]; then
      echo "$dir/.forge"
      return 0
    fi
    dir=$(dirname "$dir")
  done
  return 1
}
```

#### 2. Module Loading Order

```bash
# 1. System modules (shared across all projects)
source_if_exists "/usr/local/share/forge/lib/aws.bash"

# 2. User modules (user customizations)
source_if_exists ~/.forge/lib/*.bash

# 3. Project modules (project-specific)
source_if_exists .forge/lib/*.bash

# 4. Project config (overrides)
source_if_exists .forge/config.bash

# 5. Local config (user/machine specific)
source_if_exists .forge/local.bash
```

#### 3. Command Pattern (Keep Simple)

```bash
# No registration needed, just name convention
function command_deploy {
  # Implementation
}

# Optional help via convention
function command_deploy_help {
  cat <<EOF
Usage: forge deploy <env>
Deploy application to environment
EOF
}
```

#### 4. Plugin/Bundle Format

```bash
# File: aws.bash
# Metadata at top
# FORGE_MODULE: aws
# FORGE_VERSION: 1.0.0
# FORGE_REQUIRES: bash>=4.0

# Module code follows
declare -g aws_vault_profile
# ...
```

---

## Technical Challenges

### 1. CWD Independence

**Problem**: Current forge must be run from project root
**Solution**: Discovery algorithm finds .forge/ from any subdirectory
**Edge cases**:
- Multiple nested .forge/ directories
- Symlinks
- NFS/network mounts

### 2. Module Conflicts

**Problem**: Same module name in different locations
**Solution**: Last-loaded wins (project > user > system)
**Alternative**: Explicit module selection in config

### 3. Backward Compatibility

**Problem**: Existing projects have embedded forge
**Solution**:
- Detect "old-style" (embedded) vs "new-style" (installed)
- Shim layer that works both ways
- Migration script

### 4. Plugin Distribution

**Problem**: How to share/install modules
**Solution options**:
- Git submodules (simple but manual)
- Central registry (complex, requires infrastructure)
- URL-based install: `forge install https://example.com/module.bash`
- Package manager integration (homebrew, apt, etc.)

---

## Proof of Concept Outline

### Phase 1: CWD-Aware Forge (Minimal Viable)

**Goal**: Single installed `forge` that works from any directory

**Changes**:
1. Add config discovery to main forge script
2. Modify module loading to use discovered path
3. Test with existing cirqil/admin project
4. No breaking changes to existing behavior

**Success criteria**:
- Can run `forge` from project subdirectories
- Works with existing .forge/config.bash files
- Maintains backward compatibility

### Phase 2: Module Repository

**Goal**: Shared modules reduce duplication

**Changes**:
1. Create ~/.forge/lib/ structure
2. Move common modules (aws, terraform) there
3. Update projects to reference shared modules
4. Add module fallback chain

**Success criteria**:
- Multiple projects use same aws.bash
- Updates to shared module affect all projects
- Projects can override with local versions

### Phase 3: Help & Discovery

**Goal**: Better usability through introspection

**Changes**:
1. Add `forge help` command
2. Auto-discover commands via function names
3. Support optional `command_NAME_help()` functions
4. Generate command list automatically

**Success criteria**:
- `forge help` lists all available commands
- `forge help deploy` shows command-specific help
- Works without requiring command registration

### Phase 4: Plugin System

**Goal**: Easy installation of shared modules

**Changes**:
1. Define plugin/bundle format
2. Add `forge install` command
3. Support URL and file-based installation
4. Version tracking for updates

**Success criteria**:
- `forge install aws` fetches and installs module
- `forge update` checks for new versions
- Can uninstall modules cleanly

---

## Open Questions

### 1. Alternative Implementations?

**Question**: Should we stay in pure bash or consider other approaches?

**Options**:
- **Pure bash**: Current approach, most compatible
- **Small C wrapper**: Faster startup, better path handling
- **Python**: Better package management, cross-platform
- **Go**: Single binary, fast, but requires compilation
- **Shell-agnostic**: Support zsh, fish, etc.

**Recommendation**: Start with pure bash, consider C wrapper later for performance

### 2. Configuration Format?

**Question**: Keep bash-based config or introduce declarative format?

**Options**:
- **Bash source** (current): Maximum flexibility, no parsing needed
- **YAML/TOML**: More structured, easier validation
- **JSON**: Machine-readable, tooling support
- **INI**: Simple, human-readable

**Recommendation**: Keep bash for compatibility, maybe add optional declarative layer

### 3. Command Namespacing?

**Question**: How to handle command conflicts?

**Options**:
- **Flat namespace** (current): `forge deploy`
- **Subcommands**: `forge aws deploy`, `forge terraform plan`
- **Plugins as namespaces**: `forge aws:deploy`
- **Context-aware**: Different commands based on project type

**Recommendation**: Start flat, add optional namespacing if needed

### 4. Distribution Mechanism?

**Question**: How should users install/update forge?

**Options**:
- **Manual**: Download and copy to PATH
- **Install script**: `curl | bash` installer
- **Package managers**: homebrew, apt, npm
- **Git submodule**: Include in project
- **Bootstrap**: Minimal script that fetches full version

**Recommendation**: Install script + homebrew for macOS

---

## Implementation Priority

### Must Do First

1. **CWD-aware config discovery** - Enables single installation model
2. **Module path resolution** - Supports shared modules
3. **Backward compatibility** - Existing projects keep working

### Do Next

4. **Help system** - Improves usability
5. **Command discovery** - Better user experience
6. **Module repository** - Reduce duplication

### Do Later

7. **Plugin installation** - Convenience feature
8. **Version management** - Quality of life
9. **Alternative shells** - Broader adoption

---

## Files to Review

### Current Forge Implementation

**Admin project** (latest version):
- `/Users/jason/ws/cirqil/admin/forge` - Main script with error trap & log_debug
- `/Users/jason/ws/cirqil/admin/.forge/aws.bash` - AWS module with optional vault
- `/Users/jason/ws/cirqil/admin/.forge/terraform.bash` - Terraform module
- `/Users/jason/ws/cirqil/admin/.forge/keybase.bash` - Keybase module
- `/Users/jason/ws/cirqil/admin/.forge/onboarding.bash` - Project-specific commands

**Website project** (reference):
- `/Users/jason/ws/cirqil/website/cirqil.com/forge` - Similar structure
- `/Users/jason/ws/cirqil/website/cirqil.com/.forge/` - Different modules

### Commando Reference

**Framework**:
- `/Users/jason/ws/jdillon/commando-bash/commando.sh` - Main framework
- `/Users/jason/ws/jdillon/commando-bash/.commando/library/` - Example modules

### New Repo

**Forge-bash**:
- `/Users/jason/ws/jdillon/forge-bash/` - Working repository
- `/Users/jason/ws/jdillon/forge-bash/docs/FRAMEWORK_COMPARISON.md` - Analysis
- `/Users/jason/ws/jdillon/forge-bash/lib/` - Copied modules
- `/Users/jason/ws/jdillon/forge-bash/examples/` - Example configs

---

## Code Snippets for Reference

### Current Module Loading (Admin Project)

```bash
# From admin/.forge/config.bash
source "${forgedir}/aws.bash"
source "${forgedir}/terraform.bash"
source "${forgedir}/keybase.bash"
source "${forgedir}/onboarding.bash"
```

### Proposed Module Loading (New Design)

```bash
# Discover forge directory
forgedir=$(find_forge_dir) || die "No .forge/ directory found"
basedir=$(dirname "$forgedir")

# Load shared modules
for module in /usr/local/share/forge/lib/*.bash; do
  [[ -f "$module" ]] && source "$module"
done

# Load user modules
for module in ~/.forge/lib/*.bash; do
  [[ -f "$module" ]] && source "$module"
done

# Load project modules
for module in "$forgedir/lib"/*.bash; do
  [[ -f "$module" ]] && source "$module"
done

# Load project config
[[ -f "$forgedir/config.bash" ]] && source "$forgedir/config.bash"

# Load local config
[[ -f "$forgedir/local.bash" ]] && source "$forgedir/local.bash"
```

### Optional Help Convention

```bash
# Command implementation
function command_deploy {
  local env="$1"
  echo "Deploying to $env..."
}

# Optional help (discovered automatically)
function command_deploy_help {
  cat <<EOF
$(basename $0) deploy <environment>

Deploy application to specified environment

ARGUMENTS:
  environment    Target environment (dev, staging, prod)

OPTIONS:
  -f, --force    Force deployment without confirmation
  --dry-run      Show what would be deployed

EXAMPLES:
  $(basename $0) deploy staging
  $(basename $0) deploy prod --dry-run
EOF
}
```

---

## Success Metrics

### For Redesign

- [ ] Single `forge` executable in PATH works from any directory
- [ ] Existing cirqil/admin and cirqil/website projects work unchanged
- [ ] Shared aws.bash module used by multiple projects
- [ ] `forge help` lists all available commands
- [ ] Project-specific commands coexist with shared modules
- [ ] Local config still gitignored and works correctly
- [ ] Migration path documented for existing projects

### For Adoption

- [ ] New project setup takes < 5 minutes
- [ ] Adding a new command takes < 10 lines of code
- [ ] Users can find commands without reading source
- [ ] Module sharing reduces code duplication by 80%
- [ ] Framework itself is < 300 lines (vs 480 in commando)

---

## Next Session Action Items

1. **Review this document** with Jason
2. **Discuss design trade-offs** and preferred approach
3. **Decide on implementation strategy** (evolutionary vs revolutionary)
4. **Create prototype** of CWD-aware config discovery
5. **Test backward compatibility** with existing projects
6. **Define module format** and repository structure
7. **Plan migration path** for existing forge users

---

## Questions for Jason

1. **Installation preference**: Homebrew, install script, manual, or multiple?
2. **Backward compatibility**: Break existing projects or maintain compatibility?
3. **Module distribution**: Git-based, central registry, or manual?
4. **Help system**: Required or optional feature?
5. **Alternative languages**: Consider Go/Python or stick with bash?
6. **Timeline**: Quick prototype or thorough redesign?
7. **Scope**: Just forge or also integrate with commando concepts?

---

## Related Documentation

- `docs/FRAMEWORK_COMPARISON.md` - Detailed comparison of forge vs commando
- `examples/config.bash` - Example project configuration
- `examples/local.bash` - Example user configuration
- Current forge implementations in cirqil projects

---

## Repository State

**Git repository**: `/Users/jason/ws/jdillon/forge-bash/.git/`
**Branch**: (likely `main` or `master`, check with `git branch`)
**Status**: New repository, files not yet committed

**Suggested first commit**:
```bash
cd /Users/jason/ws/jdillon/forge-bash
git add .
git commit -m "Initial forge framework extraction and analysis

- Copy current forge implementation from cirqil projects
- Add framework comparison documentation
- Create example configurations
- Document redesign session context"
```

---

**End of handoff document**
