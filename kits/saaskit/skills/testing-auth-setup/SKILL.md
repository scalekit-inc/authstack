---
name: testing-auth-setup
description: Validates a Scalekit auth integration by running the dryrun CLI against a live environment. Use when the user says "test my auth", "verify SSO setup", "check my login flow", "dryrun", or wants to confirm their Scalekit credentials and configuration are working.
---

# Testing Auth Setup

Runs the Scalekit dryrun CLI to validate that your auth integration is correctly configured against a live environment.

## Guardrails

- **MUST** confirm `SCALEKIT_ENVIRONMENT_URL` and `SCALEKIT_CLIENT_ID` are set before running the dryrun command.
- **MUST** ask for `organization_id` before running `sso` mode if it wasn't provided.
- **MUST** show the dryrun output and explain what passed/failed in plain language, not just report success or failure silently.
- **MUST NOT** guess between `fsa` and `sso` mode when it's ambiguous — ask the user which to use.

## Modes

| Mode | What it tests | When to use |
|------|--------------|-------------|
| `fsa` | Full-stack auth login flow | User is setting up or verifying login, callback, and session handling |
| `sso` | Enterprise SSO flow | User is setting up or verifying SAML/OIDC SSO with an identity provider |

## Prerequisites

Confirm these environment variables are available:

- `SCALEKIT_ENVIRONMENT_URL` — your Scalekit environment URL
- `SCALEKIT_CLIENT_ID` — your client ID from app.scalekit.com > Settings

## Running the test

### Full-stack auth (fsa)

```bash
npx @scalekit-sdk/dryrun --env_url=$SCALEKIT_ENVIRONMENT_URL --client_id=$SCALEKIT_CLIENT_ID --mode=fsa
```

### Enterprise SSO

Requires an `organization_id` — ask for it if not provided.

```bash
npx @scalekit-sdk/dryrun --env_url=$SCALEKIT_ENVIRONMENT_URL --client_id=$SCALEKIT_CLIENT_ID --mode=sso --organization_id=<organization_id>
```

## Choosing the mode

If the user doesn't specify a mode:

1. Check the project context — if there's SSO configuration (identity providers, SAML metadata), suggest `sso`.
2. Otherwise default to `fsa` as the most common starting point.
3. If ambiguous, ask which mode to use.

## After running

- Show the command output.
- Explain what passed and what failed in plain language.
- If the test fails, suggest specific next steps based on the error (missing redirect URI, invalid credentials, organization not found, etc.).

## When to switch skills

- Use `implementing-saaskit` for the initial auth setup.
- Use `implementing-modular-sso` for SSO configuration.
- Use `production-readiness-saaskit` for a full pre-launch review.