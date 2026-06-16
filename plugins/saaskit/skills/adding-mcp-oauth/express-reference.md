# Express.js MCP OAuth Authentication with Scalekit

## Overview

Pattern for building production-ready MCP servers using Express.js, TypeScript, and OAuth 2.1 Bearer token authentication via Scalekit. Provides fine-grained control over HTTP request handling, middleware chains, and server behavior.

## When to Use This Pattern

- **Node.js ecosystem**: Leverage existing npm packages and TypeScript tooling
- **Custom middleware chains**: Rate limiting, request logging, complex authorization
- **Existing Express applications**: Add MCP capabilities to established codebases
- **Fine-grained HTTP control**: Routing, CORS policies, health checks, multiple endpoints

## Core Architecture

### Token Validation Flow

```
MCP Client → Express Server (401 + WWW-Authenticate)
MCP Client → Scalekit (Exchange code for token)
Scalekit → MCP Client (Bearer token)
MCP Client → Express Server (POST /mcp + Bearer token)
Express Middleware → Scalekit SDK (Validate token)
McpServer → Tool Handler → Response
```

### Key Components

1. **Express Middleware**: Validates Bearer tokens before routing to MCP handlers
2. **Scalekit Node SDK**: Validates JWT signatures, expiration, issuer, and audience
3. **McpServer**: Official MCP SDK server handling JSON-RPC and tool registration
4. **StreamableHTTPServerTransport**: Bridges Express HTTP to MCP protocol
5. **Zod Schema Validation**: Type-safe input validation for tool parameters
6. **OAuth Resource Metadata Endpoint**: `/.well-known/oauth-protected-resource` for client discovery

## Implementation Patterns

### Environment Configuration

Required variables: `SCALEKIT_ENVIRONMENT_URL`, `SCALEKIT_CLIENT_ID`, `SCALEKIT_CLIENT_SECRET`, `EXPECTED_AUDIENCE`, `PROTECTED_RESOURCE_METADATA`, `PORT`.

### Scalekit Client Initialization

```typescript
import { ScalekitClient } from '@scalekit-sdk/node';

const scalekit = new ScalekitClient(SCALEKIT_ENVIRONMENT_URL, SCALEKIT_CLIENT_ID, SCALEKIT_CLIENT_SECRET);
```

Initialize once at module level for connection pooling.

### MCP Server Setup

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({ name: 'Greeting MCP', version: '1.0.0' });

server.tool(
  'greet_user',
  'Greets the user with a personalized message.',
  { name: z.string().min(1, 'Name is required') },
  async ({ name }: { name: string }) => ({
    content: [{ type: 'text', text: `Hi ${name}, welcome to Scalekit!` }]
  })
);
```

### Express Middleware Authentication

```typescript
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/.well-known/oauth-protected-resource' || req.path === '/health') {
    next();
    return;
  }

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length).trim()
    : undefined;

  if (!token) {
    res.status(401).set('WWW-Authenticate', WWW_HEADER_VALUE).json({ error: 'Missing Bearer token' });
    return;
  }

  try {
    await scalekit.validateToken(token, { audience: [EXPECTED_AUDIENCE] });
    next();
  } catch (error) {
    res.status(401).set('WWW-Authenticate', WWW_HEADER_VALUE).json({ error: 'Token validation failed' });
  }
});
```

**Key**: Always `return` after sending a response to prevent "headers already sent" errors.

### MCP Transport Layer

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

app.post('/', async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

Setting `sessionIdGenerator: undefined` ensures stateless operation for serverless deployments.

## Common Pitfalls

**Mismatched Audience**: `EXPECTED_AUDIENCE` must match the Server URL in Scalekit exactly — including trailing slash.

**Headers Already Sent**: Always `return` after `res.json()` or `res.send()` in middleware.

**Middleware Order**: Correct order: CORS → body parsing → authentication → routes.

**TypeScript Module Resolution**: Always include `.js` extension when importing from MCP SDK.

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.13.0",
    "@scalekit-sdk/node": "^2.0.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^5.1.0",
    "zod": "^3.25.57"
  }
}
```

## Reference

- Full example: [scalekit-inc/mcp-auth-demos/tree/main/greeting-mcp-node](https://github.com/scalekit-inc/mcp-auth-demos/tree/main/greeting-mcp-node)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Scalekit Node SDK](https://github.com/scalekit-inc/scalekit-sdk-node)
- [Scalekit MCP Auth Demos](https://github.com/scalekit-inc/mcp-auth-demos/tree/main)
