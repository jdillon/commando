# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

---

## Project Quick Reference

**What**: Forge - Modern CLI framework for deployments (TypeScript/Bun)
**Branch**: `module-system` (active development)
**Status**: Working prototype, tests passing

**Key Files**:
- `README.md` - User-facing feature docs
- `docs/` - Architecture and design docs
- `lib/` - Framework implementation
- `examples/` - Working examples (DO NOT modify in tests)
- `tests/fixtures/` - Use for testing only

**Test command**: `bun test` or `CLAUDECODE=1 bun test` (failures only)

---

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

### Changelog & Versioning
- Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- Update `[Unreleased]` section as you work

---

## Where to Find Things

**Architecture & Implementation**:
- Bootstrap flow → `lib/cli.ts`
- Module loading → `lib/core.ts`
- Command patterns → `docs/command-patterns.md`
- Examples → `examples/website/.forge2/`

**Testing**:
- Test patterns → `tests/`
- Use fixtures in `tests/fixtures/`, not `examples/`

**Design & Research**:
- Decisions → `docs/archive/`
- Experiments → `sandbox/experiments/`
- Active proposals → `sandbox/`

---
