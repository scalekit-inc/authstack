---
name: patch-from-axis
description: >
  Patches one authstack SKILL.md when an AXIS score drops.
  Use when AXIS is red, a baseline fails, a goal check fails,
  or the user says patch from AXIS, score lowered, or surgical skill fix.
  It does not write a new skill (that's `authoring-skills`)
  or lint the file alone (that's `dora`).
---

# Patch from AXIS

Read the AXIS miss. Edit one kit skill. Re-run the same scenario. Then stop.

Stay in this repo. Do not copy to `scalekit-inc/skills` unless the user says ship.

## Guardrails

- **MUST** load this skill only after an AXIS report exists.
- **MUST** change one `SKILL.md` (plus its `references/` if the miss lives there).
- **MUST** keep the scenario prompt unchanged. The skill is the code. AXIS is the test.
- **MUST NOT** empty the workspace. Skill-loaded runs only.
- **MUST NOT** rewrite the skill. Surgical fix.
- **MUST** look up live product facts with Exa before you change an API, env name, dashboard path, or connector model. Prefer `https://docs.scalekit.com`. Do not cache CLI help or `llms.txt`.

Then read `authoring-skills` (Improving an existing skill) and `skill-design-principles`. Apply them. Do not paste them here.

## Step 1 — Name the miss

From the latest report:

- Scenario key
- AXIS score and Goal score
- Each goal check that scored under full weight
- The assistant text that failed the check

**Done when:** one failing check is named in one sentence.

## Step 2 — Name the skill

Map the check to one folder under `kits/` or `skills/setup-scalekit`.

If the agent never opened the skill, the miss is the `description`. That is `authoring-skills` trigger work. Still edit only that file.

**Done when:** one path is named.

## Step 3 — Classify

| Symptom | Fix |
|---|---|
| Skill never fired | Add the customer phrase to `description`. |
| Fired, then skipped a fact | Put the fact in Guardrails or the step that runs before the wait. |
| Wrong API or old model | Exa-fetch the live docs page. Then fix that step. Keep one current model. |
| Over-broad MUST NOT | Scope the rule. Prompt the positive. |
| Invented secrets | Keep wait-for-user. Do not add sample values that look real. |

**Done when:** one row is picked.

## Step 4 — Look up, then patch

If the miss is a product fact (method name, env var, callback path, Virtual MCP model, host rule), call Exa first:

1. `exa__web_search_exa` for the live docs page.
2. `exa__web_fetch_exa` on that URL.
3. Patch only what the live page supports.

If the miss is trigger, stop line, or wait-for-user, skip Exa.

Smallest edit that makes the failing check pass on the next run.

Follow this repo writing bar: one job, `Use when`, ≤200 lines, live lookups stay live.

**Done when:** `git diff` shows only that skill.

## Step 5 — Check and re-run

```bash
scripts/validate.sh
dora review --quick <skill-folder>
npx axis run --agent grok-local
```

If Goal is still short, one more surgical pass. Then stop and report.

If Goal is good: `npx axis baseline set`. Commit. Do not push unless asked.

**Done when:** the same scenario is re-run and the result is written down.
