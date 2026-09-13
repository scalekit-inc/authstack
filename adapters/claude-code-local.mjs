import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { createAgentAdapter } from "@netlify/axis";

const execFile = promisify(childProcess.execFile);

async function writeKeychainCreds(destPath) {
  try {
    const { stdout } = await execFile(
      "security",
      ["find-generic-password", "-s", "Claude Code-credentials", "-w"],
      { timeout: 10_000 },
    );
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, stdout.replace(/\n$/, ""), { mode: 0o600 });
  } catch {
    // Local session still works if ~/.claude/.credentials.json exists.
  }
}

// AXIS's built-in claude-code adapter writes ~/.claude.json into
// $CLAUDE_CONFIG_DIR/.claude.json. Claude reads $HOME/.claude.json.
// This adapter writes the oauth anchor to $HOME/.claude.json so a
// local `claude login` works in the isolated job HOME.

function copyOauthAnchor(destPath) {
  const src = path.join(os.homedir(), ".claude.json");
  if (!fs.existsSync(src)) return;
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(src, "utf8"));
  } catch {
    return;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return;
  const slim = { oauthAccount: parsed.oauthAccount };
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, JSON.stringify(slim, null, 2) + "\n");
}

export default createAgentAdapter({
  name: "claude-code-local",
  cliCommand: "claude",
  promptVia: "stdin",
  requiredEnv: () => ["ANTHROPIC_API_KEY"],
  hasLocalSession: () => fs.existsSync(path.join(os.homedir(), ".claude.json")),
  isolationEnv: ({ home }) => ({
    HOME: home,
    USER: process.env.USER || os.userInfo().username,
    LOGNAME: process.env.LOGNAME || process.env.USER || os.userInfo().username,
    CLAUDE_CONFIG_DIR: path.join(home, ".claude"),
    CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
    DISABLE_AUTOUPDATER: "1",
    DISABLE_TELEMETRY: "1",
  }),
  prepare: async (ctx) => {
    const home = ctx.homeDirectory;
    const configDir = ctx.env?.CLAUDE_CONFIG_DIR || (home ? path.join(home, ".claude") : undefined);
    if (!ctx.env?.ANTHROPIC_API_KEY && home) {
      copyOauthAnchor(path.join(home, ".claude.json"));
      if (configDir) {
        fs.mkdirSync(configDir, { recursive: true });
        copyOauthAnchor(path.join(configDir, ".claude.json"));
        const credsDest = path.join(configDir, ".credentials.json");
        await writeKeychainCreds(credsDest);
        if (!fs.existsSync(credsDest)) {
          const homeCreds = path.join(os.homedir(), ".claude", ".credentials.json");
          if (fs.existsSync(homeCreds)) fs.copyFileSync(homeCreds, credsDest);
        }
      }
    }
  },
  buildArgs: (input) => {
    const args = ["-p", "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions"];
    if (input.config.model) args.push("--model", input.config.model);
    args.push("--strict-mcp-config");
    return args;
  },
  initialState: () => ({ resultMessage: null }),
  streamConfig: {
    mode: "lines",
    onLine: (line, ctx) => {
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if (msg.type === "result") {
        ctx.state.resultMessage = msg;
        return;
      }
      if ((msg.type === "assistant" || msg.type === "user") && Array.isArray(msg.message?.content)) {
        for (const block of msg.message.content) {
          if (block && typeof block === "object" && block.type === "text" && typeof block.text === "string") {
            ctx.feedAssistantText(block.text);
          }
        }
      }
      if (msg.type !== "stream_event" && msg.type !== "tool_progress") {
        ctx.transcript.push({
          type: msg.type === "assistant" ? "assistant" : msg.type === "user" ? "tool_result" : "system",
          timestamp: new Date().toISOString(),
          content: msg,
        });
      }
    },
  },
  getResult: (ctx) => {
    const r = ctx.state.resultMessage;
    const usage = r?.usage;
    return {
      result: r?.result ?? null,
      metadata: {
        durationMs: r?.duration_ms ?? ctx.endTime.getTime() - ctx.startTime.getTime(),
        totalCostUsd: r?.total_cost_usd,
        sessionId: r?.session_id,
        tokenUsage: usage
          ? {
              input: usage.input_tokens ?? 0,
              output: usage.output_tokens ?? 0,
              cacheReadInput: usage.cache_read_input_tokens,
            }
          : undefined,
      },
    };
  },
});
