# File uploads and downloads

Some providers have no named Scalekit tool for files. Use `--proxy-request`
with `--input-file` (upload) or a direct URL (download).

Proxy passes the stored OAuth access token. It does not refresh. A `401`
means re-run `--generate-link`. If the account is `ACTIVE` and proxy still
returns `401`, the user must open a new magic link.

## Notion upload (3 steps)

### 1. Create an upload object

```bash
uv run scripts/tool_exec.py --proxy-request \
  --connection-name <CONNECTION_NAME> \
  --path "/v1/file_uploads" \
  --method POST \
  --body '{"mode": "single_part"}' \
  --headers '{"Notion-Version": "2022-06-28", "Content-Type": "application/json"}'
```

The response has `id` and `upload_url`. Valid for 1 hour.

### 2. Send the file

```bash
uv run scripts/tool_exec.py --proxy-request \
  --connection-name <CONNECTION_NAME> \
  --path "/v1/file_uploads/<file_upload_id>/send" \
  --method POST \
  --input-file /path/to/file \
  --headers '{"Notion-Version": "2022-06-28"}'
```

Notion rejects `application/octet-stream`. Copy unknown extensions (for
example `.md`) to `.txt` first.

### 3. Attach the file block

```bash
uv run scripts/tool_exec.py --proxy-request \
  --connection-name <CONNECTION_NAME> \
  --path "/v1/blocks/<page_id>/children" \
  --method PATCH \
  --body '{
    "children": [{
      "object": "block",
      "type": "file",
      "file": {
        "type": "file_upload",
        "file_upload": {"id": "<file_upload_id>"},
        "name": "<display_filename>"
      }
    }]
  }' \
  --headers '{"Notion-Version": "2022-06-28", "Content-Type": "application/json"}'
```

Do not use `notion_page_content_append` for file blocks. It does not support
`file_upload` and returns `INTERNAL_ERROR`.

## Notion download

Notion files live on S3. Pre-signed URLs expire in 1 hour. Fetch a fresh URL
each time.

### 1. List page blocks

```bash
uv run scripts/tool_exec.py --proxy-request \
  --connection-name <CONNECTION_NAME> \
  --path "/v1/blocks/<page_id>/children" \
  --method GET \
  --headers '{"Notion-Version": "2022-06-28"}'
```

The URL is at `file.file.url` on the `"type": "file"` block.

### 2. Download the S3 URL directly

The URL is pre-signed. Do not send it through Scalekit.

```python
import urllib.request
urllib.request.urlretrieve("<s3_url>", "/local/path/filename")
```

`--output-file` on `--proxy-request` saves the JSON block, not the file bytes.

## Google Drive

Coming soon.

## OneDrive / SharePoint

Coming soon.
