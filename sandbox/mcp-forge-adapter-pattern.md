# MCP-to-Forge Adapter Pattern

Design document for creating forge CLI modules that wrap MCP servers.

---

## Problem

MCP servers expose tools via JSON-RPC, but CLI usage requires:
- Ergonomic command naming and argument handling
- File output with sensible naming conventions
- Domain-specific defaults baked in
- Integration with forge's logging, config, and context

**Goal**: Establish a repeatable pattern for wrapping any MCP server as a forge module.

---

## Reference Implementation

`wonderland/platform/.forge/figmadesktop.ts` provides the model:

```
.forge/
├── figmadesktop.ts          # Command definitions (public API)
└── figma/
    └── desktop/
        ├── index.ts         # Re-exports
        ├── config.ts        # MCP URL, constants
        ├── client.ts        # createMcpClient() factory
        └── utils.ts         # Output helpers, normalization
```

**Key patterns**:
1. **Client factory** - Creates configured MCP client with error handling
2. **Output utilities** - File naming, stdout vs file, directory creation
3. **Command wrappers** - Named commands with baked-in defaults
4. **Generic escape hatch** - `call` command for raw MCP tool invocation

---

## Proposed Architecture

### Shared Foundation

Create a shared MCP adapter library in `@forge/mcp`:

```typescript
// @forge/mcp/client.ts
export interface McpAdapterConfig {
  name: string;                    // Adapter name (e.g., 'mobile', 'chrome')
  url?: string;                    // For HTTP transport
  command?: string[];              // For stdio transport
  capabilities?: object;
}

export async function createMcpClient(config: McpAdapterConfig): Promise<Client> {
  // Auto-detect transport from config
  // Standardized error handling
  // Connection retry logic
}

// @forge/mcp/output.ts
export function getOutputPath(projectRoot: string, adapter: string, command: string, ext?: string): string;
export function writeOutput(data: string | Buffer, options: OutputOptions): string | null;

// @forge/mcp/discovery.ts
export async function listTools(client: Client): Promise<ToolInfo[]>;
export async function callTool(client: Client, name: string, args: object): Promise<ToolResult>;
```

### Per-Adapter Structure

```
.forge/
├── mobile.ts                 # forge mobile <command>
├── mobile/
│   ├── index.ts
│   ├── config.ts             # URL, device defaults
│   ├── client.ts             # createMobileClient()
│   └── utils.ts              # Device ID normalization, etc.
│
├── chrome.ts                 # forge chrome <command>
├── chrome/
│   ├── index.ts
│   ├── config.ts
│   ├── client.ts
│   └── utils.ts
```

---

## Command Design Principles

### 1. Group by Action Domain

Don't mirror MCP tool names 1:1. Group by user intent:

| MCP Tool | Forge Command |
|----------|---------------|
| `mobile_take_screenshot` | `forge mobile screenshot` |
| `mobile_save_screenshot` | `forge mobile screenshot --save` |
| `mobile_click_on_screen_at_coordinates` | `forge mobile tap 100 200` |
| `mobile_list_available_devices` | `forge mobile devices` |

### 2. Sensible Defaults

```typescript
// Bad: expose all MCP params
forge mobile tap --x 100 --y 200 --duration 0.1 --device sim_123

// Good: positional args, optional device
forge mobile tap 100 200
forge mobile tap 100 200 --device sim_123
```

### 3. Standard Options

Every adapter should support:
- `--file <path>` - Output to specific file
- `-` as file value - Output to stdout
- `--json` - JSON output format
- `--quiet` - Suppress progress messages
- `--device` / `--page` / `--target` - Target selection (adapter-specific)

### 4. Escape Hatch

Every adapter gets a raw `call` command:

```bash
forge mobile call mobile_swipe_on_screen --params '{"direction":"up","distance":500}'
forge chrome call evaluate_script --params '{"expression":"document.title"}'
```

---

## Target MCPs

### mobile-mcp (mobile-next/mobile-mcp)

**Transport**: stdio (`npx @anthropic/mobile-mcp`)
**URL**: https://github.com/mobile-next/mobile-mcp

**Proposed Commands**:

```bash
# Device management
forge mobile devices              # List available simulators/emulators
forge mobile info                 # Current device info (size, orientation)
forge mobile orientation [mode]   # Get or set orientation

# App management
forge mobile apps                 # List installed apps
forge mobile launch <bundle-id>   # Launch app
forge mobile kill <bundle-id>     # Terminate app
forge mobile install <path>       # Install .ipa/.apk
forge mobile uninstall <bundle-id>

# Screen capture
forge mobile screenshot           # Save to tmp/mobile/
forge mobile screenshot --file ./shot.png
forge mobile elements             # List UI elements with coords

# Interaction
forge mobile tap <x> <y>          # Tap coordinates
forge mobile tap --element "Submit"  # Tap by accessibility label (future)
forge mobile swipe <direction>    # up/down/left/right
forge mobile type "hello world"   # Type text
forge mobile button <name>        # HOME, BACK, etc.
forge mobile open <url>           # Open URL in browser

# Raw access
forge mobile call <tool> --params '{...}'
forge mobile tools                # List all MCP tools
```

