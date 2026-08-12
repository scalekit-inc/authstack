---
name: setup-saaskit
description: First stop for adding end-user authentication to a web app with Scalekit SaaSKit — login, sessions, enterprise SSO, SCIM directory sync, RBAC, and API keys. Use when the user says 'add login', 'set up SSO', or 'add auth to my app' and it is unclear which SaaSKit skill fits. Picks the right skill by framework and hands the build to it. Not for agents calling external tools — that is setup-agentkit.
---

# SaaSKit — Where to Start

## Guardrails
- **MUST** route to the right SaaSKit skill and stop — this skill does NOT implement auth itself.
- **MUST NOT** generate implementation code here; the target skill owns that.
- **MUST** ask the Step 1 questions one at a time when the framework or what's-being-built is unclear, rather than guessing.

> **IMPORTANT:** This skill routes to the right skill — it does NOT implement auth itself. Once you identify the right skill below, tell the user to invoke it and stop. Do not generate implementation code here.

---

## Step 1: Determine what to build

If answers aren't already clear from context, ask one question at a time:

1. **New or existing codebase?**
   - New project
   - Adding auth to an existing app

2. **Framework?**
   - Next.js (App Router or Pages Router)
   - Python (Django / FastAPI / Flask)
   - Go
   - Other / not sure

3. **What are you adding?**
   - Login, sessions, and user management (most common starting point)
   - Enterprise SSO (Okta, Azure AD, Google Workspace, etc.)
   - SCIM / user provisioning (sync users from a directory)
   - Secure an MCP server with OAuth 2.1
   - API keys for developers
   - Not sure / full auth stack

---

## Step 2: Tell the user exactly which skill to invoke

Pick the best match and tell the user: "Run `/saaskit:<skill>` to get started."

| Framework | What you're adding | Tell them to run |
|---|---|---|
| Next.js | Login + sessions | `/saaskit:implementing-saaskit-nextjs` |
| Python | Login + sessions | `/saaskit:implementing-saaskit-python` |
| Go / other | Login + sessions | `/saaskit:implementing-saaskit` |
| Any | Enterprise SSO | `/saaskit:implementing-modular-sso` |
| Any | SCIM provisioning | `/saaskit:implementing-scim-provisioning` |
| Any | MCP server auth | `/saaskit:adding-mcp-oauth` |
| Any | API keys | `/saaskit:adding-api-auth` |
| Any | RBAC / permissions | `/saaskit:implementing-access-control` |
| Any | Migrating from Auth0 / Firebase / custom auth | `/saaskit:migrating-to-saaskit` |

If the user wants **login + SSO + SCIM** (full B2B auth stack), tell them to start with `/saaskit:implementing-saaskit` (or the framework variant), then chain to `/saaskit:implementing-modular-sso` once login is working.

When routing, include one or two relevant orientation sentences from below so the user has context before reading the skill. Then **stop** — the target skill handles implementation.

### Orientation notes by topic

**Enterprise SSO:** SSO in Scalekit is scoped to an organization — every auth request needs `organizationId` or a domain hint to reach the right IdP. Two modes: Modular SSO (you manage users/sessions) vs Full-Stack SaaSKit (Scalekit manages users). Most B2B SaaS apps with existing user management use Modular SSO.

**SCIM provisioning:** Scalekit bridges the customer's identity provider (Okta, Azure AD) and your app via webhooks. Requires two parts: a webhook endpoint in your app, AND SCIM configuration on the customer's IdP side.

**MCP OAuth:** Requires Streamable HTTP transport — stdio does not support OAuth. The MCP server must expose a `/.well-known/oauth-protected-resource` discovery endpoint.

---

## Step 3: Environment checklist for the user (if new project)

Tell the user to confirm these credentials exist before they run the target skill (**user action** — do not read or write their environment yourself):

```bash
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.com
SCALEKIT_CLIENT_ID=<from dashboard>
SCALEKIT_CLIENT_SECRET=<from dashboard>
```

Get these from [app.scalekit.com](https://app.scalekit.com) → Developers → Settings → API Credentials. If the user cannot confirm, stop and wait rather than inventing values.

**Self-hosted Scalekit**: Use the `SCALEKIT_ENVIRONMENT_URL` and credentials from your self-hosted admin dashboard (typically at `https://app.<your-domain>` after you deploy via the distribution portal). Run `/saaskit:self-hosted` for complete Kubernetes + Helm deployment guidance (or to get integration adjustments for an existing self-hosted instance).

Use `/saaskit:testing-auth-setup` to validate credentials and connection end-to-end before writing any auth code.

---

## When to switch skills

- **Already know what you need?** Skip this skill and invoke the target directly.
- **SDK errors or wrong imports?** Use `/saaskit:scalekit-code-doctor`.
- **Production checklist?** Use `/saaskit:production-readiness-saaskit`.
