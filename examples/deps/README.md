# Dependencies Example

This example demonstrates Phase 2 dependency management - installing npm packages to commando home and importing them in modules.

## What This Does

- Declares `cowsay` as a dependency in `config.yml`
- Auto-installs to `~/.commando/node_modules/` on first run
- Imports and uses `cowsay` in the `moo` module

## Usage

### First Run (Auto-Install)

```bash
cd examples/deps
cmdo moo say hello
```

On first run, you'll see:
```
Installing 1 dependency: cowsay...
 Dependencies installed
Restarting to pick up changes...

 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

### Subsequent Runs (No Install)

```bash
cmdo moo say "Phase 2 is working!"
cmdo moo think "Dependencies are seamless..."
```

## Commands

- `cmdo moo say <text>` - Make a cow say something
- `cmdo moo think <text>` - Make a cow think something (with thought bubbles)

## How It Works

1. **Config** (`.commando/config.yml`):
   ```yaml
   dependencies:
     - cowsay

   modules:
     - ./moo
   ```

2. **Module** (`.commando/moo.ts`):
   ```typescript
   import cowsay from 'cowsay';

   export const say: CommandoCommand = {
     description: 'Make a cow say something',
     execute: async (options, args, context) => {
       const text = args.join(' ');
       console.log(cowsay.say({ text }));
     },
   };
   ```

3. **Magic**:
   - Commando detects missing dependency
   - Runs `bun add cowsay` in `~/.commando/`
   - Exits with code 42
   - Wrapper restarts with `--commando-restarted` flag
   - Module imports work, command executes

## Verify Installation

```bash
# Check what's installed in commando home
ls ~/.commando/node_modules/

# Check package.json
cat ~/.commando/package.json
```
