---
name: hermes-delegated-auth
description: >
  Integrates AgentKit so Hermes can act as a named user.
  Use when the host must send mail, Slack as a person,
  or read Notion as SCALEKIT_IDENTIFIER.
  It does not wire OpenClaw (that's `integrate-agentkit-host`)
  or write app-code tool calls (that's `integrate-agentkit`).
version: 0.1.0
author: Scalekit Inc
license: MIT
homepage: https://github.com/scalekit-inc/authstack
required_environment_variables:
  - name: SCALEKIT_CLIENT_ID
    prompt: Scalekit client ID
    help: Dashboard / Developers / Settings / API Credentials
    required_for: Scalekit client auth
  - name: SCALEKIT_CLIENT_SECRET
    prompt: Scalekit client secret
    help: Dashboard / Developers / Settings / API Credentials
    required_for: Scalekit client auth
  - name: SCALEKIT_ENVIRONMENT_URL
    prompt: Scalekit environment URL
    help: https://your-env.scalekit.cloud
    required_for: Scalekit client auth
  - name: SCALEKIT_IDENTIFIER
    prompt: Named user identifier
    help: The named user this host acts as
    required_for: connected-account lookup
metadata:
  hermes:
    tags: [Scalekit, AgentKit, Gmail, Slack, Notion, Calendar]
    related_skills: []
---

# Hermes delegated auth

Hermes is the host. Scalekit is the vault. Run tools as `SCALEKIT_IDENTIFIER`.

## Guardrails

- **MUST** wait for dashboard credential values. **MUST NOT** invent them.
- **MUST** put only Scalekit client credentials on the host. Provider tokens stay in Scalekit.
- **MUST NOT** run `hermes mcp login` against Scalekit. **MUST NOT** mint a Virtual MCP session token for another end user inside this host. A single-operator host may hold one operator bearer. See https://docs.scalekit.com/agentkit/hermes/

Run every command from this skill directory
(`~/.hermes/skills/hermes-delegated-auth/` after install).

```bash
uv sync
```

Scripts accept `SCALEKIT_*` first, then OpenClaw `TOOL_*` aliases.
Read those values from the process environment. Hermes already injects
declared vars.

## Step 1 — Discover the connection

```bash
uv run scripts/tool_exec.py --list-connections --provider <PROVIDER>
```

Use the first connection with `"status": "COMPLETED"` as `<CONNECTION_NAME>`.

**Done when:** a completed `key_id` exists, or the run stops because none exists.

If none exist, say no `<PROVIDER>` connection is configured and stop.
If some exist but none are `COMPLETED`, name the `key_id`s and stop.

LinkedIn maps to provider `HARVESTAPI`. See [references/examples.md](references/examples.md).

## Step 2 — Check and authorize

```bash
uv run scripts/tool_exec.py --generate-link --connection-name <CONNECTION_NAME>
```

OAuth: if not `ACTIVE`, show the magic link, wait, then continue.
API key / bearer / basic: if missing or not `ACTIVE`, send the user to the
Dashboard and stop.

**Done when:** the connected account is `ACTIVE`, or the next action is on screen.

Do not use `--get-authorization` in this flow.

## Step 3 — Find the tool and its schema

```bash
uv run scripts/tool_exec.py --get-tool --provider <PROVIDER>
uv run scripts/tool_exec.py --get-tool --tool-name <TOOL_NAME>
```

Use only parameter names from `input_schema.properties`. Include every
`required` field.

**Done when:** a matching tool plus its schema exist, or no tool exists.

If no tool matches, go to Step 5.

## Step 4 — Execute

```bash
uv run scripts/tool_exec.py --execute-tool \
  --tool-name <TOOL_NAME> \
  --connection-name <CONNECTION_NAME> \
  --tool-input '<JSON_INPUT>'
```

Pass `--identifier <id>` when the user names a person other than
`SCALEKIT_IDENTIFIER`.

**Done when:** the tool result is returned.

## Step 5 — Proxy fallback

Only if Step 3 found no tool:

```bash
uv run scripts/tool_exec.py --proxy-request \
  --connection-name <CONNECTION_NAME> \
  --path <API_PATH> \
  --method <GET|POST|PUT|DELETE>
```

If the result is `TOOL_PROXY_DISABLED`, say the catalog does not cover this
action.

File upload and download steps: [references/files.md](references/files.md).

**Done when:** the proxy result is returned, or the action is unsupported.

## Pitfalls

Put only Scalekit client credentials in the Hermes host env file.
Honor `SCALEKIT_IDENTIFIER` as the named user.
Return a magic link when the connected account is not `ACTIVE`.
Do not write Gmail, Slack-user, or Calendar tokens to disk.
Do not run `hermes mcp login` against Scalekit.
Do not mint a Virtual MCP session token for another end user inside this host.
A single-operator host may hold one operator bearer. See
https://docs.scalekit.com/agentkit/hermes/
Do not treat the Slack gateway bot as the named user.

Cron cannot click a magic link. The connected account must already be `ACTIVE`.
Proxy does not refresh tokens. A `401` means re-run Step 2.

## Verification

- `hermes skills list` shows `hermes-delegated-auth`.
- The connected account is `ACTIVE` after the magic link.
- A real provider call returns data.
