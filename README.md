# AuthStack

**AgentKit and SaaSKit for AI coding tools.**
Add agent OAuth, tool calling, SSO, SCIM, MCP auth, and session management to any AI coding tool.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/scalekit-inc/authstack/pulls)

---

### Installation

Pick one path.

**AuthStack plugin** (this repo):

```bash
npx @scalekit-inc/cli setup
```

The wizard detects which AI coding tools you have installed and sets up the right kit. To target a specific tool directly:

```bash
npx @scalekit-inc/cli setup claude
npx @scalekit-inc/cli setup cursor
npx @scalekit-inc/cli setup codex
npx @scalekit-inc/cli setup copilot
```

**Portable skills pack** (no plugin wrapper) lives in [scalekit-inc/skills](https://github.com/scalekit-inc/skills):

```bash
npx skills add scalekit-inc/skills --list
```

---

Setting up auth for B2B and AI apps is complex. Between agent OAuth flows, SSO providers, SCIM provisioning, MCP server auth, and session management, most developers spend weeks on auth instead of shipping features.

This repo contains the complete Scalekit AuthStack — two kits that cover auth for AI agents and B2B SaaS apps, with marketplace manifests for Claude Code, Codex, Cursor, GitHub Copilot, and 35+ other AI coding tools.

---

### Available Kits

| Kit | Description |
|-----|-------------|
| **AgentKit** | Authentication for AI agents. OAuth flows, token vault, 100+ connectors (Gmail, Slack, Salesforce, etc.), tool discovery, and live testing — so agents can act on behalf of users. |
| **SaaSKit** | Production-ready auth for B2B SaaS apps. Login, sessions, SSO (Okta, Azure AD, Google), SCIM provisioning, RBAC, MCP server auth, and API key management. |

---

Each kit ships with implementation skills — see [`kits/agentkit/skills/`](./kits/agentkit/skills/) and [`kits/saaskit/skills/`](./kits/saaskit/skills/).

Connector catalog: [docs.scalekit.com/agentkit/connectors.md](https://docs.scalekit.com/agentkit/connectors.md)

---

[Join our Slack community](https://join.slack.com/t/scalekit-community/shared_invite/zt-3gsxwr4hc-0tvhwT2b_qgVSIZQBQCWRw)
