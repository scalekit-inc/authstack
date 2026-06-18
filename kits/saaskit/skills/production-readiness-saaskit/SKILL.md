---
name: production-readiness-saaskit
description: Validates SSO configuration, checks SCIM provisioning, audits token security, and verifies MCP auth flows for Scalekit SaaSKit implementations before production launch. Use when going live, launching to production, or doing a pre-launch review.
---

# SaaSKit Production Readiness

Work through in order — skip sections that don't apply. Earlier sections are blockers for later ones.

## Quick checks

```bash
# Confirm production credentials are set (not dev/staging)
echo $SCALEKIT_ENVIRONMENT_URL    # should be https://<subdomain>.scalekit.com (not .scalekit.dev)
echo $SCALEKIT_CLIENT_ID  # should be set
echo $SCALEKIT_CLIENT_SECRET  # should be set
```

- [ ] HTTPS enforced; CORS restricted to your domains only
- [ ] All credentials in environment variables — `grep -r "sks_" src/` returns nothing
- [ ] Webhook secret in env vars (if using webhooks)

## Core auth flows

- [ ] Redirect URLs in code match dashboard exactly
- [ ] `state` parameter validated in callbacks (CSRF)
- [ ] Tokens stored with `httpOnly: true`, `secure: true`, `sameSite: 'lax'`
- [ ] Token refresh working; logout calls `getLogoutUrl()` with `idTokenHint`

**Verify with curl:**

```bash
# Test token endpoint reachability
curl -s -o /dev/null -w "%{http_code}" -X POST "$SCALEKIT_ENVIRONMENT_URL/oauth/token" \
  -d "client_id=$SCALEKIT_CLIENT_ID&client_secret=$SCALEKIT_CLIENT_SECRET&grant_type=client_credentials"
# Expected: 200
```

**Test each enabled auth method:** email/password, magic links, social logins, passkeys. For each: complete the full sign-up → login → logout cycle.

**If a flow fails:** check redirect URI mismatch first (most common), then verify `state` cookie is `sameSite: 'lax'` (not `'strict'`).

## SSO (if applicable)

- [ ] SSO tested with target IdPs (Okta, Azure AD, Google Workspace)
- [ ] SP-initiated and IdP-initiated flows both working
- [ ] Admin portal configured for self-serve SSO setup
- [ ] JIT provisioning: domains registered, default roles set

**Verify SSO round-trip:**

```bash
# Generate an auth URL with organization_id to trigger SSO
node -e "
const { ScalekitClient } = require('@scalekit-sdk/node');
const sc = new ScalekitClient(process.env.SCALEKIT_ENVIRONMENT_URL, process.env.SCALEKIT_CLIENT_ID, process.env.SCALEKIT_CLIENT_SECRET);
console.log(sc.getAuthorizationUrl(process.env.SCALEKIT_REDIRECT_URI, { organizationId: '<org_id>' }));
"
# Open the URL — should redirect to the IdP login page
```

Test with: new users, existing users, deactivated users.

## SCIM provisioning (if applicable)

- [ ] Webhook endpoints verify signature before processing
- [ ] User provisioning, deprovisioning, and profile updates tested
- [ ] Deactivation preferred over hard deletion for `user_deleted` events
- [ ] Endpoint returns 2xx quickly — offload heavy processing to a queue

**Verify webhook signature validation:**

```typescript
// In your webhook handler — this MUST be present
const isValid = scalekit.verifyWebhookPayload(
  process.env.SCALEKIT_WEBHOOK_SECRET!,
  req.headers,
  req.body.toString()
);
if (!isValid) return res.sendStatus(401);
```

**If webhooks aren't arriving:** check that the endpoint URL in the dashboard is publicly reachable and returns 2xx.

## MCP authentication (if applicable)

- [ ] Resource metadata published at `/.well-known/oauth-protected-resource`
- [ ] Scopes enforced per tool
- [ ] Client reconnection after token expiry working

```bash
# Verify well-known endpoint is reachable
curl -s https://your-mcp-server.com/.well-known/oauth-protected-resource | jq .
# Should return JSON with resource, authorization_servers, scopes_supported
```

## RBAC (if applicable)

- [ ] Roles and permissions defined; default roles set for new users
- [ ] Permission enforcement verified at API endpoints

```typescript
// Verify token contains expected claims
const claims = await scalekit.validateToken(accessToken);
console.log('roles:', claims.roles);           // should list assigned roles
console.log('permissions:', claims.permissions); // should list granted permissions
```

**If permissions are empty:** check that roles are assigned to the user in the dashboard and that the role has permissions attached.

## Network / firewall

Enterprise VPN customers must whitelist: `<your-env>.scalekit.com`, `cdn.scalekit.com`, `fonts.googleapis.com`.

## Monitoring

- [ ] Auth logs monitoring active; alerts for suspicious activity
- [ ] Webhook error tracking configured
- [ ] Incident response runbook written; rollback plan ready (feature flag)
- **Key metrics:** login success/failure rate, token refresh frequency, webhook delivery rate, SSO completion rate

## Final smoke test

Run the full cycle in staging with production credentials before flipping DNS:
1. Sign up / log in → verify session cookies are set with `httpOnly`, `secure`, `sameSite`
2. Access a protected route → verify the access token is validated and the request succeeds
3. Wait for access token to expire (or force expiry) → verify token refresh works and the session is maintained
4. Log out → verify cookies are cleared and re-visiting login prompts credentials again
5. If SSO enabled: trigger SSO login → verify callback completes and user session is created
6. If SCIM: trigger a directory sync event → verify user appears
7. If MCP: connect a client → verify tool execution succeeds
