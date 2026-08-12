---
name: implementing-saaskit
description: Implements Scalekit SaaSKit authentication (sign-up, login, logout, sessions) using JWT tokens across Node.js, Python, Go, Java, or PHP. Use when building or integrating user authentication with Scalekit, setting up OAuth callbacks, token refresh, or session handling.
---

# Scalekit SaaSKit (Full-Stack Authentication)

## Guardrails

- **MUST** validate the access token server-side (`scalekit.validateAccessToken`) before trusting a request; **MUST NOT** trust `idToken`/`accessToken` claims without validation.
- **MUST** store `accessToken` and `refreshToken` in `HttpOnly`, `secure` cookies; **MUST NOT** persist tokens in localStorage or other client-readable storage.
- **MUST** read `SCALEKIT_CLIENT_ID`, `SCALEKIT_CLIENT_SECRET`, and other credentials from environment variables; **MUST NOT** hardcode them.
- **MUST** ensure `redirectUri` exactly matches an Allowed Redirect URI registered in the Scalekit dashboard.

## Setup

Install the SDK for the project language:

| Stack | Install |
|---|---|
| Node.js | `npm install @scalekit-sdk/node` |
| Python | `pip install scalekit-sdk-python` |
| Go | `go get github.com/scalekit-inc/scalekit-sdk-go/v2` |
| Java | Add `com.scalekit:scalekit-sdk-java` via Maven/Gradle |
| PHP / Laravel | See [laravel-reference.md](laravel-reference.md) |

Set credentials in `.env`:

```sh
SCALEKIT_ENVIRONMENT_URL=<your-environment-url>
SCALEKIT_CLIENT_ID=<your-client-id>
SCALEKIT_CLIENT_SECRET=<your-client-secret>
SCALEKIT_REDIRECT_URI=<your-callback-url>   # e.g. https://yourapp.com/auth/callback
```

> `SCALEKIT_REDIRECT_URI` must exactly match the callback URL registered in the Scalekit dashboard under Allowed Redirect URIs.

**Initialize the client** (Node.js example used in the snippets below):

```js
import { ScalekitClient } from '@scalekit-sdk/node';

const scalekit = new ScalekitClient(
  process.env.SCALEKIT_ENVIRONMENT_URL,
  process.env.SCALEKIT_CLIENT_ID,
  process.env.SCALEKIT_CLIENT_SECRET
);
const redirectUri = process.env.SCALEKIT_REDIRECT_URI;
```

Python:

```python
from scalekit import ScalekitClient
import os

scalekit = ScalekitClient(
    env_url=os.getenv("SCALEKIT_ENVIRONMENT_URL"),
    client_id=os.getenv("SCALEKIT_CLIENT_ID"),
    client_secret=os.getenv("SCALEKIT_CLIENT_SECRET"),
)
redirect_uri = os.getenv("SCALEKIT_REDIRECT_URI")
```

## Auth flow

### 1. Redirect to login

Generate an authorization URL and redirect the user:

```js
// Node.js — `scalekit` from Setup above
const authorizationUrl = scalekit.getAuthorizationUrl(redirectUri, {
  scopes: ['openid', 'profile', 'email', 'offline_access']
});
res.redirect(authorizationUrl);
```

> `redirectUri` must exactly match the allowed callback URL registered in the Scalekit dashboard.

### 2. Handle the callback

Exchange the authorization code for tokens:

```js
// Node.js
const { user, idToken, accessToken, refreshToken } =
  await scalekit.authenticateWithCode(code, redirectUri);
```

| Token | Purpose |
|---|---|
| `idToken` | Full user profile (sub, oid, email, name, exp) |
| `accessToken` | Roles + permissions; expires in 5 min (configurable) |
| `refreshToken` | Long-lived; use to renew access tokens |

### 3. Create the session

Store tokens in HttpOnly cookies:

```js
// Node.js
res.cookie('accessToken', authResult.accessToken, {
  maxAge: (authResult.expiresIn - 60) * 1000,
  httpOnly: true, secure: true, path: '/api', sameSite: 'lax'
});
res.cookie('refreshToken', authResult.refreshToken, {
  httpOnly: true, secure: true, path: '/auth/refresh', sameSite: 'lax'
});
```

**Token validation middleware pattern:**
1. Read `accessToken` cookie → decrypt → `scalekit.validateAccessToken(token)`
2. If invalid → `scalekit.refreshAccessToken(refreshToken)` → update cookies
3. If refresh fails → log out the user

### 4. Log out

Clear session data, then redirect to Scalekit's logout endpoint:

```js
// Node.js
clearSessionData();
const logoutUrl = scalekit.getLogoutUrl({ idTokenHint, postLogoutRedirectUri });
res.redirect(logoutUrl); // One-time use URL; expires after logout
```

## Cross-language reference

All SDK methods follow the same pattern across languages with minor naming conventions:

| Operation | Node.js | Python | Go | Java |
|---|---|---|---|---|
| Auth URL | `getAuthorizationUrl` | `get_authorization_url` | `GetAuthorizationUrl` | `getAuthorizationUrl` |
| Exchange code | `authenticateWithCode` | `authenticate_with_code` | `AuthenticateWithCode` | `authenticateWithCode` |
| Validate token | `validateAccessToken` | `validate_access_token` | `ValidateAccessToken` | `validateAccessToken` |
| Refresh token | `refreshAccessToken` | `refresh_access_token` | `RefreshAccessToken` | `refreshToken` |
| Logout URL | `getLogoutUrl` | `get_logout_url` | `GetLogoutUrl` | `getLogoutUrl` |

## What this unlocks

One integration enables: Magic Link & OTP, social sign-ins, enterprise SSO, workspaces, MCP authentication, SCIM provisioning, and user management.

## Framework-specific references

- Python (Django/FastAPI/Flask): use `implementing-saaskit-python` skill
- Next.js: use `implementing-saaskit-nextjs` skill
- Go (Gin): see [go-reference.md](go-reference.md)
- Spring Boot: see [springboot-reference.md](springboot-reference.md)
- Laravel: see [laravel-reference.md](laravel-reference.md)

## Deep reference

- Auth flows: [docs.scalekit.com/authenticate/fsa/quickstart](https://docs.scalekit.com/authenticate/fsa/quickstart/)
- Sessions: [docs.scalekit.com/authenticate/fsa/sessions](https://docs.scalekit.com/authenticate/fsa/sessions/)
- Access control: [docs.scalekit.com/authenticate/fsa/access-control](https://docs.scalekit.com/authenticate/fsa/access-control/)

## When to switch skills

- Use `managing-saaskit-sessions` for token storage, refresh middleware, and session auditing.
- Use `implementing-access-control` for RBAC and permission enforcement.
- Use `implementing-modular-sso` for enterprise SSO on top of SaaSKit.
- Use `migrating-to-saaskit` when replacing an existing auth system.
- Use `production-readiness-saaskit` before going live.
