# Subcommand Groups

Commands are organized under groups for clear namespacing.

---

## Usage

```bash
# Grouped commands
cmdo website build
cmdo website deploy
cmdo examples hello

# Top-level commands (no group)
cmdo version
cmdo help
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
# .commando/config.yml
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
cmdo website build      # From website.ts
cmdo website deploy     # From website.ts
cmdo examples hello     # From examples.ts
cmdo examples deploy    # From examples.ts (separate namespace!)
cmdo version            # From utils.ts (top-level)
```

---

## Group Help

Each group has its own help:

```bash
cmdo website --help
# Shows:
#   Commands:
#     build    Build website
#     deploy   Deploy website

cmdo examples --help
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
export const deploy = { ... };  // cmdo website deploy

// examples.ts
export const deploy = { ... };  // cmdo examples deploy
```

No conflicts - they're in different namespaces.

---

## Commander Integration

Under the hood, each group is a Commander subcommand:

```typescript
// Framework creates this structure:
const program = new Command('cmdo');

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

**Result**: `cmdo website build` (not `cmdo website-deployment build`)

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
- `cmdo version` (not `cmdo utils version`)
- `cmdo config` (not `cmdo utils config`)

---

## Benefits

✅ **Clear organization** - Related commands grouped together
✅ **Namespace separation** - Avoid name conflicts
✅ **Discoverable** - `cmdo --help` shows groups, `cmdo <group> --help` shows commands
✅ **Automatic** - Group name from filename, override if needed
✅ **Optional** - Can still have top-level commands

---

## See Also

- [Auto-Discovery](auto-discovery.md) - How commands are discovered
- [Module Metadata](module-metadata.md) - Customize groups with `__module__`
- [Commander Integration](commander-integration.md) - How Commander.js powers this
