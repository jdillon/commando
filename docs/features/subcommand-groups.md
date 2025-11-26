# Subcommand Groups

Commands are organized under groups for clear namespacing.

---

## Usage

```bash
# Grouped commands
forge website build
forge website deploy
forge examples hello

# Top-level commands (no group)
forge version
forge help
```

---

## How Grouping Works

1. **Filename determines group** - `website.ts` → group "website"
2. **Override with `__module__`** - See [Module Metadata](module-metadata.md)
3. **Config.yml lists modules** - Framework builds groups automatically

---

## Example Setup

### Config
```yaml
# .forge/config.yml
modules:
  - ./website
  - ./examples
  - ./utils
```

### Modules
```typescript
// website.ts - auto-grouped as "website"
export const build = { ... };
export const deploy = { ... };

// examples.ts - auto-grouped as "examples"
export default {
  hello: { ... },
  deploy: { ... }
};

// utils.ts - top-level (no group)
export const __module__ = { group: false };
export const version = { ... };
```

### Result
```bash
forge website build      # From website.ts
forge website deploy     # From website.ts
forge examples hello     # From examples.ts
forge examples deploy    # From examples.ts (separate namespace!)
forge version            # From utils.ts (top-level)
```

---

## Group Help

Each group has its own help:

```bash
forge website --help
# Shows:
#   Commands:
#     build    Build website
#     deploy   Deploy website

forge examples --help
# Shows:
#   Commands:
#     hello    Say hello
#     deploy   Deploy example
```

---

## Namespace Benefits

Multiple modules can have same command name:

```typescript
// website.ts
export const deploy = { ... };  // forge website deploy

// examples.ts
export const deploy = { ... };  // forge examples deploy
```

No conflicts - they're in different namespaces.

---

## Commander Integration

Under the hood, each group is a Commander subcommand:

```typescript
// Framework creates this structure:
const program = new Command('forge');

const websiteCmd = new Command('website')
  .description('Website commands');

websiteCmd.addCommand(new Command('build').description('...'));
websiteCmd.addCommand(new Command('deploy').description('...'));

program.addCommand(websiteCmd);
```

---

## Custom Group Names

Override group name with `__module__`:

```typescript
// website-deployment.ts
export const __module__ = {
  group: 'website',  // Not "website-deployment"
  description: 'Website deployment tools'
};

export const build = { ... };
```

**Result**: `forge website build` (not `forge website-deployment build`)

---

## Top-Level Commands

Disable grouping for top-level commands:

```typescript
// utils.ts
export const __module__ = { group: false };

export const version = { ... };
export const config = { ... };
```

**Result**:
- `forge version` (not `forge utils version`)
- `forge config` (not `forge utils config`)

---

## Benefits

✅ **Clear organization** - Related commands grouped together
✅ **Namespace separation** - Avoid name conflicts
✅ **Discoverable** - `forge --help` shows groups, `forge <group> --help` shows commands
✅ **Automatic** - Group name from filename, override if needed
✅ **Optional** - Can still have top-level commands

---

## See Also

- [Auto-Discovery](auto-discovery.md) - How commands are discovered
- [Module Metadata](module-metadata.md) - Customize groups with `__module__`
- [Commander Integration](commander-integration.md) - How Commander.js powers this
