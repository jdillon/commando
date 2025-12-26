# Module Sharing Without npmjs

**Goal**: Share commando modules privately without publishing to public npmjs registry

---

## The Problem

We want to:
- ✅ Use Bun's package manager (versions, deps, lock files)
- ✅ Share modules across team/projects
- ✅ Keep modules private (not on public npmjs)
- ✅ Avoid complex infrastructure

---

## Solution: Git-Based npm Packages

Bun (and npm) support installing packages directly from git repos!

### Basic Git Install

```bash
# Install from GitHub
bun add github:user/commando-module-aws

# Install from GitLab
bun add gitlab:user/commando-module-aws

# Install from any git URL
bun add git+https://github.com/user/commando-module-aws.git

# Install from private repo (uses SSH)
bun add git+ssh://git@github.com/user/private-module.git

# Install specific version/branch/tag
bun add github:user/commando-module-aws#v1.2.3
bun add github:user/commando-module-aws#main
bun add github:user/commando-module-aws#feature-branch
```

### How It Works

**1. Create module as git repo:**
```
commando-module-aws/
├── package.json      # Standard npm package.json
├── module.ts         # Your module code
├── README.md
└── .gitignore
```

**2. package.json:**
```json
{
  "name": "@mycompany/commando-module-aws",
  "version": "1.2.3",
  "main": "module.ts",
  "type": "module",
  "dependencies": {
    "picocolors": "^1.0.0"
  }
}
```

**3. Push to git:**
```bash
git init
git add .
git commit -m "Initial module"
git tag v1.2.3
git push origin main --tags
```

**4. Install from git:**
```bash
cd ~/.local/share/commando
bun add github:mycompany/commando-module-aws#v1.2.3
```

**5. Bun creates entry in package.json:**
```json
{
  "dependencies": {
    "@mycompany/commando-module-aws": "github:mycompany/commando-module-aws#v1.2.3"
  }
}
```

---

## cmdo module add Wrapper

Make it even simpler with `cmdo module add`:

```bash
# User-friendly command
cmdo module add github:mycompany/commando-module-aws

# Behind the scenes
cd ~/.local/share/commando
bun add github:mycompany/commando-module-aws
```

---

## Private Repositories

### GitHub Private Repos

**Option 1: SSH keys** (recommended)
```bash
# Add SSH key to GitHub account
# Then install works automatically
bun add git+ssh://git@github.com/mycompany/private-module.git
```

**Option 2: Personal Access Token**
```bash
# In ~/.netrc or environment
export GIT_TOKEN=ghp_your_token_here

# Install with token in URL (not recommended - visible in package.json)
bun add git+https://${GIT_TOKEN}@github.com/mycompany/private-module.git
```

**Option 3: GitHub Packages** (more complex)
- Can use GitHub's npm registry
- Requires .npmrc configuration
- More auth setup

### GitLab Private Repos

```bash
# SSH (recommended)
bun add git+ssh://git@gitlab.com/mycompany/private-module.git

# Deploy token
bun add git+https://gitlab-ci-token:${CI_JOB_TOKEN}@gitlab.com/mycompany/module.git
```

---

## Versioning with Git Tags

### Semantic Versioning

```bash
# Create releases with git tags
git tag v1.0.0
git push origin v1.0.0

# Install specific version
bun add github:user/module#v1.0.0

# Install latest on branch
bun add github:user/module#main
```

### In package.json

```json
{
  "dependencies": {
    "commando-module-aws": "github:mycompany/commando-module-aws#v1.2.3",
    "commando-module-k8s": "github:mycompany/commando-module-k8s#v2.0.0"
  }
}
```

### Updating

```bash
# Check for updates (need to check git tags manually)
git ls-remote --tags https://github.com/mycompany/commando-module-aws

# Update to new version
bun add github:mycompany/commando-module-aws#v1.3.0

# Or let bun update handle it
bun update commando-module-aws
```

---

## Module Registry Alternatives

### 1. Git-Only (Simplest) ⭐

**Pros:**
- ✅ No infrastructure needed
- ✅ Use existing GitHub/GitLab
- ✅ Works with private repos
- ✅ Git tags = versions

**Cons:**
- ⚠️ No central search/discovery
- ⚠️ Need to know git URLs
- ⚠️ Slower than npm registry

**Use when:** Small team, few modules, already using git hosting

---

### 2. Self-Hosted npm Registry (Verdaccio)

**Setup:**
```bash
# Install verdaccio
npm install -g verdaccio

# Run
verdaccio

# Runs on http://localhost:4873
```

**Configure .npmrc:**
```
registry=http://localhost:4873
```

**Publish:**
```bash
npm publish --registry http://localhost:4873
```

**Pros:**
- ✅ Full npm registry features
- ✅ Fast package installs
- ✅ Search/discovery
- ✅ Can proxy public npmjs

**Cons:**
- ⚠️ Need to run/maintain server
- ⚠️ More infrastructure

**Use when:** Larger team, many modules, want npm UX

---

### 3. GitHub Packages Registry

**Setup in package.json:**
```json
{
  "name": "@mycompany/commando-module-aws",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

**Configure .npmrc:**
```
@mycompany:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**Publish:**
```bash
npm publish
```

**Pros:**
- ✅ Integrated with GitHub
- ✅ Real npm registry
- ✅ Access control via GitHub

**Cons:**
- ⚠️ Requires GitHub account/auth
- ⚠️ Only works with GitHub

**Use when:** Already on GitHub, want registry features

---

### 4. GitLab Package Registry

Similar to GitHub Packages, but on GitLab.

---

