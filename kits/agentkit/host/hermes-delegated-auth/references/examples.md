# Examples

Run every command from the skill directory.

## Search LinkedIn (HarvestAPI)

Any LinkedIn request (profiles, jobs, companies, posts, people, ads, groups)
uses provider `HARVESTAPI`.

```
User: Find software engineers in San Francisco on LinkedIn
```

1. `--list-connections --provider HARVESTAPI` → `key_id: harvestapi-xxxx`, `type: API_KEY`
2. `--generate-link --connection-name harvestapi-xxxx` → ACTIVE
3. `--get-tool --provider HARVESTAPI` → `harvestapi_search_people`
4. `--get-tool --tool-name harvestapi_search_people` → params from schema only
5. `--execute-tool --tool-name harvestapi_search_people --connection-name harvestapi-xxxx --tool-input '{"first_names": "John", "locations": "San Francisco", "current_job_titles": "Software Engineer"}'`

## Search the web with Exa

```
User: Search for latest AI news using Exa
```

1. `--list-connections --provider EXA` → `key_id: exa`, `type: API_KEY`
2. `--generate-link --connection-name exa` → ACTIVE
3. `--get-tool --provider EXA` → `exa_search`
4. `--get-tool --tool-name exa_search` → `query` required
5. `--execute-tool --tool-name exa_search --connection-name exa --tool-input '{"query": "latest AI news"}'`

## Read a Notion page (OAuth)

```
User: Read my Notion page https://notion.so/...
```

1. `--list-connections --provider NOTION` → `key_id: notion-xxxx`, `type: OAUTH`
2. `--generate-link --connection-name notion-xxxx` → ACTIVE or magic link
3. `--get-tool --provider NOTION` → `notion_page_get`
4. `--get-tool --tool-name notion_page_get` → `page_id` required
5. `--execute-tool --tool-name notion_page_get --connection-name notion-xxxx --tool-input '{"page_id": "..."}'`

## Action not in the catalog

```
User: Fetch the blocks of a Notion page
```

1. Discover + authorize Notion as above
2. `--get-tool --provider NOTION` → no blocks-fetch tool
3. `--proxy-request --path "/blocks/<page_id>/children"`
4. If `TOOL_PROXY_DISABLED`, say the action is not available yet
