# AGENTS.md

This repo is the authoring tree for the AgentKit and SaaSKit plugins.

Portable copies of the same `SKILL.md` files live in [scalekit-inc/skills](https://github.com/scalekit-inc/skills). Keep the text aligned. Plugin-only files (manifests, MCP config, marketplaces) live only here.

The four tool-specific repos (`claude-code-authstack`, `cursor-authstack`, `codex-authstack`, `github-copilot-authstack`) are archived. Do not copy skills back into them.

Marketplace plugin names stay `agentkit` and `saaskit`. Do not add a third.

## Layout

```
skills/setup-scalekit/     # router: install + pick a kit
kits/agentkit/             # AgentKit plugin + skills
kits/saaskit/              # SaaSKit plugin + skills
scripts/validate.sh        # writing-bar + marketplace names
```

## Invocation

Every skill is **model-invoked**. Do not set `disable-model-invocation`.

After `npx @scalekit-inc/cli setup`, English is the normal path. "Setup AgentKit in this project" must fire `setup-agentkit`.

`setup-scalekit` names the kit. The next skill is `setup-agentkit` or `setup-saaskit`. Those two stay model-invoked so a user who already installed the CLI can skip the router.

| Skill | Fires on |
|-------|----------|
| `setup-scalekit` | "install Scalekit", "which kit", "add the plugin" |
| `setup-agentkit` | "setup AgentKit", "add AgentKit to this project" |
| `setup-saaskit` | "setup SaaSKit", "add login to this app" |
| `integrate-agentkit` | "AgentKit in app code", "connected account", "authorization link" |
| `discover-connectors` | "what connectors", "connector tools" |
| `expose-agentkit-mcp` | "expose AgentKit over MCP" |
| `implement-saaskit` | "add SaaSKit login", "callback", "logout" |
| `implement-saaskit-nextjs` | "SaaSKit Next.js", "App Router auth" |
| `implement-saaskit-python` | "SaaSKit Django/FastAPI/Flask" |
| `manage-saaskit-sessions` | "session", "refresh", "revoke" |
| `implement-access-control` | "roles", "permissions", "RBAC" |
| `implement-sso` | "SSO", "SAML", "OIDC", "Modular SSO" |
| `implement-scim` | "SCIM", "provision users" |
| `add-mcp-oauth` | "MCP OAuth", "protect my MCP server" |
| `add-api-auth` | "API key", "client credentials" |
| `migrate-to-saaskit` | "migrate to SaaSKit", "replace Auth0/Clerk" |
| `run-dryrun` | "test auth", "dryrun" |
| `check-agentkit-prod` | "AgentKit production", "go live AgentKit" |
| `check-saaskit-prod` | "SaaSKit production", "go live SaaSKit" |
| `review-scalekit-code` | "review this Scalekit code" |
| `deploy-self-hosted` | "self-hosted Scalekit", "Helm" |

Folder names on disk match the table.

## Writing bar

- One job per skill.
- Description contract: action verb first, then `Use when`, then a sibling `It does not … (that's \`name\`)`.
- Leading words live in `CONTEXT.md`. Do not redefine them here.
- `SKILL.md` stays at or under 200 lines. Put framework and provider dumps in `references/` in the same folder. One hop only.
- Every step ends on a checkable completion criterion.
- Point at the live environment. Do not cache CLI help, `https://docs.scalekit.com/llms.txt`, or MCP output.
- Live lookups: `npx @scalekit-inc/cli --help`, `https://docs.scalekit.com/llms.txt`, `https://mcp.scalekit.com`.
- Connector catalog is https://docs.scalekit.com/agentkit/connectors.md. Do not copy connector pages into this repo.
- Prompt the positive. A prohibition is a last-resort guardrail.

## Semver

| Change | Bump |
|--------|------|
| Rename a skill, or rewrite steps so an old run does the wrong thing | major |
| New skill, new `references/` file, new trigger branch | minor |
| Line-budget split, typo, leading-word swap that keeps the same process | patch |
| Plugin rename, marketplace path change, MCP filename change | do not do |

This revamp is a **major** plugin bump because skill names change.

## After a skill edit

1. `scripts/validate.sh` must pass.
2. Update the catalog in `README.md` if you add, rename, or remove a skill.
3. Copy the same `SKILL.md` (and its `references/`) into `scalekit-inc/skills`.