## Recommended Approach: Hybrid

### For Official/Shared Modules:
**GitHub/GitLab with git tags**
```bash
cmdo module add github:mycompany/commando-module-aws#v1.2.3
```

**Pros:**
- Simple
- No infrastructure
- Works immediately

### For Active Development:
**Local workspaces during development**
```bash
# In ~/.local/share/commando/package.json
{
  "workspaces": ["modules/aws"]
}

# Link local module for development
cd modules/aws
bun link

# In project
bun link @mycompany/commando-module-aws
```

### For Large Teams (Optional):
**Self-hosted Verdaccio** if you have many modules and want discovery.

---

## cmdo module Command Design

### Add Module

```bash
# From git
cmdo module add github:mycompany/commando-module-aws

# Specific version
cmdo module add github:mycompany/commando-module-aws@v1.2.3

# From URL
cmdo module add https://github.com/mycompany/commando-module-aws.git

# Local development
cmdo module add ./path/to/local/module

# Behind the scenes: cd ~/.local/share/commando && bun add <spec>
```

### List Modules

```bash
cmdo module list

# Output:
# Installed modules:
#   aws (v1.2.3) - github:mycompany/commando-module-aws
#   k8s (v2.0.0) - github:mycompany/commando-module-k8s
```

### Update Modules

```bash
# Check for updates
cmdo module outdated

# Output:
# Updates available:
#   aws: v1.2.3 → v1.3.0
#   k8s: v2.0.0 (latest)

# Update specific
cmdo module update aws

# Update all
cmdo module update
```

### Search (Future)

```bash
# Search GitHub org
cmdo module search aws --org mycompany

# List from GitHub org
cmdo module browse --org mycompany
```

---

## Module Registry Document

Create a central registry doc in your company repo:

```markdown
# Commando Modules

Available commando modules for our team:

## Infrastructure

- **commando-module-aws** - AWS deployment helpers
  - Install: `cmdo module add github:mycompany/commando-module-aws`
  - Latest: v1.2.3
  - Docs: https://github.com/mycompany/commando-module-aws

- **commando-module-k8s** - Kubernetes deployment
  - Install: `cmdo module add github:mycompany/commando-module-k8s`
  - Latest: v2.0.0

## CI/CD

- **commando-module-github-actions** - GitHub Actions helpers
  - Install: `cmdo module add github:mycompany/commando-module-github-actions`

...
```

---

## Example: Complete Workflow

### 1. Create Module Repo

```bash
mkdir commando-module-aws
cd commando-module-aws

cat > package.json <<EOF
{
  "name": "@mycompany/commando-module-aws",
  "version": "1.0.0",
  "main": "module.ts",
  "type": "module"
}
EOF

cat > module.ts <<EOF
export default {
  commands: {
    's3-sync': {
      description: 'Sync to S3',
      execute: async (args) => {
        // Implementation
      }
    }
  }
};
EOF

git init
git add .
git commit -m "Initial module"
git tag v1.0.0
git remote add origin git@github.com:mycompany/commando-module-aws.git
git push origin main --tags
```

### 2. Install in Commando

```bash
# Install commando module globally
cd ~/.local/share/commando
bun add github:mycompany/commando-module-aws#v1.0.0

# Or use wrapper
cmdo module add github:mycompany/commando-module-aws
```

### 3. Use in Project

```typescript
// project/.commando/config.ts
import type { CommandoConfig } from '@commando/core';

export default {
  modules: ['@mycompany/commando-module-aws'],

  commands: {
    'deploy': {
      description: 'Deploy to AWS',
      execute: async (args) => {
        // Module commands are auto-loaded
        // Can reference them or add project-specific commands
      }
    }
  }
} satisfies CommandoConfig;
```

### 4. Update Later

```bash
# In module repo
git tag v1.1.0
git push origin --tags

# Update in commando
cmdo module update @mycompany/commando-module-aws
```

---

## Comparison Matrix

| Approach | Setup | Private | Discovery | Speed | Versions |
|----------|-------|---------|-----------|-------|----------|
| **Git URLs** | None | ✅ SSH | Manual | Slow | Tags |
| **GitHub Packages** | Medium | ✅ | ✅ | Fast | Semver |
| **Verdaccio** | Medium | ✅ | ✅ | Fast | Semver |
| **GitLab Registry** | Medium | ✅ | ✅ | Fast | Semver |

---

## Recommendation

**Start with git URLs:**
```bash
cmdo module add github:mycompany/commando-module-aws#v1.2.3
```

**Pros:**
- Zero infrastructure
- Works immediately
- Private via SSH keys
- Good enough for most teams

**Later, if needed:**
- Add Verdaccio for discoverability
- Or migrate to GitHub Packages

**Keep it simple first!**

---

## Notes for Implementation

### Core Changes Needed

1. **Module loading** - Support loading from `node_modules/@mycompany/`
2. **cmdo module add** - Wrapper around `bun add`
3. **Module discovery** - Search git repos or registry
4. **Version management** - Check git tags or registry

### Files to Create

- `lib/module-manager.ts` - Module installation/management
- `docs/module-authoring.md` - How to create modules
- `docs/module-registry.md` - Company module list template

---

## Next Session Continuation Points

1. **Implement `cmdo module` commands**
   - `add`, `remove`, `list`, `update`, `outdated`

2. **Test with real module**
   - Create commando-module-aws as example
   - Install from git
   - Verify it works

3. **Add sexy terminal output**
   - ora spinners for install
   - chalk colors for status
   - boxen for success messages

4. **Document module authoring**
   - Template repo
   - Best practices
   - Testing strategy
