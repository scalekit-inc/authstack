---
name: setup-agentkit
description: First stop for wiring an AI agent to third-party tools via Scalekit AgentKit — OAuth connections, connected accounts, and tool discovery for Gmail, Slack, Salesforce, and similar. Use when the user says 'add agent auth', 'set up AgentKit', or 'let my agent act in Gmail on a user behalf' and it is unclear which AgentKit skill fits. Routes only and hands the build to the target skill. Not for human sign-in features — that is setup-saaskit.
---

# AgentKit — Where to Start

## Guardrails

- **MUST** route to the right AgentKit skill and stop — this skill does NOT implement the integration.
- **MUST NOT** generate integration/implementation code here; the target skill owns that.
- **MUST** treat the credential block in "Environment setup" as a checklist for the *user* to satisfy — do not attempt to read or write their environment yourself.

---

## Step 1: Determine what to build

If answers aren't already clear from context, ask one question at a time:

1. **What are you building?**
   - New agent that needs to call third-party tools on behalf of users (Gmail, Slack, Salesforce, etc.)
   - Existing agent — adding connector access or fixing auth
   - MCP server that exposes AgentKit tools

2. **What's your current state?**
   - Starting from scratch
   - Have a Scalekit account and environment already
   - Have AgentKit set up, stuck on a specific step

---

## Step 2: Tell the user exactly which skill to invoke

Pick the best match and tell the user: "Run `/agentkit:<skill>` to get started."

| What you're building | Tell them to run |
|---|---|
| New agent calling third-party tools (Gmail, Slack, Salesforce…) on behalf of users | `/agentkit:integrating-agentkit` |
| Existing agent — adding a connector or fixing connected-account / OAuth flow | `/agentkit:integrating-agentkit` |
| Discover tools available for a connector, inspect schemas | `/agentkit:discovering-connector-tools` |
| Expose AgentKit tools over MCP for Claude Desktop, Cursor, VS Code | `/agentkit:exposing-agentkit-via-mcp` |
| Pre-launch checklist, going to production | `/agentkit:production-readiness-agentkit` |
| SDK errors, wrong imports, broken auth calls | `/saaskit:scalekit-code-doctor` |

Before handing off, point the user at the environment checklist in Step 3. Then **stop** — the target skill handles implementation.

---

## Step 3: Environment checklist for the user (if new project)

**Two different credential paths** — do not conflate them:

1. **SDK / app integration** (needed for `integrating-agentkit`, `discovering-connector-tools`, production code): tell the user to confirm these env vars exist before they run the target skill (user action — do not read or set their environment yourself):

```bash
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.com
SCALEKIT_CLIENT_ID=<from dashboard>
SCALEKIT_CLIENT_SECRET=<from dashboard>
```

Get these from [app.scalekit.com](https://app.scalekit.com) → Developers → Settings → API Credentials.

2. **Scalekit MCP server** (`https://mcp.scalekit.com`, pre-configured in `.mcp.json`): used for interactive tool validation in Claude Code / Cursor. OAuth 2.1 for the MCP connection is handled by the client — **no extra env vars for MCP itself**. That does **not** replace the SDK credentials above for application code.

---

## Core AgentKit concepts (30-second orientation)

| Concept | What it is |
|---|---|
| **Connector** | A third-party app (Gmail, Slack, Salesforce, GitHub, etc.) |
| **Connection** | Your app's agreement with a connector (configured in dashboard) |
| **Connected account** | A specific user's authorization to use a connection |
| **Tool** | An action the agent can take (send email, create issue, etc.) |

Flow: User authorizes → connected account created → agent discovers tools → agent executes tool calls using that account.

**Dashboard setup note:** Gmail works without extra configuration. All other connectors (Slack, Salesforce, GitHub, Google Calendar, etc.) must be enabled and configured in the Scalekit Dashboard before users can connect them.

---

## When to switch skills

- **Already know what you need?** Skip this skill and invoke the target directly.
- **SDK errors?** Use `/saaskit:scalekit-code-doctor`.
- **Want to add B2B auth (login, SSO, SCIM) to your app?** Switch to the `saaskit` plugin: `/saaskit:setup-saaskit`.
