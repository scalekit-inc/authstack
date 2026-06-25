---
name: self-hosted
description: |
  This skill should be used when the user wants to deploy Scalekit self-hosted (on-premises / on-prem) using Kubernetes and Helm charts, or when they mention "self-hosted", "self hosted", "on prem", "on-prem", "onprem", "self-hosted Scalekit", "self-hosted deployment", or need to run their own Scalekit instance for data residency, compliance, or air-gapped environments. Provides complete guidance for self-hosting Scalekit with Kubernetes + Helm, following official patterns.
---

# Self-Hosted Scalekit Deployment

**Before doing anything else**, load the reference files for the detailed procedures:

- `references/quickstart.md` — Evaluation deployment (bundled databases)
- `references/production-deployment.md` — Full production steps, setup script, and portal flow
- `references/configuration.md` — values.yaml field reference and examples
- `references/troubleshooting.md` — Diagnostics and fixes
- `references/upgrades.md` — Upgrades and maintenance

Use this skill when the user needs to stand up their own Scalekit instance on Kubernetes (Helm chart from the distribution portal) instead of using Scalekit Cloud.

## When to use self-hosted

Self-hosted Scalekit runs the full platform (auth service + dashboard) on the user's own Kubernetes cluster via Helm.

Common reasons:
- Data residency requirements
- Network isolation / air-gapped
- Compliance (HIPAA, FedRAMP, etc.)
- "on prem", "self-hosted", "self hosted Scalekit", etc.

**Key difference from cloud**: The `SCALEKIT_ENVIRONMENT_URL` and admin dashboard come from the user's deployment (`https://app.<your-domain>`), not `app.scalekit.com`.

## High-level decision flow

Ask one question at a time:

1. Evaluation (fast, uses bundled Postgres/Redis subcharts) or production (external services)?
2. Target environment (GKE, other cloud K8s, Minikube, air-gapped)?
3. Do they have a domain + TLS + GatewayClass ready?
4. Do they have a registry token from the Scalekit distribution portal?

Then load the matching reference:

- Evaluation → `references/quickstart.md`
- Production → `references/production-deployment.md`
- Configuration details → `references/configuration.md`
- Problems → `references/troubleshooting.md`
- Later maintenance → `references/upgrades.md`

## After the instance is running — integration

- Dashboard at `https://app.<your-domain>`
- `SCALEKIT_ENVIRONMENT_URL` from their deployment
- Credentials from the self-hosted dashboard

Then route to the normal skills with those values:

| Goal | Skill | Self-hosted note |
|------|-------|------------------|
| Login + sessions | `/saaskit:setup` (or framework variant) | Use the self-hosted URL + credentials |
| Production readiness | `/saaskit:production-readiness-saaskit` | Adapt network checks for internal cluster |
| Validate connection | `/saaskit:testing-auth-setup` | Point at self-hosted env |
| SDK / auth errors | `/saaskit:scalekit-code-doctor` | Same code, different env values |

**MCP note**: The plugin tooling MCP (`https://mcp.scalekit.com`) stays cloud. Your app uses the self-hosted `SCALEKIT_ENVIRONMENT_URL`.

## Quick requirements (high level)

- K8s 1.27+
- Postgres 15+ (3 DBs: scalekit, webhooks, openfga)
- Redis 6.2+
- SMTP
- Domain + wildcard DNS + HTTPS (Gateway API preferred)
- Registry token from distribution portal

For the full list and provider specifics, load the references.

**Source of truth**: Official self-hosted docs (`/self-hosted/*`).

---

**Did this help?**

Share the cluster/provider and exact step (or error) if they hit issues. We can refine the references.
