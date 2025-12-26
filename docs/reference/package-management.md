# Package Management Strategy for Commando

**Key Insight**: Use Bun's package manager for modules, not just npm packages!

---

## The Big Idea

Instead of git-cloning modules like we planned, **use Bun's package manager**:

```bash
# Old plan (git-based):
git clone https://github.com/user/commando-module-aws ~/.commando/modules/aws

# New plan (npm-based):
cd ~/.commando
bun add @commando-modules/aws

# Or even simpler (from project):
cd my-project
cmdo module add aws
# → Installs to ~/.commando/node_modules/@commando-modules/aws
```

**Why this is brilliant:**
- ✅ Versioning (semantic versioning, not git SHAs)
- ✅ Dependency resolution (modules can depend on other modules)
- ✅ Lock files (reproducible installs)
- ✅ Security auditing (`bun pm audit`)
- ✅ Updates (`bun update @commando-modules/aws`)
- ✅ Private registries (for your company modules)

---

## Module Distribution Models

### Option 1: npm Registry (Public Modules)

**Publish modules to npm:**
```bash
# Module author publishes
cd commando-module-aws
bun publish

# Users install
cmdo module add aws
# → bun add @commando-modules/aws
```

**Pros:**
- ✅ Standard tooling
- ✅ Version management
- ✅ Easy discovery
- ✅ CDN distribution

**Cons:**
- ⚠️ npm supply chain risks (need vetting)
- ⚠️ Namespace squatting (@commando-modules/...)

---

### Option 2: Git URLs (Like Cargo/Go)

**Install directly from git:**
```bash
cmdo module add https://github.com/user/commando-module-aws
# → bun add github:user/commando-module-aws
```

**Supports:**
- GitHub: `github:user/repo`
- GitLab: `gitlab:user/repo`
- Bitbucket: `bitbucket:user/repo`
- Git URLs: `git+https://github.com/user/repo.git#v1.2.3`

**Pros:**
- ✅ No npm needed
- ✅ Version via git tags
- ✅ Private repos (via SSH keys)

**Cons:**
- ⚠️ No central registry
- ⚠️ Harder to discover modules

---

### Option 3: Hybrid (Recommended)

**Official modules** → npm (@commando-modules/...)
**Community modules** → git URLs
**Private modules** → Private npm registry or git

```bash
# Official (vetted)
cmdo module add aws
# → bun add @commando-modules/aws

# Community (git)
cmdo module add https://github.com/someuser/commando-module-custom

# Private (company registry)
cmdo module add @mycompany/commando-module-internal
# → Uses private npm registry
```

---

## Bun Package Manager Features

### 1. Fast Installation

```bash
# Bun is FAST (faster than npm, yarn, pnpm)
bun add picocolors pino ora
# Installs in ~100ms
```

### 2. Workspaces (Monorepo Support)

```json
{
  "workspaces": [
    "modules/*"
  ]
}
```

**Use case:** Develop multiple modules together
```
~/.commando/
├── package.json
├── node_modules/
└── modules/
    ├── aws/
    │   └── package.json
    └── kubernetes/
        └── package.json
```

### 3. Lock Files

```bash
# bun.lockb ensures reproducible installs
bun install

# Commit to git
git add bun.lockb
```

### 4. Dependency Management

```bash
# Add dependency
bun add picocolors

# Add dev dependency
bun add -d bun-types

# Remove dependency
bun remove picocolors

# Update all
bun update

# Update specific package
bun update picocolors

# List installed
bun pm ls

# Check for outdated
bun pm outdated
```

### 5. Security Auditing

```bash
# Check for vulnerabilities
bun pm audit

# Show dependency tree
bun pm ls --all
```

---

## Proposed Module Management CLI

### Install Module

```bash
cmdo module add aws
cmdo module add github:user/commando-module-custom
cmdo module add https://github.com/user/repo.git#v1.2.3
```

**Implementation:**
```typescript
// lib/module-manager.ts
export async function installModule(spec: string) {
  const paths = getCommandoPaths();

  // Change to commando installation directory
  process.chdir(paths.data);

  // Use Bun to install
  if (spec.startsWith('http') || spec.includes(':')) {
    // Git URL
    await $`bun add ${spec}`;
  } else {
    // npm package
    await $`bun add @commando-modules/${spec}`;
  }

  console.log(`✓ Installed module: ${spec}`);
}
```

### List Modules

```bash
cmdo module list
```

**Shows:**
```
Installed modules:
  aws@2.1.0          (from npm)
  kubernetes@1.5.2   (from npm)
  custom@1.0.0       (from github:user/custom)

Available commands:
  aws:sync, aws:invalidate, aws:costs
  k8s:deploy, k8s:logs, k8s:rollback
  custom:foo, custom:bar
```

