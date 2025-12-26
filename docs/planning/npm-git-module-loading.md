# npm/git Module Loading

**Status**: Planned
**Priority**: High
**Complexity**: High
**Target Version**: v2.2
**Issue**: [#5](https://github.com/jdillon/forge/issues/5)

---

## Overview

Enable Commando to load modules from npm packages and git repositories, not just local `.commando/` directories.

---

## Motivation

**Why we need this**:
- Makes modules truly reusable across projects
- Leverages existing npm/git ecosystems
- Enables version pinning and dependency management
- Standard pattern for modern development tools

**Current limitation**:
- Modules must be in project's `.commando/` directory
- No version management
- Manual copying required
- No dependency resolution

---

## Dependencies

**Requires**:
- [#2 Module distribution system](https://github.com/jdillon/forge/issues/2) - Must be complete first
- Module registry infrastructure
- Package resolution logic

**Already have**:
- Module loading system in `lib/core.ts`
- State management for tracking installed modules

---

## Design

### Module Sources

**Support three source types**:

1. **Local filesystem** (current, keep for compatibility)
   ```
   .commando/
   └── commands/
       └── mycommand.ts
   ```

2. **npm packages**
   ```json
   {
     "commandoModules": {
       "@myorg/commando-aws": "^1.2.0",
       "commando-terraform": "~2.0.1"
     }
   }
   ```

3. **git repositories**
   ```yaml
   # .commando/config.yml
   modules:
     - github:jdillon/commando-website#v1.0.0
     - gitlab:myorg/commando-custom#main
     - git+ssh://git@private.com/repo.git#feature-branch
   ```

### Architecture

```
┌───────────────────────────────────────────┐
│         Module Resolution                 │
├───────────────────────────────────────────┤
│  1. Check config.yml for module sources   │
│  2. Resolve each source type:             │
│     • Local: .commando/                  │
│     • npm: node_modules/@org/pkg          │
│     • git: .commando/cache/git/...       │
│  3. Load modules from resolved locations  │
│  4. Register commands in Commander        │
└───────────────────────────────────────────┘

┌───────────────────┐  ┌────────────────────┐  ┌─────────────────┐
│  Local Resolver   │  │   npm Resolver     │  │  Git Resolver   │
├───────────────────┤  ├────────────────────┤  ├─────────────────┤
│ • Read .commando/│  │ • Read package.json│  │ • Parse git URL │
│ • Load *.ts files │  │ • Install if needed│  │ • Clone/fetch   │
│ • Immediate       │  │ • Load from        │  │ • Checkout ref  │
│                   │  │   node_modules/    │  │ • Cache locally │
└───────────────────┘  └────────────────────┘  └─────────────────┘
```

### Module Resolution Order

**Priority** (first match wins):
1. Local `.commando/` (highest priority, for overrides/development)
2. npm packages in `node_modules/`
3. Git repositories in `.commando/cache/git/`

**Rationale**: Local modules can override installed ones for testing/development

### Configuration Formats

#### Option 1: package.json (npm-style)
```json
{
  "name": "my-project",
  "commandoModules": {
    "@myorg/commando-aws": "^1.2.0",
    "commando-terraform": "~2.0.1"
  },
  "commandoModulesGit": [
    "github:jdillon/commando-website#v1.0.0",
    "gitlab:myorg/commando-custom#main"
  ]
}
```

#### Option 2: .commando/config.yml (current config file)
```yaml
modules:
  # npm packages
  - npm:@myorg/commando-aws@^1.2.0
  - npm:commando-terraform@~2.0.1

  # git repos
  - github:jdillon/commando-website#v1.0.0
  - gitlab:myorg/commando-custom#main
  - git+ssh://git@private.com/repo.git#feature

  # local (for compatibility)
  - local:./custom-commands
```

#### Option 3: Hybrid (recommended)
- Use `package.json` for npm packages (standard node workflow)
- Use `.commando/config.yml` for git sources (keeps commando config together)

### npm Package Structure

**Commando module as npm package**:

```
@myorg/commando-aws/
├── package.json
│   {
│     "name": "@myorg/commando-aws",
│     "version": "1.2.0",
│     "main": "dist/index.js",
│     "commando": {
│       "group": "aws",
│       "description": "AWS deployment commands"
│     }
│   }
├── dist/
│   ├── index.js           # exports all commands
│   ├── s3.js
│   └── ec2.js
└── README.md
```

**Discovery**: Look for `commando` field in package.json

### Git Repository Structure

**Commando module as git repo**:

```
commando-website/
├── .commandomodule       # Marker file (indicates this is a commando module)
├── package.json           # Standard metadata
├── commands/
│   ├── deploy.ts
│   └── build.ts
└── README.md
```

**Discovery**: Check for `.commandomodule` marker or `commando` in package.json

---

## Implementation Plan

### Phase 1: Module Resolver

1. **Create resolver interface**: `lib/resolvers/`
   ```typescript
   interface ModuleResolver {
       resolve(source: string): Promise<string>; // Returns path to module
       supports(source: string): boolean;
   }
   ```

2. **Implement resolvers**:
   - `LocalResolver`: Already works (`.commando/` loading)
   - `NpmResolver`: Load from `node_modules/`
   - `GitResolver`: Clone/fetch git repos

3. **Update core.ts**: Use resolvers before loading modules

### Phase 2: npm Package Support

1. **Parse package.json**: Read `commandoModules` field
2. **Install packages**: Run `bun install` if packages missing
3. **Discover modules**: Scan `node_modules/` for commando-compatible packages
4. **Load and register**: Use existing module loading logic

### Phase 3: Git Repository Support

1. **Parse git URLs**: Support github:, gitlab:, git+ssh:, git+https:
2. **Clone/fetch**: Use `simple-git` or shell out to `git clone`
3. **Cache**: Store in `.commando/cache/git/<hash>/`
4. **Checkout ref**: Support branches, tags, commit SHAs
5. **Update strategy**: `cmdo module update` re-fetches

### Phase 4: Version Management

1. **Lock file**: Create `.commando/modules.lock` (like package-lock.json)
2. **Version resolution**: Handle semver ranges
3. **Update command**: `cmdo module update [name]`
4. **Prune command**: `cmdo module prune` (remove unused)

---

## Open Questions

1. **npm install integration**:
   - Should `cmdo` run `bun install` automatically?
   - Or require user to run it separately?
   - What about CI/CD environments?

2. **Git authentication**:
   - Use SSH keys (user's git config)?
   - Support tokens in URLs?
   - How to handle private repos?

3. **Caching strategy**:
   - Cache git repos permanently or temporary?
   - Where to store cache (`.commando/cache/` or `~/.cache/commando/`)?
   - How to invalidate cache?

4. **Module namespace conflicts**:
   - What if two packages export same command group?
   - Priority/override rules?
   - Error or merge?

5. **Workspace support**:
   - How to handle monorepos?
   - Support workspaces in package.json?
   - Load modules from multiple projects?

6. **Performance**:
   - Lazy loading of npm/git modules?
   - Cache resolved paths?
   - Parallel loading?

---

## Testing Strategy

1. **Unit tests**:
   - Resolver implementations
   - URL parsing
   - Version resolution

2. **Integration tests**:
   - Load from test npm package
   - Load from test git repo
   - Priority resolution (local > npm > git)

3. **End-to-end tests**:
   - Install module from npm
   - Install module from github
   - Run commands from external modules

---

## Success Criteria

- ✅ Can load modules from npm packages
- ✅ Can load modules from git repositories
- ✅ Version pinning works (semver for npm, refs for git)
- ✅ Local modules override installed ones
- ✅ Existing local-only projects still work (backward compatible)
- ✅ Module installation is fast (<5s for typical module)
- ✅ Clear error messages for resolution failures

---

## Alternatives Considered

**Single source only**:
- npm-only: Simpler, but excludes private git repos
- git-only: Flexible, but no npm ecosystem integration
- Hybrid (recommended): Best of both worlds ✅

**Module discovery**:
- Scan all node_modules: Too slow, many false positives
- Explicit manifest: More control, recommended ✅

**Git storage**:
- Clone to node_modules: Conflicts with npm
- Separate cache: Cleaner, recommended ✅

---

## Security Considerations

1. **Code execution**: External modules run arbitrary code
   - Trust model: User explicitly installs modules
   - Sandboxing: Not practical for CLI framework
   - Best practice: Only install from trusted sources

2. **Supply chain attacks**:
   - npm packages can be compromised
   - Git repos can change after installation
   - Mitigation: Lock file with integrity hashes

3. **Private data**:
   - Modules might access project files/credentials
   - Document security model clearly
   - Recommend reviewing module code before installation

---

## Related

- **Roadmap**: [roadmap.md](./roadmap.md)
- **Issue**: [#5](https://github.com/jdillon/forge/issues/5)
- **Dependency**: [#2 Module distribution](https://github.com/jdillon/forge/issues/2)
- **Module loading**: `lib/core.ts`
- **Module distribution design**: [module-sharing-private.md](./module-sharing-private.md)
