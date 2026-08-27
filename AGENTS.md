# AGENTS.md

This repo is the Scalekit **plugin** pack: AgentKit and SaaSKit.

Portable copies of the same skills live in [scalekit-inc/skills](https://github.com/scalekit-inc/skills). Keep the `SKILL.md` text aligned. Plugin-only files (manifests, MCP config, marketplaces) live only here.

The four tool-specific repos (`claude-code-authstack`, `cursor-authstack`, `codex-authstack`, `github-copilot-authstack`) are archived. Do not copy skills back into them.

## Layout

```
skills/setup-scalekit/     # user-invoked router: install + pick a kit
kits/agentkit/             # AgentKit plugin + skills
kits/saaskit/              # SaaSKit plugin + skills
```

## Invocation

User-invoked (`disable-model-invocation: true`): `setup-scalekit`, `setup-agentkit`, `setup-saaskit`, `testing-auth-setup`, `production-readiness-agentkit`, `production-readiness-saaskit`.

Model-invoked: every other skill. The description is the trigger. One branch per distinct case.

A user-invoked skill names the next skill. It does not fire another user-invoked skill.

## Writing bar

Follow `writing-for-agents`:

- One job per skill.
- Description states what + when. Front-load the leading word (`AgentKit`, `SaaSKit`, `connection`, `connected account`, `dryrun`).
- `SKILL.md` stays at or under 200 lines. Put framework and provider dumps in `references/` in the same folder. One hop only.
- Every step ends on a checkable completion criterion.
- Point at the environment. Do not cache CLI help, `https://docs.scalekit.com/llms.txt`, or MCP output.
- Connector catalog is https://docs.scalekit.com/agentkit/connectors.md. Do not copy connector pages into this repo.
- Prompt the positive. A prohibition is a last-resort guardrail.

Leading words: see `CONTEXT.md`.

## After a skill edit

1. Match `name` to the folder name.
2. Update the catalog in `README.md` if you add, rename, or remove a skill.
3. Copy the same `SKILL.md` (and its `references/`) into `scalekit-inc/skills`.
