---
name: setup-scalekit
description: >
  Installs Scalekit, then picks AgentKit or SaaSKit for the project.
  Use when the user wants to install Scalekit, add the plugin, or
  decide which kit to use.
  It does not configure a dashboard connection (that's `setup-agentkit`)
  or set app login env (that's `setup-saaskit`).
---

# Setup Scalekit

Install the Scalekit CLI and plugin. Pick AgentKit or SaaSKit. Stop.

## Guardrails

- **MUST** stop after install + kit pick and name `setup-agentkit` or `setup-saaskit`.
- **MUST NOT** start those wizards from this skill.

## Gotchas

- Run `npx @scalekit-inc/cli setup -y` first. You have no TTY, so the interactive wizard exits without `-y`. Use a native plugin command only when that CLI cannot run.
- Add `--dry-run` to any setup command to preview it without running it.
- The marketplace is `authstack`. Its plugins are `agentkit` and `saaskit`.
- Plugins and portable skills both install from `scalekit-inc/authstack`. `scalekit-inc/skills` is retired.
- After the kit is picked, name `setup-agentkit` or `setup-saaskit`. Stop. Do not start those wizards here.
- For current CLI flags, run `npx @scalekit-inc/cli --help`.

## Step 1 — Install

Set up every detected agent:

```bash
npx @scalekit-inc/cli setup -y
```

For repeated use:

```bash
npm install -g @scalekit-inc/cli
scalekit setup -y
```

Target a specific tool only when the user names it:

```bash
npx @scalekit-inc/cli setup claude -y
npx @scalekit-inc/cli setup cursor -y
npx @scalekit-inc/cli setup codex -y
npx @scalekit-inc/cli setup copilot -y
```

Skills only, for other agents:

```bash
npx @scalekit-inc/cli skills install -y
```

Preview first with `--dry-run`, for example `npx @scalekit-inc/cli setup -y --dry-run`. A human in their own terminal can run `npx @scalekit-inc/cli setup` without `-y` for the interactive wizard.

Skip this step when the plugin or skills pack is already installed.

**Done when:** the plugin is visible in the current tool.

| Tool | Check |
|------|--------|
| Claude Code | Restart the session. `/plugin list` shows `agentkit` and/or `saaskit`. |
| GitHub Copilot | `copilot plugin list` shows the plugin. |
| Cursor / Codex | Re-open the tool. Authstack plugins or skills are available. |
| Other (skills CLI) | The chosen skill folder exists on disk (for example `setup-agentkit/SKILL.md` in the tool's skills directory). |

## Step 2 — Pick the kit

| Kit | Pick when the user needs |
|-----|--------------------------|
| AgentKit | connections, token vault, tools |
| SaaSKit | app login, sessions, SSO, SCIM, MCP server auth, API keys |

Ask which kit only when the user has not already named one.

**Done when:** the user has one kit: AgentKit or SaaSKit.

## Step 3 — Name the next skill and stop

- AgentKit → name `setup-agentkit`. Stop.
- SaaSKit → name `setup-saaskit`. Stop.

Tell the user the next skill name. Do not start that wizard here.

**Done when:** `setup-agentkit` or `setup-saaskit` is named, and this skill has stopped.

## Fallback — native install

Use this only when Step 1 cannot run. Then apply the same check as Step 1.

### Claude Code

```
/plugin marketplace add scalekit-inc/authstack
/plugin install agentkit@authstack
```

Use `saaskit@authstack` when the kit is SaaSKit.

### GitHub Copilot

```bash
copilot plugin marketplace add scalekit-inc/authstack
copilot plugin install agentkit@authstack
```

### Other agents

```bash
npx skills add scalekit-inc/authstack --all
```

`--all` puts the next named skill on disk, not only the two wizards.

Codex and Cursor go through `npx @scalekit-inc/cli setup codex -y` or `npx @scalekit-inc/cli setup cursor -y`.

## Live lookups

- CLI: `npx @scalekit-inc/cli --help`
- Docs index: https://docs.scalekit.com/llms.txt
- MCP: https://mcp.scalekit.com
