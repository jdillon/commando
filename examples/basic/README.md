# Basic Example

Minimal Commando module demonstrating simple command patterns.

## What This Demonstrates

- **Ultra-simple command** (`ping`) - No options, no args, just works
- **Command with options** (`greet`) - Arguments and flags
- **Module metadata** (`__module__`) - Customize group name and description
- **Config integration** - Command reads from settings

## Structure

```
basic/
├── .commando/
│   ├── config.yml      # Commando configuration
│   ├── simple.ts       # Command module
│   └── .gitignore
└── README.md
```

## Try It

```bash
# From this directory
cd examples/basic

# Run commands
cmdo basic ping
cmdo basic greet
cmdo basic greet Alice
cmdo basic greet --loud
cmdo basic greet Alice --loud
```

## Commands

### `basic ping`

Simple command with no arguments or options.

**Output**: `pong!`

### `basic greet [name] [--loud]`

Greet someone by name.

**Arguments**:
- `name` - Optional. Name to greet (defaults to config value or "World")

**Options**:
- `-l, --loud` - Use uppercase

**Examples**:
```bash
cmdo basic greet                # Hello, Commando User!
cmdo basic greet Alice          # Hello, Alice!
cmdo basic greet --loud         # HELLO, COMMANDO USER!
cmdo basic greet Bob --loud     # HELLO, BOB!
```

## Module Code

See `.commando/simple.ts` for the implementation. Key features:

1. **Module metadata** - Uses `__module__` export to customize group name:
   ```typescript
   export const __module__: CommandoModuleMetadata = {
     group: 'basic',
     description: 'Basic example commands'
   };
   ```

2. **Simple command** - Just an object with `description` and `execute`:
   ```typescript
   export const ping = {
     description: 'Simple ping command',
     execute: async (options, args, context) => {
       console.log('pong!');
     }
   };
   ```

3. **Command with options** - Use `defineCommand` to add arguments/flags:
   ```typescript
   export const greet: CommandoCommand = {
     description: 'Greet someone',
     defineCommand: (cmd) =>
       cmd.argument('[name]', '...').option('-l, --loud', '...'),
     execute: async (options, args, context) => {
       // Implementation
     }
   };
   ```

4. **Config integration** - Read settings from context:
   ```typescript
   const defaultName = context.settings.defaultName || 'World';
   ```

## Config

See `.commando/config.yml`:

```yaml
modules:
  - ./simple

settings:
  basic.greet:
    defaultName: Commando User
```

## Comparison with Website Example

**Basic example** (this):
- Minimal setup
- Simple commands
- Good starting point

**Website example** (`../website/`):
- More complex commands
- Multiple modules
- State management
- External integrations
- Production patterns

Start here, then look at the website example for advanced patterns.
