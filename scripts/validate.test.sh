#!/usr/bin/env bash
# Fixture tests for scripts/validate.sh (SK-1836).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VALIDATE="$ROOT/scripts/validate.sh"
PASS=0
FAIL=0

if [[ ! -x "$VALIDATE" && ! -f "$VALIDATE" ]]; then
  echo "FAIL: $VALIDATE is missing"
  exit 1
fi

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

ok_skill() {
  local dir="$1"
  mkdir -p "$dir"
  cat >"$dir/SKILL.md" <<'EOF'
---
name: integrate-agentkit
description: >
  Integrates AgentKit so an agent can create a connection.
  Use when the user wants AgentKit in app code.
  It does not list connectors (that's `discover-connectors`).
---

# integrate-agentkit

One job. One hop.
EOF
}

write_skill() {
  local dir="$1"
  local name="$2"
  local desc="$3"
  local extra_lines="${4:-0}"
  mkdir -p "$dir"
  {
    printf '%s\n' '---'
    printf 'name: %s\n' "$name"
    printf 'description: >\n'
    printf '%s\n' "$desc"
    printf '%s\n' '---'
    printf '\n# %s\n\nbody\n' "$name"
    if (( extra_lines > 0 )); then
      awk -v n="$extra_lines" 'BEGIN { for (i = 0; i < n; i++) print "padding" }'
    fi
  } >"$dir/SKILL.md"
}

expect_fail() {
  local label="$1"
  local root="$2"
  local needle="$3"
  local out
  set +e
  out="$("$VALIDATE" "$root" 2>&1)"
  local code=$?
  set -e
  if [[ $code -eq 0 ]]; then
    echo "FAIL: $label (expected non-zero, got 0)"
    echo "$out"
    FAIL=$((FAIL + 1))
    return
  fi
  if ! grep -q "$needle" <<<"$out"; then
    echo "FAIL: $label (missing '$needle')"
    echo "$out"
    FAIL=$((FAIL + 1))
    return
  fi
  echo "PASS: $label"
  PASS=$((PASS + 1))
}

expect_pass() {
  local label="$1"
  local root="$2"
  local out
  set +e
  out="$("$VALIDATE" "$root" 2>&1)"
  local code=$?
  set -e
  if [[ $code -ne 0 ]]; then
    echo "FAIL: $label (expected 0, got $code)"
    echo "$out"
    FAIL=$((FAIL + 1))
    return
  fi
  echo "PASS: $label"
  PASS=$((PASS + 1))
}

# --- name must match folder ---
case_dir="$workdir/name-mismatch/skills/integrate-agentkit"
write_skill "$case_dir" "wrong-name" $'  Integrates AgentKit into app code.\n  Use when the user wants AgentKit in app code.\n  It does not list connectors (that\'s `discover-connectors`).'
expect_fail "name mismatch" "$workdir/name-mismatch" "name does not match folder"

# --- action verb ---
case_dir="$workdir/no-verb/skills/integrate-agentkit"
write_skill "$case_dir" "integrate-agentkit" $'  First stop for AgentKit wiring.\n  Use when the user wants AgentKit in app code.\n  It does not list connectors (that\'s `discover-connectors`).'
expect_fail "missing action verb" "$workdir/no-verb" "action verb"

# --- Use when ---
case_dir="$workdir/no-use-when/skills/integrate-agentkit"
write_skill "$case_dir" "integrate-agentkit" $'  Integrates AgentKit into app code.\n  It does not list connectors (that\'s `discover-connectors`).'
expect_fail "missing Use when" "$workdir/no-use-when" "Use when"

# --- sibling It does not ---
case_dir="$workdir/no-sibling/skills/integrate-agentkit"
write_skill "$case_dir" "integrate-agentkit" $'  Integrates AgentKit into app code.\n  Use when the user wants AgentKit in app code.'
expect_fail "missing It does not" "$workdir/no-sibling" "It does not"

# --- sibling pointer ---
case_dir="$workdir/no-pointer/skills/integrate-agentkit"
write_skill "$case_dir" "integrate-agentkit" $'  Integrates AgentKit into app code.\n  Use when the user wants AgentKit in app code.\n  It does not list connectors.'
expect_fail "missing sibling pointer" "$workdir/no-pointer" "that's \`name\`"

# --- noun that looks like a third-person verb ---
case_dir="$workdir/fake-verb/skills/integrate-agentkit"
write_skill "$case_dir" "integrate-agentkit" $'  This wires AgentKit into app code.\n  Use when the user wants AgentKit in app code.\n  It does not list connectors (that\'s `discover-connectors`).'
expect_fail "noun is not an action verb" "$workdir/fake-verb" "action verb"

# --- line budget ---
case_dir="$workdir/too-long/skills/integrate-agentkit"
write_skill "$case_dir" "integrate-agentkit" $'  Integrates AgentKit into app code.\n  Use when the user wants AgentKit in app code.\n  It does not list connectors (that\'s `discover-connectors`).' 200
expect_fail "over 200 lines" "$workdir/too-long" "200"

# --- marketplace plugin names ---
case_dir="$workdir/bad-market/skills/integrate-agentkit"
ok_skill "$case_dir"
mkdir -p "$workdir/bad-market/.claude-plugin"
cat >"$workdir/bad-market/.claude-plugin/marketplace.json" <<'EOF'
{
  "name": "authstack",
  "plugins": [
    { "name": "agentkit", "source": "./kits/agentkit" },
    { "name": "mcp-auth", "source": "./kits/mcp-auth" }
  ]
}
EOF
expect_fail "forbidden marketplace plugin" "$workdir/bad-market" "mcp-auth"

# --- plugin.json name ---
case_dir="$workdir/bad-plugin/skills/integrate-agentkit"
ok_skill "$case_dir"
mkdir -p "$workdir/bad-plugin/kits/agent-auth/.claude-plugin"
cat >"$workdir/bad-plugin/kits/agent-auth/.claude-plugin/plugin.json" <<'EOF'
{ "name": "agent-auth", "version": "1.0.0" }
EOF
expect_fail "forbidden plugin.json name" "$workdir/bad-plugin" "agent-auth"

# --- happy path ---
case_dir="$workdir/ok/skills/integrate-agentkit"
ok_skill "$case_dir"
mkdir -p "$workdir/ok/.claude-plugin" "$workdir/ok/kits/agentkit/.claude-plugin" "$workdir/ok/kits/saaskit/.claude-plugin"
cat >"$workdir/ok/.claude-plugin/marketplace.json" <<'EOF'
{
  "name": "authstack",
  "plugins": [
    { "name": "agentkit", "source": "./kits/agentkit" },
    { "name": "saaskit", "source": "./kits/saaskit" }
  ]
}
EOF
cat >"$workdir/ok/kits/agentkit/.claude-plugin/plugin.json" <<'EOF'
{ "name": "agentkit", "version": "2.2.0" }
EOF
cat >"$workdir/ok/kits/saaskit/.claude-plugin/plugin.json" <<'EOF'
{ "name": "saaskit", "version": "2.2.0" }
EOF
expect_pass "valid tree" "$workdir/ok"

echo
echo "$PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