### Update Modules

```bash
# Update all modules
cmdo module update

# Update specific module
cmdo module update aws

# Check for updates
cmdo module outdated
```

**Implementation:**
```typescript
export async function updateModules(moduleName?: string) {
  const paths = getCommandoPaths();
  process.chdir(paths.data);

  if (moduleName) {
    await $`bun update @commando-modules/${moduleName}`;
  } else {
    await $`bun update`;
  }

  console.log('✓ Modules updated');
}
```

### Audit Security

```bash
cmdo module audit
```

**Shows vulnerabilities in installed modules:**
```
Auditing modules...

Found 2 vulnerabilities:

  High: Prototype pollution in lodash@4.17.19
    Fix: bun update lodash

  Low: ReDoS in semver@5.7.0
    Fix: bun update semver

Run 'cmdo module update' to fix.
```

### Remove Module

```bash
cmdo module remove aws
```

---

## Module Structure

### Published Module Format

```
@commando-modules/aws/
├── package.json
├── module.ts          # Main export
├── commands/
│   ├── sync.ts
│   ├── invalidate.ts
│   └── costs.ts
├── lib/
│   └── aws-helpers.ts
└── README.md
```

**package.json:**
```json
{
  "name": "@commando-modules/aws",
  "version": "2.1.0",
  "type": "module",
  "main": "module.ts",
  "exports": {
    ".": "./module.ts"
  },
  "keywords": ["commando", "commando-module", "aws"],
  "dependencies": {
    "picocolors": "^1.0.0"
  },
  "peerDependencies": {
    "@commando/core": "^2.0.0"
  }
}
```

**module.ts:**
```typescript
import type { CommandoConfig } from '@commando/core';
import { $ } from 'bun';

export default {
  commands: {
    'aws:sync': {
      description: 'Sync to S3',
      execute: async (args) => {
        const bucket = args[0];
        await $`aws s3 sync . s3://${bucket}/`;
      }
    },

    'aws:costs': {
      description: 'Show AWS costs',
      execute: async () => {
        const result = await $`aws ce get-cost-and-usage ...`.json();
        console.log(result);
      }
    }
  }
} satisfies Partial<CommandoConfig>;
```

---

## Safe Package Updates

### Strategy 1: Conservative Updates

```bash
# Only update patch versions (1.2.x)
cmdo module update --patch

# Check what would update first
cmdo module outdated
```

### Strategy 2: Review Before Update

```bash
# Show what would change
cmdo module update --dry-run

# Review changelog
cmdo module changelog aws

# Then update
cmdo module update aws
```

### Strategy 3: Lock Major Versions

```json
{
  "dependencies": {
    "@commando-modules/aws": "^2.1.0",  // Allow 2.x.x
    "@commando-modules/k8s": "~1.5.0"   // Allow 1.5.x only
  }
}
```

### Strategy 4: Automated Audits

```bash
# Add to cron or CI
cmdo module audit --json > /tmp/audit.json

# Alert if vulnerabilities found
if [ -s /tmp/audit.json ]; then
  notify "Security vulnerabilities in commando modules!"
fi
```

---

## Private Module Registry

For company-internal modules:

### Setup (One Time)

```bash
# Configure private registry
echo "registry = \"https://npm.company.com\"" >> ~/.bunfig.toml

