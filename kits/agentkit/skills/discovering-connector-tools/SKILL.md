---
name: discovering-connector-tools
description: Discovers live tools for a Scalekit AgentKit connector and explains their input and output schemas. Use when a user asks what tools are available for Gmail, Slack, Salesforce, or another connector, wants to inspect `input_schema` or `output_schema`, or needs help narrowing the tool set for an agent.
---

# Discovering Connector Tools

Use live AgentKit metadata as the source of truth for tool names, required inputs, and output schemas.

Do not rely on static connector notes as a complete catalog. Those may lag the live platform.

## Prerequisites

**Install the SDK** (pick the project's language):

```bash
# Python
pip install scalekit-sdk-python python-dotenv

# Node.js
npm install @scalekit-sdk/node dotenv
```

**Environment variables** — put these in `.env` (or export them) before running discovery:

```bash
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.com
SCALEKIT_CLIENT_ID=<from dashboard>
SCALEKIT_CLIENT_SECRET=<from dashboard>
```

Get credentials from [app.scalekit.com](https://app.scalekit.com) → Developers → Settings → API Credentials.

**Connector / provider slugs:** `providers` in the SDK expects uppercase connector type slugs (e.g. `GMAIL`, `SLACK`, `SALESFORCE`, `NOTION`, `GITHUB`, `GOOGLECALENDAR`). Source of truth for available connectors: [Connectors catalog](https://docs.scalekit.com/agentkit/connectors/) and the Scalekit Dashboard → AgentKit → Connections. Prefer the live `get_tools` response over any static list.

## Discovery workflow

1. Identify the target connector (slug from the catalog/dashboard above) or exact tool name.
2. Use the Scalekit SDK to fetch live tool metadata (see code below).
3. Summarize:
   - tool name
   - connector
   - what the tool does
   - required fields from `input_schema.required`
   - optional fields from `input_schema.properties`
   - important fields from `output_schema.properties`
4. Recommend the smallest useful tool set for the workflow.

## Live tool discovery (Python)

```python
from scalekit import ScalekitClient
import os
from dotenv import load_dotenv
load_dotenv()  # loads SCALEKIT_* from .env

sk_client = ScalekitClient(
    client_id=os.getenv("SCALEKIT_CLIENT_ID"),
    client_secret=os.getenv("SCALEKIT_CLIENT_SECRET"),
    env_url=os.getenv("SCALEKIT_ENVIRONMENT_URL"),
)

# List ALL tools for a provider — page until exhausted (do not stop after one call)
page_token = None
while True:
    page = sk_client.actions.get_tools(
        providers=["GMAIL"], page_size=100, page_token=page_token
    )
    for tool in page.tools:
        print(f"Tool: {tool.name}")
        print(f"  Description: {tool.description}")
        print(f"  Input schema: {tool.input_schema}")
        print(f"  Output schema: {tool.output_schema}")
    page_token = getattr(page, "next_page_token", None) or getattr(page, "nextPageToken", None)
    if not page_token:
        break

# Get a specific tool by name
tool = sk_client.actions.get_tools(tool_name="gmail_fetch_mails")
```

## Live tool discovery (Node.js / TypeScript)

```typescript
import { ScalekitClient } from '@scalekit-sdk/node';
import 'dotenv/config'; // loads SCALEKIT_* from .env

const client = new ScalekitClient(
  process.env.SCALEKIT_ENVIRONMENT_URL as string,
  process.env.SCALEKIT_CLIENT_ID as string,
  process.env.SCALEKIT_CLIENT_SECRET as string
);

// List ALL tools for a provider — page until exhausted
let pageToken: string | undefined;
do {
  const page = await client.actions.getTools({
    providers: ['GMAIL'],
    pageSize: 100,
    pageToken,
  });
  for (const tool of page.tools) {
    console.log(`Tool: ${tool.name}`);
    console.log(`  Description: ${tool.description}`);
  }
  pageToken = page.nextPageToken;
} while (pageToken);

// Get a specific tool by name
const tool = await client.actions.getTools({ toolName: 'gmail_fetch_mails' });
```

## Terminology

- `connector`: Gmail, Slack, Salesforce, Notion, or a custom connector
- `connection`: the exact dashboard configuration name used for authorization
- `connected account`: the per-user authorized record
- `tool`: the executable action exposed by a connector

Use `connector` in explanations. Only use `provider` when the SDK or API filter field literally expects that name.

## Guardrails

- **MUST** treat live tool metadata (`get_tools`) as the source of truth — never rely on static docs as a complete catalog.
- **MUST** restrict the tool set before handing it to an LLM — fewer relevant tools improve selection accuracy.
- **MUST NOT** execute tools or authorize connected accounts here — that belongs to `integrating-agentkit`. This skill only discovers and explains schemas.
- `connection_name` is the exact dashboard value — may not equal the connector slug.

**Pagination:** `get_tools` returns up to `page_size` results per call. The examples above loop on `next_page_token` / `nextPageToken` until empty — **MUST** do the same; never assume one call returns every tool.

**If `get_tools` returns empty:** verify the connector is configured in the dashboard and the connection name matches exactly.

## Deep reference

- AgentKit overview: [docs.scalekit.com/agentkit/overview](https://docs.scalekit.com/agentkit/overview/)
- Tool discovery: [docs.scalekit.com/agentkit/tool-discovery](https://docs.scalekit.com/agentkit/tool-discovery/)
- Connectors catalog: [docs.scalekit.com/agentkit/connectors](https://docs.scalekit.com/agentkit/connectors/)

## When to switch skills

- Use `integrating-agentkit` for the full integration workflow (create account, authorize, execute).
- Use the Scalekit MCP server (`https://mcp.scalekit.com`) to validate a tool call interactively.
- Use `exposing-agentkit-via-mcp` to expose discovered tools over MCP.