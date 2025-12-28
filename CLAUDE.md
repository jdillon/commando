# CLAUDE.md

Project-specific guidance for Commando. See `~/.claude/CLAUDE.md` for global preferences.

## Project Quick Reference

**What**: Commando - Modern CLI framework for deployments (TypeScript/Bun)

**Key Files**:

- `README.md` - User-facing feature docs
- `docs/` - Architecture and design docs
- `lib/` - Framework implementation
- `examples/` - Working examples (DO NOT modify in tests)
- `tests/fixtures/` - Use for testing only

**Test command**: `bun test` or `CLAUDECODE=1 bun test` (failures only)

---

## ⚠️ COMMANDO_HOME Architecture (Critical)

**DO NOT redesign this without explicit approval.**

Commando requires `COMMANDO_HOME=~/.commando` with this structure:

```
~/.commando/
├── config/      # User configuration
├── state/       # Runtime state
├── cache/       # Cached data
├── logs/        # Log files
├── plugins/     # User plugins
├── node_modules/ # Installed dependencies
└── package.json  # Package manifest
```

**Current reality:**

- Commando is designed as a single-user install
- The tool expects and requires `~/.commando` to exist with proper structure
- This is a mismatch with Homebrew's Cellar-based approach

**Homebrew strategy:**

- Use brew as an **installation/update mechanism only**
- Formula must bootstrap `~/.commando` structure during install
- Brew installs the package, but cmdo runs from `~/.commando`
- This is intentional - don't "fix" it to be more Homebrew-native

**Future consideration:** May refactor to separate install dir from user data, but not now.

---

## Beads

Use beads MCP tools for ALL issue tracking. Do NOT use TodoWrite or markdown TODOs.

**Do NOT close issues prematurely.** Wait for explicit user verification that the work is complete before closing. Build succeeding is not enough - the user must confirm the feature works as expected.

**Commit format**: Include `Resolves: commando-xxx` or `Related: commando-xxx` in commit messages.
See `bd onboard` for more information.

## Code Conventions

### File Naming

- **kebab-case**: Source code, docs, configs (`my-module.ts`, `api-reference.md`)
- **UPPERCASE**: Only for standard files (`README.md`, `CHANGELOG.md`, `CLAUDE.md`, `LICENSE`)

### Error Handling & Logging

- Use `die(message)` for fatal errors (exits with code 1)
- Use `error(message)` for non-fatal errors
- **ALWAYS use logger** - Import from `lib/logging/logger` or `lib/logging/bootstrap`
- No `console.log/error/warn` except in bash scripts or very early init
- Keep log messages terse

---

## Where to Find Things

**Architecture & Implementation**:

- Bootstrap flow → `lib/cli.ts`
- Module loading → `lib/core.ts`
- Command patterns → `docs/command-patterns.md`
- Examples → `examples/website/.commando/`

**Testing**:

- Test patterns → `tests/`
- Use fixtures in `tests/fixtures/`, not `examples/`

**Design & Research**:

- Decisions → `docs/archive/`
- Experiments → `sandbox/experiments/`
- Active proposals → `sandbox/`
