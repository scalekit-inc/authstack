# Changelog

AgentKit and SaaSKit are versioned separately and released together. Each release is tagged per kit: `agentkit-vX.Y.Z` and `saaskit-vX.Y.Z`. Versions follow the table in [AGENTS.md](./AGENTS.md#semver).

## 2026-10-28: agentkit 2.3.2, saaskit 2.2.3

### Added

- Cursor Marketplace listing: `scalekit-agentkit` and `scalekit-saaskit`, each with a logo and tags. Claude, Codex, and Copilot still publish `agentkit` and `saaskit`.
- `SECURITY.md` with a private reporting route and a 3 business day acknowledgement target.
- README sections for Cursor, Terms, and Privacy.

### Changed

- Connector and tool counts read 600+ connectors and 35,000+ tools everywhere a count is stated.
- `setup-agentkit` and `setup-saaskit` no longer point at `setup-scalekit`. When the plugin or CLI is missing they point at `npx @scalekit-inc/cli setup -y`.
- `integrate-agentkit-host` points OpenClaw users at the published ClawHub skill.

### Fixed

- agentkit: `integrate-agentkit-host/scripts/pyproject.toml` declares `requests`, which `tool_exec.py` imports.

### Removed

- The local AXIS eval adapters are no longer published. Both are still ignored in `.gitignore` for local runs.

## 2026-10-04: agentkit 2.3.1, saaskit 2.2.2

### Changed

- `setup-scalekit` runs the CLI non-interactively and no longer prints the client secret.
- Portable skills install from `scalekit-inc/authstack`. `scalekit-inc/skills` is retired.

## 2026-10-01: agentkit 2.3.0, saaskit 2.2.1

### Fixed

- agentkit: `integrate-agentkit` follows the docs quickstart golden path and uses current LangChain 1.x and ADK Runner samples.
- agentkit: `expose-agentkit-mcp` adds a Node Virtual MCP path and requires a Gmail connection. The Gmail-without-a-connection fallback is gone.
- agentkit: `tool_exec.py` never prints access or refresh tokens.
- saaskit: CSRF state and callback error handling, and the sessions link.
- `patch-from-axis` no longer shows up in `npx skills` installs.

Earlier releases are in the git history.
