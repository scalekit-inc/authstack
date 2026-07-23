---
name: implementing-modular-sso
description: Implements enterprise SSO and authentication flows using Scalekit, including modular SSO (SAML/OIDC), IdP-initiated login, and admin portal for self-serve configuration. Use when adding SSO, integrating identity providers like Okta or Azure AD, or embedding the Scalekit admin portal.
---

# Implement Modular SSO

## Quick Start

**Choose your authentication mode:**
- **Modular SSO**: You manage users and sessions (covered here)
- **SaaSKit (Full-Stack Auth)**: Scalekit manages users and sessions (built-in SSO)

This skill covers Modular SSO for applications with existing user management.

**Key concept — `organization_id`**: SSO in Scalekit is scoped to an organization. Pass `organization_id` (or the user's email domain) in the authorization URL to route the user to their identity provider (Okta, Azure AD, Google Workspace, etc.). Without it, Scalekit cannot determine which IdP to use.

## Guardrails
- **MUST** validate ID tokens and access tokens before trusting any claims; **MUST NOT** extract user identity from an unvalidated token.
- **MUST** register every callback URL in Dashboard > Authentication > Redirect URLs before using it; **MUST NOT** redirect to an unregistered `redirect_uri` (causes an `Invalid redirect_uri` error).
- **MUST** pass `organization_id`, `connectionId`, or `loginHint` in the authorization URL; **MUST NOT** omit all three — Scalekit cannot determine which IdP to route the user to.
- **MUST** preserve `relay_state` from IdP-initiated login claims when building the authorization URL; **MUST NOT** discard it, to protect against SAML assertion replay.

## Implementation Workflow

Copy this checklist and track progress:

```
Authentication Integration Progress:
- [ ] Step 1: Configure Modular Auth mode
- [ ] Step 2: Install and configure Scalekit SDK
- [ ] Step 3: Implement authorization URL generation
- [ ] Step 4: Handle IdP-initiated SSO (RECOMMENDED)
- [ ] Step 5: Process authentication callback
- [ ] Step 6: Validate tokens and extract user profile
- [ ] Step 7: Test SSO integration
- [ ] Step 8: Set up customer onboarding flow
```

## Step 1: Configure Modular Auth Mode

> **User action (dashboard)** — the coding agent cannot click the Scalekit UI. Instruct the user to complete these steps, then continue with Step 2 in code:

1. Open [app.scalekit.com](https://app.scalekit.com) → **Authentication → General**
2. Under "Full-Stack Auth", **Disable Full-Stack Auth** (enables Modular SSO mode)

Confirm with the user that Modular Auth is disabled before generating integration code.

## Step 2: Install and Configure SDK

### Installation

Choose the SDK for the project's tech stack:

**Node.js:**
```bash
npm install @scalekit-sdk/node
```

**Python:**
```bash
pip install scalekit-sdk-python
```

**Go:**
```bash
go get github.com/scalekit-inc/scalekit-sdk-go/v2
```

**Java:**
```xml
<dependency>
  <groupId>com.scalekit</groupId>
  <artifactId>scalekit-sdk-java</artifactId>
</dependency>
```

### Environment Configuration

Add these credentials to `.env` file (fetch from Dashboard > Developers > Settings > API credentials):

```env
SCALEKIT_ENVIRONMENT_URL=<environment-url>
SCALEKIT_CLIENT_ID=<client-id>
SCALEKIT_CLIENT_SECRET=<client-secret>
```

---

## Step 3: Generate Authorization URL

Create authorization URL to redirect users to their identity provider.

### SSO Connection Selectors (Priority Order)

Use ONE of these identifiers (evaluated in precedence order):

1. **connectionId** (highest) - Direct SSO connection reference
2. **organizationId** - Routes to organization's active SSO
3. **loginHint** - Extracts domain from email to find connection

### Implementation Pattern

**Node.js:**
```javascript
const scalekit = new ScalekitClient(
  process.env.SCALEKIT_ENVIRONMENT_URL,
  process.env.SCALEKIT_CLIENT_ID,
  process.env.SCALEKIT_CLIENT_SECRET
);

const options = {
  organizationId: 'org_XXXXX',  // OR
  connectionId: 'conn_15696105471768821',   // OR
  loginHint: 'user@example.com'
};

const authUrl = scalekit.getAuthorizationUrl(
  'https://yourapp.com/auth/callback',
  options
);

// Redirect user to authUrl
```

**Python:**
```python
from scalekit import ScalekitClient, AuthorizationUrlOptions

scalekit = ScalekitClient(
    os.getenv('SCALEKIT_ENVIRONMENT_URL'),
    os.getenv('SCALEKIT_CLIENT_ID'),
    os.getenv('SCALEKIT_CLIENT_SECRET')
)

options = AuthorizationUrlOptions()
options.organization_id = 'org_XXXXX'

auth_url = scalekit.get_authorization_url(
    redirect_uri='https://yourapp.com/auth/callback',
    options=options
)
```

**Direct URL (no SDK):**
```
<SCALEKIT_ENVIRONMENT_URL>/oauth/authorize?
  response_type=code&
  client_id=<CLIENT_ID>&
  redirect_uri=<CALLBACK_URL>&
  scope=openid profile email&
  organization_id=<ORG_ID>
```

## Step 4: Handle IdP-Initiated SSO

**CRITICAL**: Implement this to support users who start login from their identity provider portal.

### Why This Matters

IdP-initiated SSO converts potentially insecure flows into secure SP-initiated flows, protecting against SAML assertion theft and replay attacks.

### Configuration Required

1. Set initiate login endpoint: Dashboard > Authentication > Redirects
2. Configure endpoint: `https://yourapp.com/login`

### Implementation

**Node.js:**
```javascript
app.get('/login', async (req, res) => {
  const { idp_initiated_login, error, error_description } = req.query;

  if (error) {
    return res.status(400).json({ message: error_description });
  }

  if (idp_initiated_login) {
    // Decode JWT to extract connection details
    const claims = await scalekit.getIdpInitiatedLoginClaims(idp_initiated_login);

    const options = {
      connectionId: claims.connection_id,
      organizationId: claims.organization_id,
      loginHint: claims.login_hint,
      state: claims.relay_state
    };

    const authUrl = scalekit.getAuthorizationUrl(
      'https://yourapp.com/auth/callback',
      options
    );

    return res.redirect(authUrl);
  }

  // Handle normal login flow
});
```

**Python:**
```python
@app.route('/login')
async def handle_login():
    idp_initiated_login = request.args.get('idp_initiated_login')
    error = request.args.get('error')

    if error:
        return {'error': request.args.get('error_description')}, 400

    if idp_initiated_login:
        claims = await scalekit.get_idp_initiated_login_claims(idp_initiated_login)

        options = AuthorizationUrlOptions()
        options.connection_id = claims.get('connection_id')
        options.organization_id = claims.get('organization_id')
        options.state = claims.get('relay_state')

        auth_url = scalekit.get_authorization_url(
            redirect_uri='https://yourapp.com/auth/callback',
            options=options
        )

        return redirect(auth_url)
```

---

## Step 5: Process Authentication Callback

Handle the callback after successful IdP authentication.

### Callback Endpoint Setup

1. Create endpoint: `/auth/callback`
2. Register in Dashboard > Authentication > Redirect URLs > Allowed Callback URLs

### Implementation

**Node.js:**
```javascript
app.get('/auth/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).json({ error: error_description });
  }

  try {
    // Exchange code for user profile and tokens
    const result = await scalekit.authenticateWithCode(
      code,
      'https://yourapp.com/auth/callback'
    );

    // Extract user information
    const userEmail = result.user.email;
    const userName = result.user.givenName + ' ' + result.user.familyName;
    const userId = result.user.id;

    // Create session for authenticated user
    req.session.user = {
      id: userId,
      email: userEmail,
      name: userName
    };

    res.redirect('/dashboard');
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

**Python:**
```python
@app.route('/auth/callback')
async def auth_callback():
    code = request.args.get('code')
    error = request.args.get('error')

    if error:
        return {'error': request.args.get('error_description')}, 400

    result = scalekit.authenticate_with_code(
        code,
        'https://yourapp.com/auth/callback'
    )

    # Create session
    session['user'] = {
        'id': result.user.id,
        'email': result.user.email,
        'name': f"{result.user.given_name} {result.user.family_name}"
    }

    return redirect('/dashboard')
```

---

## Step 6: Validate Tokens

**ALWAYS** validate tokens before trusting claims.

**Node.js:**
```javascript
// Validate ID token
const idTokenClaims = await scalekit.validateToken(result.idToken);

// Validate access token
const accessTokenClaims = await scalekit.validateToken(result.accessToken);
```

**Python:**
```python
id_token_claims = scalekit.validate_access_token_and_get_claims(result['id_token'])
access_token_claims = scalekit.validate_access_token_and_get_claims(result['access_token'])
```

### Token Structure

**ID Token includes:**
- `email`: User's email address
- `given_name`, `family_name`: User's name
- `sub`: Unique user identifier (format: `connectionId;userId`)
- `oid`: Organization ID
- `amr`: Authentication method (SSO connection ID)

**Access Token includes:**
- `sub`: User identifier
- `exp`: Expiration timestamp
- `client_id`: Your application client ID

## Step 7: Test SSO Integration

Use the built-in IdP Simulator for comprehensive testing.

### Test Organization Setup

Your environment includes pre-configured test organization with domains:
- `@example.com`
- `@example.org`

### Testing Workflow

1. **Find test organization** (**user action**): Dashboard → Organizations (note `organization_id` / connection id)
2. **Use test selector** (code): pass one of these in the authorization URL:
   - Email with `@example.com` domain
   - Test organization's connection ID
   - Organization ID
3. **Simulate SSO flow** (**user action**): complete the IdP Simulator in the browser
4. **Verify callback** (agent): confirm your `/auth/callback` stores session + profile correctly

### Test Scenarios

Test ALL three scenarios:
1. **SP-initiated SSO**: User starts login from your app
2. **IdP-initiated SSO**: User starts from IdP portal
3. **Domain-based routing**: User enters email, auto-routes to IdP

---

## Step 8: Customer Onboarding

Enable SSO for enterprise customers through self-service Admin Portal.

### Quick Onboarding

**Create organization** (**user action**): Dashboard → Organizations → New Organization — or create via SDK if the app already provisions orgs.

**Generate portal link** (agent/code — Node.js):
```javascript
const portalLink = await scalekit.organization.generatePortalLink(
  'org_32656XXXXXX0438'
);

// Print for the product owner to share with the customer's IT admin
console.log('Admin Portal:', portalLink.location);
```

**Share link / setup guide** (**user/ops action**, not coding): product owner sends the portal URL + [SSO setup guide](https://docs.scalekit.com/guides/integrations/sso-integrations/) to the customer's IT admin (email/Slack).

### Embedded Portal (Advanced)

Embed Admin Portal in your app for seamless experience:

```javascript
// Backend: Generate portal link
const portalLink = await scalekit.organization.generatePortalLink(orgId);
res.json({ portalUrl: portalLink.location });
```

```html
<!-- Frontend: Embed in iframe -->
<iframe
  src="${portalUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allow="clipboard-write">
</iframe>
```
## Advanced Patterns

### Pre-Check SSO Availability

Prevent failed redirects by checking SSO configuration before redirecting:

**Node.js:**
```javascript
const domain = email.split('@')[1].toLowerCase();

const connections = await scalekit.connections.listConnectionsByDomain({
  domain
});

if (connections.length > 0) {
  // SSO available - redirect to IdP
  const authUrl = scalekit.getAuthorizationUrl(redirectUri, {
    domainHint: domain
  });
  return res.redirect(authUrl);
} else {
  // No SSO - show password login
  return showPasswordLogin();
}
```

### Domain Verification

Enable seamless routing by verifying customer domains:
1. Customer verifies domain (e.g., `@megacorp.org`) in Admin Portal
2. Users sign in without organization selection
3. Scalekit auto-routes based on email domain

### Session Management Best Practices

**Set secure session configuration:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // Prevent XSS
    maxAge: 86400000,    // 24 hours
    sameSite: 'lax'      // CSRF protection
  }
}));
```

**Implement session refresh:**
```javascript
// Check token expiration
if (Date.now() / 1000 > accessTokenClaims.exp) {
  // Redirect to re-authentication
  return res.redirect('/login');
}
```

## Integration with Existing Auth Systems (optional)

> Brief pointers only — not the primary Modular SSO path. Prefer full Scalekit SSO (Steps 2–7) unless the user already runs Auth0/Firebase/Cognito as the session layer.

### Auth0 / Firebase / Cognito
- **Auth0**: Custom Social Connection → Scalekit OAuth2 endpoints; map attributes.
- **Firebase**: Exchange Scalekit tokens for Firebase custom tokens; keep Firebase session SDK.
- **Cognito**: SAML IdP with Scalekit metadata URL; map attributes.

## Security Checklist

Before production deployment, verify:

- [ ] Environment variables stored securely (never in code)
- [ ] HTTPS enforced on all endpoints
- [ ] Tokens validated before trusting claims
- [ ] Session cookies use `secure` and `httpOnly` flags
- [ ] CSRF protection enabled
- [ ] Callback URLs registered in Scalekit dashboard
- [ ] Error messages don't expose sensitive information
- [ ] Rate limiting implemented on auth endpoints
- [ ] Logging configured (without exposing tokens)

## Troubleshooting

### "Invalid redirect_uri" Error

**Cause**: Callback URL not registered in dashboard
**Fix**: Add URL to Dashboard > Authentication > Redirect URLs

### "Organization not found" Error

**Cause**: Invalid organization ID or user doesn't belong to organization
**Fix**: Verify organization ID and user's email domain

### IdP-Initiated SSO Not Working

**Cause**: Initiate login URL not configured
**Fix**: Set URL in Dashboard > Authentication > Redirects

### Token Validation Fails

**Cause**: Token expired or invalid signature
**Fix**: Check token expiration and environment URL configuration

## Common Patterns

### Multi-Tenant Architecture

```javascript
// Determine organization from subdomain
const subdomain = req.hostname.split('.');
const organization = await getOrganizationBySubdomain(subdomain);

const authUrl = scalekit.getAuthorizationUrl(redirectUri, {
  organizationId: organization.scalekitOrgId
});
```

### Step-Up Authentication

```javascript
// Require re-authentication for sensitive operations
if (requiresStepUp && !session.recentAuth) {
  return res.redirect('/auth/step-up');
}
```

### Logout Implementation

```javascript
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
```

## Reference

**Scalekit Dashboard**: [https://app.scalekit.com](https://app.scalekit.com)

**Connection Selector Precedence**: connectionId > organizationId > loginHint

**Token Expiration**: ID tokens expire in 15 minutes, access tokens in 5 minutes (configurable in dashboard)

**Admin Portal Events**: Listen for `sso.enabled`, `sso.disabled`, `session.expired`

**Support**: [docs.scalekit.com](https://docs.scalekit.com)

## Implementation Notes

**Always validate tokens**: Never trust token claims without validation

**Handle errors gracefully**: Show user-friendly messages, log details internally

**Test all scenarios**: SP-initiated, IdP-initiated, and domain-based routing

**Enable domain verification**: Provides best user experience

**Use progressive enhancement**: Start with basic SSO, add advanced features iteratively

**Monitor authentication flows**: Track success rates and common failure points

## When to switch skills

- Use `implementing-saaskit` for the base auth flow that SSO builds on.
- Use `implementing-scim-provisioning` for automated user provisioning alongside SSO.
- Use `production-readiness-saaskit` to validate SSO configuration before launch.