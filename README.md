# Scalekit AuthStack

**Skills and plugins that let your AI coding agent set up AgentKit and SaaSKit for you.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/scalekit-inc/authstack/pulls)

Auth for AI agents and B2B apps takes weeks: OAuth flows, SSO providers, SCIM provisioning, MCP server auth, and sessions. AuthStack gives your coding agent the steps to do that work in your project, with checkable results at the end of each step.

It works in Claude Code, Cursor, Codex, GitHub Copilot, and any agent that reads [Agent Skills](https://agentskills.io).

## Choose a kit

| | AgentKit | SaaSKit |
|---|---|---|
| **Use it when** | Your agent acts in a user's apps | Your app needs login and enterprise auth |
| **What you get** | OAuth, a token vault, connections, and tools. 600+ connectors and 35,000+ tools. Every call runs as the user who authorized it. | Login, sessions, SSO (SAML and OIDC), SCIM, RBAC, MCP server auth, and API keys |
| **Start with** | `setup-agentkit` | `setup-saaskit` |

Not sure? Ask your agent "which Scalekit kit should I use?" and `setup-scalekit` picks one.

## Install

Pick one path.

**Scalekit CLI.** It detects the AI coding tools on your machine and sets up the right plugin:

```bash
npx @scalekit-inc/cli setup
```

To target one tool:

```bash
npx @scalekit-inc/cli setup claude
npx @scalekit-inc/cli setup cursor
npx @scalekit-inc/cli setup codex
npx @scalekit-inc/cli setup copilot
```

**Marketplaces.**

| Tool | Install |
|---|---|
| Cursor | Open Customize and install `scalekit-agentkit`, `scalekit-saaskit`, or both from the Cursor Marketplace. [Plugin docs](https://cursor.com/docs/plugins). |
| Claude Code | `/plugin marketplace add scalekit-inc/authstack`, then `/plugin install agentkit@authstack` or `/plugin install saaskit@authstack` |
| GitHub Copilot | `copilot plugin marketplace add scalekit-inc/authstack`, then `copilot plugin install agentkit@authstack` or `copilot plugin install saaskit@authstack` |

**Skills only.** Any agent that reads Agent Skills can install the same skills straight from this repo:

```bash
npx skills add scalekit-inc/authstack --list
```

## Requirements

- A Scalekit account. A free tier is available.
- `SCALEKIT_ENVIRONMENT_URL`, `SCALEKIT_CLIENT_ID`, and `SCALEKIT_CLIENT_SECRET`. The setup skills walk you through them.
- Cursor: the `scalekit` MCP server at [mcp.scalekit.com](https://mcp.scalekit.com) asks for OAuth on first use.

## Your first prompt

After you install a kit, open your project and ask in plain English:

- **AgentKit:** "Setup AgentKit in this project."
- **SaaSKit:** "Setup SaaSKit in this project."

Every skill is model-invoked, so your agent picks the right one from what you ask. Each skill ends on a result you can check, such as a working login URL or a connected account.

## What's inside

Each kit ships skills. Folder names match skill names.

### AgentKit: [`kits/agentkit/skills/`](./kits/agentkit/skills/)

| Skill | What it does |
|---|---|
| `setup-agentkit` | Sets up a dashboard connection, env credentials, and a first connector path |
| `integrate-agentkit` | Creates a connected account, authorizes it, then calls one tool |
| `discover-connectors` | Finds connectors, tools, and schemas from the live catalog |
| `expose-agentkit-mcp` | Exposes AgentKit tools over MCP |
| `integrate-agentkit-host` | Connects an always-on host such as OpenClaw or Hermes |
| `check-agentkit-prod` | Runs the go-live checklist |

### SaaSKit: [`kits/saaskit/skills/`](./kits/saaskit/skills/)

| Skill | What it does |
|---|---|
| `setup-saaskit` | Sets up env credentials, a redirect URI, and a first login URL |
| `implement-saaskit`, `implement-saaskit-nextjs`, `implement-saaskit-python` | Adds login, callback, session cookies, and logout |
| `manage-saaskit-sessions` | Stores, validates, refreshes, and revokes sessions |
| `implement-access-control` | Adds roles and permissions to routes |
| `implement-sso` | Adds SAML and OIDC single sign-on and the admin portal |
| `implement-scim` | Provisions users and groups from a directory |
| `add-mcp-oauth` | Protects your MCP server with OAuth |
| `add-api-auth` | Adds API key or client-credentials auth |
| `migrate-to-saaskit` | Audits and imports existing auth |
| `run-dryrun` | Tests an auth setup before go-live |
| `review-scalekit-code` | Checks a Scalekit code snippet |
| `deploy-self-hosted` | Deploys self-hosted Scalekit with Helm |
| `check-saaskit-prod` | Runs the go-live checklist |

### Router: [`skills/setup-scalekit/`](./skills/setup-scalekit/)

`setup-scalekit` installs Scalekit and picks a kit. It installs through the CLI and `npx skills add`. The Cursor plugins do not include it.

## Resources

- [Scalekit docs](https://docs.scalekit.com) and the [LLM docs index](https://docs.scalekit.com/llms.txt)
- [Connector catalog](https://docs.scalekit.com/agentkit/connectors.md)
- [AgentKit overview](https://docs.scalekit.com/agentkit/overview/)
- [Scalekit MCP server](https://mcp.scalekit.com)
- [Join our Slack community](https://join.slack.com/t/scalekit-community/shared_invite/zt-3gsxwr4hc-0tvhwT2b_qgVSIZQBQCWRw)

## Contributing

Read [AGENTS.md](./AGENTS.md) first. It covers the writing bar for skills, versioning, and the check to run before a pull request:

```bash
scripts/validate.sh
```

See [CHANGELOG.md](./CHANGELOG.md) for releases.

## Security

Report vulnerabilities privately. See [SECURITY.md](./SECURITY.md).

## Legal

[MIT License](./LICENSE) · [Terms of Service](https://www.scalekit.com/legal/terms-of-service) · [Privacy Policy](https://www.scalekit.com/legal/privacy-policy)
