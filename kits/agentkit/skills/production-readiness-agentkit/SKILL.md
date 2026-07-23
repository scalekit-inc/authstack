---
name: production-readiness-agentkit
description: Pre-launch checklist for a Scalekit AgentKit (agent-auth) integration — connected-account authorization, connector OAuth token vault, and tool-calling reliability. Use when taking an AgentKit agent live, or verifying per-connector authorization and tool execution are production-ready. For user-login/SSO/SCIM readiness, use production-readiness-saaskit instead.
---

# Scalekit AgentKit Production Readiness

Work through each section in order — earlier sections are blockers for later ones.

## Guardrails

- **MUST NOT** sign off as production-ready while any blocker item in an earlier section is unchecked.
- **MUST** validate the **production** Scalekit environment before go-live (`SCALEKIT_ENVIRONMENT_URL` ends in `.scalekit.com`, not `.scalekit.dev`). You may exercise the full OAuth cycle first against a dedicated staging app that still points at production AgentKit credentials — that is still "production credentials," not a `.scalekit.dev` sandbox.
- **MUST NOT** ship with secrets in source — credentials live only in environment variables.

---

## Quick checks (run first)

```bash
# Confirm production credentials are set (not .scalekit.dev sandbox)
echo $SCALEKIT_ENVIRONMENT_URL    # should be https://<subdomain>.scalekit.com (not .scalekit.dev)
echo $SCALEKIT_CLIENT_ID  # should be set
echo $SCALEKIT_CLIENT_SECRET  # should be set

# Verify token endpoint works
curl -s -o /dev/null -w "%{http_code}" -X POST "$SCALEKIT_ENVIRONMENT_URL/oauth/token" \
  -d "client_id=$SCALEKIT_CLIENT_ID&client_secret=$SCALEKIT_CLIENT_SECRET&grant_type=client_credentials"
# Expected: 200
```

- [ ] HTTPS enforced on all auth endpoints
- [ ] API credentials in environment variables — search the whole project for hardcoded secrets (adjust roots to the repo layout):
  ```bash
  # Prefer project roots that exist; skip node_modules/.git
  rg -n --hidden -g '!**/.git/**' -g '!**/node_modules/**' 'skc_|SCALEKIT_CLIENT_SECRET\s*=' . || true
  # Expect no real secrets committed — only env var *names* or placeholders
  ```
- [ ] Redirect URIs registered in dashboard match exactly what the app sends

---

## OAuth token flows

- [ ] Test authorization URL generation with correct scopes
- [ ] Validate `state` parameter in callbacks (CSRF protection)
- [ ] Test authorization code exchange for access + refresh tokens
- [ ] Verify access tokens are stored securely (not in localStorage or logs)
- [ ] Test automatic token refresh before expiry
- [ ] Verify token refresh handles concurrent requests correctly (no race conditions)
- [ ] Test behavior when refresh token expires — user prompted to re-authorize
- [ ] Verify revocation on logout clears stored tokens

**Per connected service:**
- [ ] Test OAuth flow end-to-end for each service (Gmail, Slack, Notion, etc.)
- [ ] Verify correct scopes requested — request minimum required
- [ ] Test API calls with valid access token succeed
- [ ] Test API calls with expired token trigger refresh correctly
- [ ] Test behavior on permission denied (user revoked access in the third-party app)

---

## Security

- [ ] Access tokens never logged or exposed in error messages
- [ ] Refresh tokens stored encrypted at rest
- [ ] Token storage scoped per user — no cross-user token access possible
- [ ] Webhook/callback endpoint validates signatures (if applicable)

---

## Monitoring and incident readiness

- [ ] Auth logs monitoring configured in **Dashboard > Auth Logs**
- [ ] Error tracking configured for OAuth failures and token refresh errors
- [ ] Alerts configured for repeated authorization failures
- [ ] Log retention policies configured
- [ ] Incident response runbook written (who to contact, how to revoke compromised tokens)

**Key metrics:** Token refresh success/failure rate, OAuth completion rate (initiated vs completed), per-service API error rates, token expiry distribution.

## Final smoke test

Run the full cycle against the **production** Scalekit environment (URL ends in `.scalekit.com`). Prefer a non-customer test user. The host app may be local/staging — credentials must still be production AgentKit env vars.

Use the SDK path from `integrating-agentkit` (or the Scalekit MCP server) for steps the agent can execute; step 2 still needs the **user** to complete browser OAuth:

1. Create a connected account for a test user → verify status returned (`get_or_create_connected_account` / `getOrCreateConnectedAccount`)
2. Generate auth link → **user** completes OAuth in a browser → re-fetch account → verify status is `ACTIVE`
3. Fetch access token → make a downstream API call → verify success
4. Wait for token expiry (or force-refresh) → re-fetch → verify auto-refresh works
5. Revoke access in the third-party app → verify graceful error handling
