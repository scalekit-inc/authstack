# FastMCP OAuth with Scalekit Provider

Secure your FastMCP server with OAuth 2.1 in just 5 lines of code using Scalekit's built-in provider. This approach handles token validation, scope enforcement, and authentication flows automatically.

## FastMCP advantage

**Standard MCP OAuth**: ~30 lines of middleware code, manual token validation
**FastMCP with Scalekit provider**: ~5 lines of configuration, automatic token handling

## Setup workflow

```
FastMCP OAuth Setup:
- [ ] Step 1: Register MCP server in Scalekit
- [ ] Step 2: Install FastMCP and dependencies
- [ ] Step 3: Configure Scalekit provider
- [ ] Step 4: Add scope validation to tools
- [ ] Step 5: Test with MCP Inspector
```

## Step 1: Register MCP server

In Scalekit dashboard:

1. Navigate to **Dashboard > MCP Servers > Add MCP Server**
2. Enter server name (e.g., `FastMCP Todo Server`)
3. Set **Server URL** to `http://localhost:3002/` (include trailing slash)
4. Define scopes for your tools (e.g., `todo:read`, `todo:write`)
5. Click **Save** and note the `resource_id`

**Critical**: Use base URL with trailing slash. FastMCP appends `/mcp` automatically.

## Step 2: Install dependencies

```bash
mkdir fastmcp-server && cd fastmcp-server
python3 -m venv venv && source venv/bin/activate
pip install "fastmcp>=2.13.0.2" python-dotenv
```

## Step 3: Configure Scalekit provider

```python
import os
from dotenv import load_dotenv
from fastmcp import FastMCP
from fastmcp.server.auth.providers.scalekit import ScalekitProvider

load_dotenv()

mcp = FastMCP(
    "Your Server Name",
    stateless_http=True,
    auth=ScalekitProvider(
        environment_url=os.getenv("SCALEKIT_ENVIRONMENT_URL"),
        client_id=os.getenv("SCALEKIT_CLIENT_ID"),
        resource_id=os.getenv("SCALEKIT_RESOURCE_ID"),
        mcp_url=os.getenv("MCP_URL"),
    ),
)

if __name__ == "__main__":
    mcp.run(transport="http", port=int(os.getenv("PORT", "3002")))
```

The Scalekit provider handles token validation, OAuth flow, WWW-Authenticate headers, and the discovery endpoint automatically.

## Step 4: Add scope validation to tools

```python
from fastmcp.server.dependencies import AccessToken, get_access_token

def _require_scope(scope: str) -> str | None:
    token: AccessToken = get_access_token()
    if scope not in token.scopes:
        return f"Insufficient permissions: `{scope}` scope required."
    return None

@mcp.tool
def create_todo(title: str, description: str = None) -> dict:
    """Create a new todo item. Requires todo:write scope."""
    error = _require_scope("todo:write")
    if error:
        return {"error": error}
    todo_id = str(uuid.uuid4())
    return {"id": todo_id, "title": title, "description": description}

@mcp.tool
def list_todos() -> dict:
    """List all todos. Requires todo:read scope."""
    error = _require_scope("todo:read")
    if error:
        return {"error": error}
    return {"todos": [...]}
```

## Step 5: Test with MCP Inspector

```bash
python server.py
# In another terminal:
npx @modelcontextprotocol/inspector@latest
```

In Inspector: enter URL `http://localhost:3002/mcp`, leave auth fields empty (uses dynamic client registration), click Connect.

## Environment variable reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SCALEKIT_ENVIRONMENT_URL` | Your Scalekit environment URL | `https://yourenv.scalekit.com` |
| `SCALEKIT_CLIENT_ID` | Client ID from Scalekit dashboard | `skc_...` |
| `SCALEKIT_RESOURCE_ID` | MCP server resource ID | `res_...` |
| `MCP_URL` | Base URL with trailing slash | `http://localhost:3002/` |
| `PORT` | HTTP server port | `3002` |

## Scope design patterns

- **Read-only**: `*:read` (e.g., `todo:read`, `data:read`)
- **Write operations**: `*:write` (e.g., `todo:write`)
- **Admin operations**: `*:admin` (e.g., `system:admin`)
- **Multiple scopes per tool**: Return error if ANY required scope is missing

## Common issues

**Token validation fails**: Verify `SCALEKIT_RESOURCE_ID` matches dashboard. Check `MCP_URL` has trailing slash.

**Scope errors persist**: Verify scopes are defined in Scalekit dashboard. Check scope strings match exactly (case-sensitive).

**MCP Inspector connection fails**: Leave auth fields empty (uses DCR). Check browser console for OAuth errors.

## Reference

- Full example: [scalekit-inc/mcp-auth-demos/tree/main/todo-fastmcp](https://github.com/scalekit-inc/mcp-auth-demos/tree/main/todo-fastmcp)
- FastMCP docs: [fastmcp.dev](https://fastmcp.dev)
- Scalekit docs: [docs.scalekit.com/authenticate/mcp/fastmcp-quickstart](https://docs.scalekit.com/authenticate/mcp/fastmcp-quickstart)
