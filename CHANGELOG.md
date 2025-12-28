# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-11-26

First public release. TypeScript/Bun rewrite of the original Bash-based Forge framework.

### Features

- **Module system** - Auto-discovery of commands from `.commando/` directory
- **Command grouping** - Commands grouped by filename (e.g., `website-build.ts` → `cmdo website build`)
- **Layered configuration** - User, project, and local config via cosmiconfig (YAML, JSON, JS, TS)
- **Structured logging** - Pino-based with pretty and JSON output formats
- **Styled CLI** - Commander.js with colored help, smart option handling
- **Output helpers** - Tables, spinners, progress bars, prompts, boxes
- **Installation** - `install.sh` script, meta-project pattern at `~/.commando/`

### Technical

- Runtime: Bun (>=1.0.0)
- CLI parsing: Commander.js 14.x
- Logging: Pino with pino-pretty
- Config: Cosmiconfig with XDG support
- Validation: Zod

---

*Prior history: Original Bash implementation preserved in `forge-bash` branch.*
