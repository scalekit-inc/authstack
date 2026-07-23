---
name: setup-scalekit
description: Installs the Scalekit CLI and plugin, and picks which auth plugin (agentkit vs saaskit) — the pre-install onboarding step. Use when the plugin is not yet installed and the user says 'install Scalekit', 'add the Scalekit plugin for Claude Code / Codex / Copilot / Cursor', 'the plugin is not showing up', or 'which Scalekit plugin do I need'. After install, hand off to setup-agentkit or setup-saaskit; do not implement the integration here.
---

# Setup Scalekit

## Guardrails
- **MUST** prefer the CLI (`scalekit setup`) over the native/direct install commands in Step 3 — those are a fallback only.
- **MUST** verify the plugin appears in the agent's plugin list before moving on.
- **MUST** stop after install + plugin choice and hand off to setup-agentkit or setup-saaskit — this skill does NOT implement the integration.
- **MUST NOT** generate integration/implementation code here.

## Step 1 — Install the CLI (recommended)

The Scalekit CLI detects your tools and installs the authstack plugin (AgentKit + SaaSKit) for you.

```bash
npx @scalekit-inc/cli setup
```

For repeated use:

```bash
npm install -g @scalekit-inc/cli
scalekit setup
```

Target a specific tool:

```bash
scalekit setup claude
scalekit setup cursor
scalekit setup codex
scalekit setup copilot
```

Verify the plugin appears in your agent's plugin list after setup.

## Step 2 — Choose your plugin

| Plugin | Use case |
|--------|----------|
| `agentkit` | AI agent needs OAuth access to third-party services — connections, tool discovery, token storage / refresh |
| `saaskit` | Web app needs login, sessions, SSO, SCIM, MCP server auth, RBAC, or API keys |

## Step 3 — Native / direct install commands (CLI is preferred)

The commands below are the current native forms. Prefer the CLI in Step 1 for most users.

### Claude Code

```
/plugin marketplace add scalekit-inc/authstack
/plugin install agentkit@authstack   # or saaskit@authstack
```

Verify: restart Claude Code, then run `/plugin list` — the plugin should appear as enabled.

### GitHub Copilot

```bash
copilot plugin marketplace add scalekit-inc/authstack
copilot plugin install agentkit@authstack   # or saaskit@authstack
```

Verify: `copilot plugin list` should show the plugin.

### Codex and Cursor

The unified CLI (`scalekit setup codex` / `scalekit setup cursor`) handles download and placement for these tools. Direct installation is managed by the CLI.

### Other agents (OpenCode, Windsurf, Cline, Gemini CLI, 35+)

```bash
npx skills add scalekit-inc/authstack --list              # see available skills
npx skills add scalekit-inc/authstack --skill integrating-agentkit
npx skills add scalekit-inc/authstack --skill implementing-saaskit
npx skills add scalekit-inc/authstack --all                # or install everything
```

## Step 4 — Start building

Describe your goal and the installed skill will guide implementation:

- *"Add OAuth to my MCP server so Claude Desktop can connect"*
- *"Implement login and signup with JWT session management"*
- *"Connect my AI agent to Gmail and Google Calendar"*
- *"Add enterprise SSO to my existing app"*

## Documentation

| Resource | URL | When to use |
|----------|-----|-------------|
| LLM doc index | `https://docs.scalekit.com/llms.txt` | Maps each product to its doc set — start here |
| API reference | `https://docs.scalekit.com/apis` | Full REST API (OpenAPI-generated) |
| Docs sitemap | `https://docs.scalekit.com/sitemap-0.xml` | Find specific guides or pages |
