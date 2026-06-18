# FastAPI + FastMCP OAuth Authentication with Scalekit

## Overview

Pattern for building production-ready MCP servers using FastAPI and FastMCP with OAuth 2.1 Bearer token authentication via Scalekit. Provides fine-grained control over authentication middleware, token validation, and server behavior compared to FastMCP's built-in OAuth provider.

## When to Use This Pattern

- **Custom middleware requirements**: Rate limiting, request logging, complex authorization
- **Existing FastAPI applications**: Integrate MCP tools into established codebases
- **Advanced authorization**: Scope-based access control, multi-tenancy, custom claims
- **Full HTTP control**: CORS policies, health checks, multiple endpoints alongside MCP tools

**Don't use this pattern** if FastMCP's built-in OAuth provider meets your needs — the additional FastAPI layer adds complexity.

## Core Architecture

### Token Validation Flow

```
MCP Client → FastAPI Server (401 + WWW-Authenticate)
MCP Client → Scalekit (Exchange code for token)
Scalekit → MCP Client (Bearer token)
MCP Client → FastAPI Server (Request + Bearer token)
FastAPI Middleware → Scalekit SDK (Validate token)
FastAPI → MCP Tool Handler → Response
```

## Implementation Patterns

### Middleware Authentication Pattern

```python
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path in {"/health", "/.well-known/oauth-protected-resource"}:
        return await call_next(request)

    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response(
            '{"error": "Missing Bearer token"}',
            status_code=401,
            headers={"WWW-Authenticate": f'Bearer realm="OAuth", resource_metadata="{RESOURCE_METADATA_URL}"'},
            media_type="application/json"
        )

    token = auth_header.split("Bearer ", 1)[1].strip()

    options = TokenValidationOptions(
        issuer=SCALEKIT_ENVIRONMENT_URL,
        audience=[EXPECTED_AUDIENCE]
    )

    try:
        is_valid = scalekit_client.validate_access_token(token, options=options)
        if not is_valid:
            raise ValueError("Invalid token")
    except Exception:
        return Response(
            '{"error": "Token validation failed"}',
            status_code=401,
            headers=WWW_HEADER,
            media_type="application/json"
        )

    return await call_next(request)
```

### FastMCP Tool Registration

```python
@mcp.tool(
    name="greet_user",
    description="Greets the user with a personalized message."
)
async def greet_user(name: str, ctx: Context | None = None) -> dict:
    return {
        "content": [{"type": "text", "text": f"Hi {name}, welcome to Scalekit!"}]
    }
```

### Application Mounting

```python
mcp_app = mcp.http_app(path="/")
app = FastAPI(lifespan=mcp_app.lifespan)

# Add middleware (CORS, auth, etc.)
app.add_middleware(CORSMiddleware, ...)

# Add custom endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mount MCP at root — MUST be last
app.mount("/", mcp_app)
```

**Layering order**: Create FastMCP HTTP app → Create FastAPI app with shared lifespan → Add middleware → Register custom endpoints → Mount FastMCP last.

## Common Pitfalls

**Mismatched Audience**: `EXPECTED_AUDIENCE` must match the Server URL in Scalekit exactly.

**Middleware Order**: Add middleware before mounting MCP app; mount MCP last.

**Missing Resource Metadata**: Verify `PROTECTED_RESOURCE_METADATA` JSON is copied correctly from Scalekit dashboard.

**Development vs Production URLs**: Use environment-specific values for `EXPECTED_AUDIENCE`.

## Dependencies

```txt
mcp>=1.0.0
fastapi>=0.104.0
fastmcp>=0.8.0
uvicorn>=0.24.0
pydantic>=2.5.0
python-dotenv>=1.0.0
httpx>=0.25.0
python-jose[cryptography]>=3.3.0
scalekit-sdk-python>=2.4.0
```

## Extension Patterns

### Scope-Based Authorization

```python
# In middleware — attach scopes to request state
decoded = jwt.decode(token, options={"verify_signature": False})
request.state.scopes = decoded.get("scope", "").split()

# In tool — check scopes
@mcp.tool()
async def admin_tool(ctx: Context) -> dict:
    if "admin" not in ctx.request_context.state.scopes:
        raise PermissionError("Requires admin scope")
```

### Multi-Tenancy

```python
# In middleware
request.state.org_id = decoded.get("org_id")

# In tool
@mcp.tool()
async def get_org_data(ctx: Context) -> dict:
    org_id = ctx.request_context.state.org_id
    data = await fetch_data_for_org(org_id)
    return {"content": [{"type": "text", "text": json.dumps(data)}]}
```

## Reference

- Full example: [scalekit-inc/mcp-auth-demos/tree/main/greeting-mcp-python](https://github.com/scalekit-inc/mcp-auth-demos/tree/main/greeting-mcp-python)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
- [Scalekit MCP Auth Demos](https://github.com/scalekit-inc/mcp-auth-demos/tree/main)
