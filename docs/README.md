# Forge Framework Documentation

This directory contains comprehensive analysis and recommendations for redesigning the forge framework.

## Quick Start

**New to this project?** Start here:

1. Read **[RECOMMENDATIONS.md](RECOMMENDATIONS.md)** - Executive summary and roadmap
2. Review **[QUESTIONS_FOR_JASON.md](QUESTIONS_FOR_JASON.md)** - Key decisions needed
3. Check **[FRAMEWORK_COMPARISON.md](FRAMEWORK_COMPARISON.md)** - Context from previous session

## Document Guide

### Core Analysis

| Document | Purpose | Read If... |
|----------|---------|-----------|
| **[RECOMMENDATIONS.md](RECOMMENDATIONS.md)** | Comprehensive recommendations and implementation roadmap | You want the full picture and action plan |
| **[QUESTIONS_FOR_JASON.md](QUESTIONS_FOR_JASON.md)** | Key decisions and design choices | You need to make decisions about the framework |
| **[FRAMEWORK_COMPARISON.md](FRAMEWORK_COMPARISON.md)** | Detailed comparison of forge vs commando | You want to understand the existing implementations |

### Deep Dives

| Document | Purpose | Read If... |
|----------|---------|-----------|
| **[COMMANDO_ANALYSIS.md](COMMANDO_ANALYSIS.md)** | Feature-by-feature analysis of commando | You want to understand commando's design in depth |
| **[FORGE_ANALYSIS.md](FORGE_ANALYSIS.md)** | Feature-by-feature analysis of forge | You want to understand forge's design in depth |
| **[LANGUAGE_EVALUATION.md](LANGUAGE_EVALUATION.md)** | Bash vs Python/Ruby/Go/Node comparison | You're questioning the language choice |
| **[HELP_AND_COMPLETION.md](HELP_AND_COMPLETION.md)** | Help systems and shell completion strategies | You're implementing help or completion features |
| **[NAMING.md](NAMING.md)** | Name brainstorming and analysis | You're considering renaming the framework |

## Key Insights

### From Forge Analysis
- ✅ **Command auto-discovery** (`command_<name>` pattern) is brilliant
- ✅ **Configuration as code** (sourcing bash files) is the right approach
- ✅ **State system** is simple and effective
- ⚠️ **Location-dependent** (must run from project root)
- ⚠️ **Module duplication** (copy aws.bash to every project)
- ❌ **No help system** (can't discover commands)

### From Commando Analysis
- ✅ **Rich error diagnostics** with stack traces
- ✅ **Structured help system** for documentation
- ✅ **Module organization** with explicit dependencies
- ⚠️ **Too much boilerplate** (registration, help metadata)
- ⚠️ **Over-engineered** module system (define, load, prepare)
- ❌ **Still location-dependent** (same problem as forge)

### Language Evaluation
- ✅ **Bash is right choice** for command execution use case
- ✅ **Zero dependencies** and instant startup crucial
- ✅ **User extensibility** (source files) requires shell language
- ⚠️ **Bash 4+ requirement** acceptable (handle via auto-upgrade)
- ❌ **Python/Ruby/Go** add overhead without enough benefit

### Naming Recommendation
- ✅ **Keep "forge"** - it's working well
- ✅ **5 letters acceptable** for the usage frequency
- ✅ **Strong metaphor** (building/crafting)
- Alternative: **"kit"** if shorter is critical (3 letters)

## Recommended Approach

### Core Philosophy
**"Forge with batteries included"** - Maintain simplicity while adding modern conveniences

### Key Improvements
1. **CWD-aware config discovery** - Run from any project subdirectory
2. **Shared module repository** - Install once, use everywhere
3. **Minimal help system** - Auto-discovery + optional metadata
4. **Shell completion** - Tab-complete commands
5. **Better errors** - Debug mode for troubleshooting

### What to Keep from Forge
- ✅ Command naming pattern (`command_<name>`)
- ✅ Configuration as code (source files)
- ✅ State system (with better escaping)
- ✅ Simplicity and directness
- ✅ Pure bash approach

### What to Avoid from Commando
- ❌ Explicit command registration
- ❌ Separate help configuration
- ❌ Complex module lifecycle
- ❌ Verbose boilerplate

## Implementation Phases

### Phase 1: CWD-Aware Core
- Implement directory tree walking
- Find `.forge/` from any subdirectory
- Test with existing projects
- **Success metric:** Can run from subdirs

### Phase 2: Module System
- Create shared module repository (`~/.forge/lib/`)
- Implement `load_module()` with search path
- Move common modules to shared location
- **Success metric:** No module duplication

### Phase 3: Help System
- Auto-discover commands via function names
- Support optional descriptions and help functions
- Intercept `-h`/`--help` flags
- **Success metric:** `forge help` works

### Phase 4: Shell Completion
- Create bash/zsh completion scripts
- Support command-specific completion
- Add installation helpers
- **Success metric:** Tab completion works

### Phase 5: Polish
- Improve error handling
- Fix state system escaping
- Write documentation
- Add tests
- **Success metric:** Production ready

## Quick Reference

### Current Problems
1. Must run from project root directory
2. Duplicate modules across projects
3. No way to discover available commands
4. No shell completion support
5. Updating modules is manual and error-prone

### Solutions
1. CWD-aware config discovery (walk up tree)
2. Shared module repository (`~/.forge/lib/`)
3. Auto-discovery + help system
4. Completion scripts for bash/zsh
5. Git-based updates (`cd ~/.forge && git pull`)

### Installation Model
```bash
# Current (per-project)
cp forge ~/project/
cp .forge/aws.bash ~/project/.forge/
cp .forge/terraform.bash ~/project/.forge/

# Proposed (global)
git clone https://github.com/user/forge ~/.forge
export PATH="$HOME/.forge/bin:$PATH"
# Modules shared across all projects
```

## Next Steps

1. **Review recommendations** - Read [RECOMMENDATIONS.md](RECOMMENDATIONS.md)
2. **Answer questions** - Fill out [QUESTIONS_FOR_JASON.md](QUESTIONS_FOR_JASON.md)
3. **Create prototype** - Implement Phase 1 (CWD-aware core)
4. **Test with real projects** - Use cirqil/admin and cirqil/website
5. **Iterate** - Refine based on real usage

## Questions?

See [QUESTIONS_FOR_JASON.md](QUESTIONS_FOR_JASON.md) for the comprehensive list of decisions to be made.

Key decisions needed:
- **Q2:** Backward compatibility strategy
- **Q3:** Config discovery approach
- **Q5:** Module repository structure
- **Q10:** Help system verbosity
- **Q26:** Timeline and approach (prototype vs full redesign)

## Contributing to Analysis

If you discover issues or have insights:

1. Add notes to relevant analysis document
2. Update [QUESTIONS_FOR_JASON.md](QUESTIONS_FOR_JASON.md) with new questions
3. Update [RECOMMENDATIONS.md](RECOMMENDATIONS.md) with new insights

## Document Status

- ✅ **COMMANDO_ANALYSIS.md** - Complete feature analysis
- ✅ **FORGE_ANALYSIS.md** - Complete feature analysis
- ✅ **LANGUAGE_EVALUATION.md** - Complete comparison
- ✅ **HELP_AND_COMPLETION.md** - Complete implementation guide
- ✅ **NAMING.md** - Complete naming analysis
- ✅ **QUESTIONS_FOR_JASON.md** - Ready for answers
- ✅ **RECOMMENDATIONS.md** - Complete roadmap
- ✅ **FRAMEWORK_COMPARISON.md** - From previous session

All analysis complete. Ready for decision-making and implementation.
