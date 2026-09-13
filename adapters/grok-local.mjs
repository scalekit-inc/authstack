import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createAgentAdapter } from "@netlify/axis";
import { writeClaudeSkills } from "@netlify/axis/dist/adapters/utils/skills.js";

// AXIS has no built-in Grok adapter. This one runs the local `grok` CLI
// with an isolated GROK_HOME so the job sees only copied auth + the
// scenario skill, not the operator's 200+ user skills.

function copyAuth(destHome) {
  const src = path.join(os.homedir(), ".grok", "auth.json");
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(destHome, { recursive: true });
  fs.copyFileSync(src, path.join(destHome, "auth.json"));
  fs.chmodSync(path.join(destHome, "auth.json"), 0o600);
}

export default createAgentAdapter({
  name: "grok-local",
  cliCommand: "grok",
  promptVia: "argv",
  requiredEnv: () => ["XAI_API_KEY"],
  hasLocalSession: () => fs.existsSync(path.join(os.homedir(), ".grok", "auth.json")),
  isolationEnv: ({ home }) => ({
    HOME: home,
    USER: process.env.USER || os.userInfo().username,
    LOGNAME: process.env.LOGNAME || process.env.USER || os.userInfo().username,
    GROK_HOME: path.join(home, ".grok"),
  }),
  prepare: async (ctx) => {
    const grokHome = ctx.env?.GROK_HOME || (ctx.homeDirectory ? path.join(ctx.homeDirectory, ".grok") : undefined);
    if (grokHome) {
      fs.mkdirSync(grokHome, { recursive: true });
      copyAuth(grokHome);
      if (ctx.input.resolvedSkills?.length) {
        writeClaudeSkills(grokHome, ctx.input.resolvedSkills);
      }
    }
  },
  buildArgs: (input) => {
    const args = [
      "--single",
      input.prompt,
      "--always-approve",
      "--permission-mode",
      "bypassPermissions",
      "--output-format",
      "streaming-messages-json",
      "--no-leader",
      "--verbatim",
    ];
    if (input.config.model) args.push("--model", input.config.model);
    return args;
  },
  initialState: () => ({ resultMessage: null, lastAssistantText: "" }),
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
            if (msg.type === "assistant") ctx.state.lastAssistantText = block.text;
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
      result: r?.result ?? ctx.state.lastAssistantText ?? null,
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