# Or per-project
cat > ~/.commando/.bunfig.toml <<EOF
[install]
scopes = {
  "@mycompany" = { url = "https://npm.company.com" }
}
EOF
```

### Publish Private Module

```bash
cd my-company-module
bun publish --registry https://npm.company.com
```

### Install Private Module

```bash
cmdo module add @mycompany/commando-module-internal
# → Uses private registry
```

---

## Module Discovery

### Official Registry (Website)

```
https://commando-modules.dev
```

**Lists vetted modules:**
- @commando-modules/aws
- @commando-modules/kubernetes
- @commando-modules/terraform
- @commando-modules/docker

**Each with:**
- Version history
- Security audit status
- Download stats
- Documentation
- Source code link

### Search

```bash
cmdo module search aws
cmdo module search kubernetes
```

**Implementation:**
```typescript
export async function searchModules(query: string) {
  // Search npm registry
  const response = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=keywords:commando-module+${query}`
  );

  const results = await response.json();

  for (const pkg of results.objects) {
    console.log(`${pkg.package.name}@${pkg.package.version}`);
    console.log(`  ${pkg.package.description}`);
  }
}
```

---

## Dependency Isolation

### Per-Module Dependencies

Modules have their own `node_modules`:

```
~/.commando/
└── node_modules/
    ├── @commando-modules/
    │   ├── aws/
    │   │   ├── module.ts
    │   │   └── node_modules/
    │   │       └── aws-sdk/
    │   └── kubernetes/
    │       ├── module.ts
    │       └── node_modules/
    │           └── @kubernetes/client-node/
    └── picocolors/
```

**Benefits:**
- ✅ Modules can use different versions of same dep
- ✅ No global dependency conflicts
- ✅ Clear ownership

---

## Migration Path

### Phase 1: Manual Install (Now)
```bash
# Just add dependencies manually
cd ~/.commando
bun add picocolors
```

### Phase 2: Module Command (Soon)
```bash
cmdo module add aws
# → Calls bun add under the hood
```

### Phase 3: Module Registry (Later)
- Publish official @commando-modules/aws
- Build commando-modules.dev website
- Community contributions

---

## Comparison: Git vs npm

| Feature | Git Modules | npm Modules | Winner |
|---------|-------------|-------------|--------|
| Versioning | Git tags | Semver | **npm** |
| Dependencies | Manual | Automatic | **npm** |
| Updates | `git pull` | `bun update` | **npm** |
| Security audit | Manual | `bun pm audit` | **npm** |
| Private modules | SSH keys | Private registry | Tie |
| Discovery | README lists | npm search | **npm** |
| Offline install | Clone once | Lock file | Tie |

**Verdict:** npm-based is better for **everything except trust**.

---

## Trust Model

### Official Modules (@commando-modules/*)

**Vetted and maintained by commando team:**
- ✅ Code review required
- ✅ Security audit before publish
- ✅ Locked down npm publish access
- ✅ Signed commits

### Community Modules (git URLs)

**Use at your own risk:**
- ⚠️ Not vetted by commando team
- ⚠️ Review code before use
- ⚠️ Pin to specific git SHA

### Private Modules (@company/*)

**Your company's responsibility:**
- Use internal npm registry
- Internal code review process
- Internal security scanning

---

## Implementation Checklist

### Core Framework
- [ ] Add `getCommandoPaths().modules` = `node_modules/@commando-modules`
- [ ] Module search path: project > user > system
- [ ] Load modules from `node_modules/@commando-modules/*`

### CLI Commands
- [ ] `cmdo module add <name|url>`
- [ ] `cmdo module remove <name>`
- [ ] `cmdo module list`
- [ ] `cmdo module update [name]`
- [ ] `cmdo module audit`
- [ ] `cmdo module search <query>`
- [ ] `cmdo module outdated`

### Module Publishing
- [ ] Create @commando-modules npm organization
- [ ] Publish first official module (@commando-modules/aws)
- [ ] Module authoring guide
- [ ] Module submission process

### Security
- [ ] Automated security scanning (CI)
- [ ] Dependency audit in CI
- [ ] Lock file verification
- [ ] SBOM generation

---

## Example: Full Workflow

### As Module User

```bash
# Initial setup
git clone https://github.com/jdillon/commando ~/.commando
cd ~/.commando
bun install  # Installs commando core deps

# Add modules
cmdo module add aws
cmdo module add kubernetes

# Use in project
cd ~/my-project
cmdo aws:sync my-bucket
cmdo k8s:deploy staging

# Update modules (monthly)
cmdo module outdated
cmdo module audit
cmdo module update

# Everything safe and up to date! ✓
```

### As Module Author

```bash
# Create module
mkdir commando-module-aws
cd commando-module-aws

cat > package.json <<EOF
{
  "name": "@commando-modules/aws",
  "version": "1.0.0",
  "main": "module.ts",
  "keywords": ["commando", "commando-module", "aws"]
}
EOF

cat > module.ts <<EOF
export default {
  commands: {
    'aws:sync': { ... }
  }
};
EOF

# Publish
bun publish

# Users can now:
# cmdo module add aws
```

---

## Conclusion: Why This Beats Bash

| Aspect | Bash + Git Modules | Bun + npm Modules |
|--------|-------------------|-------------------|
| Install | `git clone ...` | `cmdo module add aws` |
| Update | Manual `git pull` | `cmdo module update` |
| Versions | Git SHAs | Semantic versions |
| Dependencies | None | Automatic |
| Security | Manual review | `cmdo module audit` |
| Private modules | SSH complexity | npm registry |
| Discovery | README lists | `cmdo module search` |

**Bun's package manager turns modules into a first-class feature.**

This is actually **better** than most plugin systems (including Bash, Vim, etc.)!
