# Scalekit Auth — Flask

## Dependencies

```bash
pip install scalekit-sdk-python python-dotenv flask flask-session
```

## Environment variables

```env
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.dev
SCALEKIT_CLIENT_ID=your_client_id
SCALEKIT_CLIENT_SECRET=your_client_secret
SCALEKIT_REDIRECT_URI=http://localhost:5000/auth/callback
SECRET_KEY=your-flask-secret-key
```

## App setup

```python
# app.py
import os, secrets
from dotenv import load_dotenv
from flask import Flask, redirect, request, session, url_for, jsonify
from flask_session import Session
from scalekit import ScalekitClient
from scalekit.common.scalekit import AuthorizationUrlOptions, LogoutUrlOptions

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")
app.config["SESSION_TYPE"] = "filesystem"  # or "redis", "sqlalchemy"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
Session(app)

REDIRECT_URI = os.getenv("SCALEKIT_REDIRECT_URI", "http://localhost:5000/auth/callback")

sc = ScalekitClient(
    env_url=os.getenv("SCALEKIT_ENVIRONMENT_URL"),
    client_id=os.getenv("SCALEKIT_CLIENT_ID"),
    client_secret=os.getenv("SCALEKIT_CLIENT_SECRET"),
)
```

## Auth flow at a glance

```
GET /auth/login
  → get_authorization_url() → 302 to Scalekit

GET /auth/callback?code=...
  → authenticate_with_code() → set session → redirect to /dashboard

@require_auth decorator
  → validate_access_token() → refresh if expired → pass or redirect /auth/login

GET /auth/logout
  → get_logout_url() → clear session → 302 to Scalekit end-session
```

## Routes

```python
@app.get("/auth/login")
def login():
    state = secrets.token_urlsafe(32)
    session["oauth_state"] = state
    options = AuthorizationUrlOptions()
    options.state = state
    auth_url = sc.get_authorization_url(REDIRECT_URI, options)
    return redirect(auth_url)

@app.get("/auth/callback")
def callback():
    stored = session.pop("oauth_state", None)
    if not stored or stored != request.args.get("state"):
        return "CSRF mismatch", 403
    if error := request.args.get("error"):
        return f"Auth error: {error}", 400

    result = sc.authenticate_with_code(request.args["code"], REDIRECT_URI)
    session["access_token"]  = result.access_token
    session["refresh_token"] = result.refresh_token
    session["id_token"]      = result.id_token
    session.modified = True

    return redirect(session.pop("next", "/dashboard"))

@app.get("/auth/logout")
def logout():
    id_token = session.get("id_token", "")
    logout_url = sc.get_logout_url(LogoutUrlOptions(post_logout_redirect_uri="http://localhost:5000"))
    session.clear()
    return redirect(logout_url)
```

## Auth decorator

```python
from functools import wraps
from flask import g

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        access_token  = session.get("access_token")
        refresh_token = session.get("refresh_token")

        if not access_token:
            session["next"] = request.path
            return redirect(url_for("login"))

        try:
            sc.validate_access_token(access_token)
        except Exception:
            if not refresh_token:
                session.clear()
                return redirect(url_for("login"))
            try:
                refreshed = sc.refresh_access_token(refresh_token)
                session["access_token"]  = refreshed.access_token
                session["refresh_token"] = refreshed.refresh_token
            except Exception:
                session.clear()
                return redirect(url_for("login"))

        return f(*args, **kwargs)
    return decorated
```

## Protected routes

```python
@app.get("/dashboard")
@require_auth
def dashboard():
    return jsonify({"status": "authenticated"})
```

## Implementation checklist

```
- [ ] Step 1: pip install scalekit-sdk-python python-dotenv flask flask-session
- [ ] Step 2: Set SCALEKIT_ENVIRONMENT_URL, SCALEKIT_CLIENT_ID, SCALEKIT_CLIENT_SECRET, SECRET_KEY in .env
- [ ] Step 3: Initialize ScalekitClient at module level (single instance per process)
- [ ] Step 4: Configure Flask-Session with filesystem or Redis backend
- [ ] Step 5: Implement /auth/login, /auth/callback, /auth/logout routes
- [ ] Step 6: Create require_auth decorator; apply to protected routes
- [ ] Step 7: Set SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SECURE=True, SESSION_COOKIE_SAMESITE=Lax
- [ ] Step 8: Register callback URI in Scalekit dashboard
- [ ] Step 9: Test: login → /dashboard → token refresh → logout
```

## Troubleshooting

**`authenticate_with_code` raises exception**: The `redirect_uri` must exactly match the URI in the Scalekit dashboard — including scheme, host, path, and no trailing slash.

**Session data lost between requests**: Ensure `SECRET_KEY` is set and consistent. With `SESSION_TYPE="filesystem"`, verify the session directory is writable.

**`SameSite=Lax` breaking SSO callback**: Some IdPs POST the callback. If you use POST-based SSO, set `SESSION_COOKIE_SAMESITE = "None"` with `SESSION_COOKIE_SECURE = True`.

**Token refresh race condition**: Multiple concurrent requests with the same refresh token can exhaust it. Use a per-user lock or treat `invalid_grant` as session expiry.

## Tactics

### Blueprint structure for larger apps

```python
# auth/routes.py
from flask import Blueprint
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.get("/login")
def login(): ...

# app.py
from auth.routes import auth_bp
app.register_blueprint(auth_bp)
```

### IDP-initiated SSO

```python
@app.get("/auth/idp-login")
def idp_login():
    claims = sc.get_idp_initiated_login_claims(request.args.get("idp_initiated_login", ""))
    opts = AuthorizationUrlOptions()
    opts.organization_id = claims.organization_id or None
    opts.connection_id = claims.connection_id or None
    opts.login_hint = claims.login_hint or None
    return redirect(sc.get_authorization_url(REDIRECT_URI, options=opts))
```

### Cache-Control: no-store on protected responses

```python
from flask import make_response

@app.get("/dashboard")
@require_auth
def dashboard():
    resp = make_response(jsonify({"status": "authenticated"}))
    resp.headers["Cache-Control"] = "no-store"
    return resp
```

### Redis session backend (production)

```python
app.config["SESSION_TYPE"]         = "redis"
app.config["SESSION_REDIS"]        = redis.from_url(os.getenv("REDIS_URL"))
app.config["SESSION_USE_SIGNER"]   = True
app.config["SESSION_KEY_PREFIX"]   = "sk_session:"
app.config["PERMANENT_SESSION_LIFETIME"] = 86400
```

## Reference

- Scalekit Python SDK: [docs.scalekit.com/apis](https://docs.scalekit.com/apis)
- Flask-Session: [flask-session.readthedocs.io](https://flask-session.readthedocs.io/)
