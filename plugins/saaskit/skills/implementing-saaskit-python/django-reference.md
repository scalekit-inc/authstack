# Scalekit Auth — Django

## Dependencies

```bash
pip install scalekit-sdk-python python-dotenv django
```

## Environment variables

```env
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.dev
SCALEKIT_CLIENT_ID=your_client_id
SCALEKIT_CLIENT_SECRET=your_client_secret
SCALEKIT_REDIRECT_URI=http://localhost:8000/auth/callback
```

Load with `python-dotenv` or Django's built-in settings from env.

## Client initialization — initialize once

In `yourapp/auth_client.py`:

```python
import os
from scalekit import ScalekitClient

_sc = None

def get_scalekit_client() -> ScalekitClient:
    global _sc
    if _sc is None:
        _sc = ScalekitClient(
            env_url=os.getenv("SCALEKIT_ENVIRONMENT_URL"),
            client_id=os.getenv("SCALEKIT_CLIENT_ID"),
            client_secret=os.getenv("SCALEKIT_CLIENT_SECRET"),
        )
    return _sc
```

## Auth flow at a glance

```
GET /auth/login
  → get_authorization_url() → 302 to Scalekit

GET /auth/callback?code=...
  → authenticate_with_code() → set session → redirect to /dashboard

Middleware: ScalekitAuthMiddleware
  → validate_access_token() → refresh if expired → pass or redirect /auth/login

GET /auth/logout
  → get_logout_url() → clear session → 302 to Scalekit end-session
```

## Views

```python
# yourapp/views.py
import os, secrets
from django.shortcuts import redirect
from django.http import HttpRequest, HttpResponse
from scalekit.common.scalekit import AuthorizationUrlOptions, LogoutUrlOptions
from .auth_client import get_scalekit_client

REDIRECT_URI = os.getenv("SCALEKIT_REDIRECT_URI", "http://localhost:8000/auth/callback")

def login(request: HttpRequest):
    state = secrets.token_urlsafe(32)
    request.session["oauth_state"] = state
    sc = get_scalekit_client()
    options = AuthorizationUrlOptions()
    options.state = state
    auth_url = sc.get_authorization_url(REDIRECT_URI, options)
    return redirect(auth_url)

def callback(request: HttpRequest):
    stored_state = request.session.pop("oauth_state", None)
    if not stored_state or stored_state != request.GET.get("state"):
        return HttpResponse("CSRF mismatch", status=403)
    if error := request.GET.get("error"):
        return HttpResponse(f"Auth error: {error}", status=400)

    sc = get_scalekit_client()
    result = sc.authenticate_with_code(request.GET["code"], REDIRECT_URI)

    request.session["access_token"] = result.access_token
    request.session["refresh_token"] = result.refresh_token
    request.session["id_token"] = result.id_token
    request.session.cycle_key()  # session fixation protection

    return redirect("/dashboard")

def logout(request: HttpRequest):
    id_token = request.session.get("id_token", "")
    sc = get_scalekit_client()
    logout_url = sc.get_logout_url(LogoutUrlOptions(post_logout_redirect_uri="http://localhost:8000"))
    request.session.flush()
    return redirect(logout_url)
```

## Middleware

```python
# yourapp/middleware.py
from django.shortcuts import redirect
from .auth_client import get_scalekit_client

SKIP_PATHS = {"/auth/login", "/auth/callback", "/auth/logout"}

class ScalekitAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in SKIP_PATHS:
            return self.get_response(request)

        access_token = request.session.get("access_token")
        refresh_token = request.session.get("refresh_token")

        if not access_token:
            return redirect(f"/auth/login?next={request.path}")

        sc = get_scalekit_client()
        try:
            sc.validate_access_token(access_token)
        except Exception:
            # Token expired — attempt silent refresh
            if not refresh_token:
                request.session.flush()
                return redirect("/auth/login")
            try:
                refreshed = sc.refresh_access_token(refresh_token)
                request.session["access_token"] = refreshed.access_token
                request.session["refresh_token"] = refreshed.refresh_token
            except Exception:
                request.session.flush()
                return redirect("/auth/login")

        return self.get_response(request)
```

Register in `settings.py`:

```python
MIDDLEWARE = [
    # ... Django default middleware ...
    "yourapp.middleware.ScalekitAuthMiddleware",
]
```

## URL configuration

```python
# yourapp/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("auth/login",    views.login,    name="auth_login"),
    path("auth/callback", views.callback, name="auth_callback"),
    path("auth/logout",   views.logout,   name="auth_logout"),
    path("dashboard/",    views.dashboard, name="dashboard"),
]
```

## Session storage

Use database-backed sessions for production:

```python
# settings.py
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True   # HTTPS only
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 86400     # 24 hours
```

## Implementation checklist

```
- [ ] Step 1: pip install scalekit-sdk-python python-dotenv django
- [ ] Step 2: Set SCALEKIT_ENVIRONMENT_URL, SCALEKIT_CLIENT_ID, SCALEKIT_CLIENT_SECRET in .env
- [ ] Step 3: Create auth_client.py with singleton ScalekitClient
- [ ] Step 4: Implement login, callback, logout views
- [ ] Step 5: Add ScalekitAuthMiddleware to MIDDLEWARE in settings.py
- [ ] Step 6: Register /auth/login, /auth/callback, /auth/logout routes
- [ ] Step 7: Configure SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SECURE=True
- [ ] Step 8: Register callback URI in Scalekit dashboard
- [ ] Step 9: Call session.cycle_key() after login (session fixation protection)
- [ ] Step 10: Test: login → /dashboard → token refresh → logout
```

## Troubleshooting

**`authenticate_with_code` raises exception**: The `redirect_uri` must exactly match the URI in the Scalekit dashboard — including scheme, host, and path.

**Session not persisting across requests**: Ensure `django.contrib.sessions` is in `INSTALLED_APPS` and `python manage.py migrate` has been run.

**CSRF errors on callback**: The `/auth/callback` GET route is not subject to Django's CSRF middleware (CSRF applies to POST). Add it to `CSRF_EXEMPT_URLS` if you hit issues.

**Redirect loop in middleware**: Verify `SKIP_PATHS` includes `/auth/login`, `/auth/callback`, and `/auth/logout`. Also ensure static file paths are excluded.

## Tactics

### Deep link preservation

```python
# In login view
next_url = request.GET.get("next", "/dashboard")
if not next_url.startswith("/"):
    next_url = "/dashboard"
request.session["next"] = next_url

# In callback view
next_url = request.session.pop("next", "/dashboard")
return redirect(next_url)
```

### Cache-Control: no-store on protected views

```python
from django.views.decorators.cache import never_cache

@never_cache
def dashboard(request):
    ...
```

### IDP-initiated SSO

```python
def idp_login(request):
    sc = get_scalekit_client()
    claims = sc.get_idp_initiated_login_claims(request.GET.get("idp_initiated_login", ""))
    opts = AuthorizationUrlOptions()
    opts.organization_id = claims.organization_id or None
    opts.connection_id = claims.connection_id or None
    opts.login_hint = claims.login_hint or None
    auth_url = sc.get_authorization_url(REDIRECT_URI, options=opts)
    return redirect(auth_url)
```

## Reference

- Scalekit Python SDK: [docs.scalekit.com/apis](https://docs.scalekit.com/apis)
- Django sessions: [docs.djangoproject.com/topics/http/sessions](https://docs.djangoproject.com/en/stable/topics/http/sessions/)
