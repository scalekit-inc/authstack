# CONTEXT.md

Shared language for this repo. Define these tokens only here. Use them in skills, READMEs, and pointers.

| Token | Means |
|-------|--------|
| **AgentKit** | Agent OAuth, token vault, connections, tools. Not "agent auth". |
| **SaaSKit** | App login, sessions, SSO, SCIM, MCP server auth, API keys. Not "full-stack auth" or "FSA". |
| **connection** | Dashboard connector config (Slack, Gmail, …). |
| **connected account** | One user authorized on one connection. |
| **dryrun** | Live auth check via the Scalekit CLI. Not an AXIS run. |
| **host** | Long-lived agent process (OpenClaw or Hermes). Not this git repo. |
| **setup skill** | A skill that starts a kit: `setup-scalekit`, `setup-agentkit`, `setup-saaskit`. Not later implement skills. |
| **empty project** | Discovery only. No skills on disk. Not the default for skill work. |
| **skill-loaded** | AXIS copies the skill under test into the isolated agent. This is how we improve a SKILL.md. |
| **transcript scenario** | An AXIS run that judges the agent transcript only. No Scalekit network. |
| **sandbox scenario** | An AXIS run that uses a real Scalekit environment. The human writes `SCALEKIT_*` into `.env`. The agent does not invent those values. |

Connector index: https://docs.scalekit.com/agentkit/connectors.md
LLM docs index: https://docs.scalekit.com/llms.txt
MCP: https://mcp.scalekit.com