### chrome-devtools-mcp

**Transport**: stdio (`npx chrome-devtools-mcp@latest`)
**URL**: https://github.com/ChromeDevTools/chrome-devtools-mcp

**Proposed Commands**:

```bash
# Page management
forge chrome pages                # List open pages
forge chrome new [url]            # Open new tab
forge chrome goto <url>           # Navigate current page
forge chrome close                # Close current page
forge chrome select <index>       # Switch to tab

# Screenshots & DOM
forge chrome screenshot           # Capture current page
forge chrome snapshot             # DOM snapshot (HTML)

# Debugging
forge chrome console              # List console messages
forge chrome console --filter error
forge chrome eval "<js>"          # Evaluate JavaScript
forge chrome network              # List network requests
forge chrome request <id>         # Get request details

# Input automation
forge chrome click <selector>     # Click element
forge chrome fill <selector> <value>
forge chrome type <text>          # Type into focused element
forge chrome key <key>            # Press key

# Performance
forge chrome perf start           # Start trace
forge chrome perf stop            # Stop and save trace
forge chrome perf analyze         # Get insights

# Raw access
forge chrome call <tool> --params '{...}'
forge chrome tools
```

---

## Wizard Design

Interactive command to scaffold a new MCP adapter:

```bash
forge mcp init
```

**Flow**:
1. Prompt for MCP server details (npm package or URL)
2. Connect and discover available tools
3. Group tools into command categories
4. Generate skeleton module structure
5. Output to `.forge/<name>/` directory

**Generated skeleton**:
```typescript
// .forge/example.ts (generated)
import { chalk, createLogger, type ForgeCommand, type ForgeContext } from '@forge/command';
import { createExampleClient } from './example/client';

export const __module__ = {
  description: 'Example MCP client commands',
};

// === Generated from MCP tool: example_list_items ===
export const list: ForgeCommand = {
  description: 'List items',

  defineCommand: (cmd) => {
    cmd.option('--json', 'JSON output');
    cmd.option('--file <path>', 'Output file (use "-" for stdout)');
  },

  execute: async (options, args, context: ForgeContext) => {
    const client = await createExampleClient();
    try {
      const result = await client.callTool({
        name: 'example_list_items',
        arguments: {},
      });
      // TODO: Format and output result
      console.log(JSON.stringify(result.content, null, 2));
    } finally {
      await client.close();
    }
  },
};

// ... more generated commands ...

// Escape hatch
export const call: ForgeCommand = { /* generic call implementation */ };
export const tools: ForgeCommand = { /* list tools */ };
```

---

## Skill Instructions

Create `.claude/skills/forge/mcp-adapter.md` to teach Claude how to:

1. **Analyze MCP server** - Connect, list tools, understand capabilities
2. **Design command structure** - Group tools, choose names, define options
3. **Generate skeleton** - Create files following the pattern
4. **Implement commands** - Fill in business logic, error handling
5. **Test and iterate** - Verify functionality, refine UX

See separate document: `mcp-adapter-skill.md`

---

## Implementation Plan

```
Phase 1: Foundation
├── Create @forge/mcp shared library (client, output, discovery)
├── Refactor figmadesktop to use shared library
└── Document the pattern

Phase 2: Mobile Adapter
├── Implement forge mobile module
├── Cover core commands (devices, screenshot, tap, swipe)
└── Test with iOS Simulator

Phase 3: Chrome Adapter
├── Implement forge chrome module
├── Cover core commands (pages, screenshot, console, eval)
└── Test with live browser

Phase 4: Wizard
├── Create forge mcp init command
├── MCP discovery and tool grouping
└── Template generation

Phase 5: Skill
├── Write mcp-adapter.md skill
├── Test with Claude creating a new adapter
└── Iterate on instructions
```

---

## Open Questions

1. **Shared library location** - `@forge/mcp` in forge core, or `lib/mcp/` in platform?
2. **Device/page state** - Should adapters remember last-used device/page?
3. **Wizard output** - Generate to `.forge/` or `lib/` for more permanent adapters?
4. **Auth handling** - Some MCPs need env vars (API keys). Standard pattern?

---

## References

- [figmadesktop.ts](../../../cirqil/wonderland/platform/.forge/figmadesktop.ts) - Reference implementation
- [mobile-mcp](https://github.com/mobile-next/mobile-mcp) - Target MCP
- [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) - Target MCP
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) - Official TS SDK
- [mcp-cli-tools-comparison.md](./mcp-cli-tools-comparison.md) - CLI alternatives research
