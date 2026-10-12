# Scalekit LinkedIn posts

Direct takes for LinkedIn. Each item is a 2-post unit (A + B): post as a short carousel of thoughts, two posts a few days apart, or a mini-thread in comments.

No scene-setting. No “I was reading / I sat through a demo / pasting keys at 11pm.” Observation and opinion only. Product shows up when it’s the point, not as a story prop.

**Ready now:** Astro, Apify, LiteLLM, xMCP, Chargebee, Cursor, FastRouter  
**HOLD (need live assets first):** VAPI, LiveKit, `npx @scalekit/cli`

### Voice (LinkedIn, still you)

- Straight take, not a journal scene
- Short paragraphs, one idea
- Quiet ending. No “excited to announce,” no “thoughts?”
- Uneven rhythm is fine; marketing polish is not

---

## 1. Astro

### A — the receipt

```
Astro’s official docs list Scalekit as a backend.

Not a blog mention. Not a partner announcement. Docs.

That’s the surface builders actually trust.

@astrodotbuild
```

**Asset:** screenshot of Astro docs backend listing · tag Astro

### B — the wrong way

```
Astro is perfect until you add a login.

Then most stacks pick something 10x heavier than the rest of the site.

Light framework. Heavy auth. That mismatch is the default, not the exception.
```

---

## 2. Apify

### A — the missing piece

```
Your scraping agent runs.

Can it act as the user without you handing it the keys?

Most demos show the scrape. Not the credential problem next to it.
```

### B — teardown (4 lines)

```
Connected accounts on an Apify actor, short version:

1. User connects once (OAuth, not .env)
2. Actor gets a scoped token for that user
3. Actor calls the API as them
4. Keys never sit in the actor config

Scraping without becoming a key vault.
```

---

## 3. LiteLLM

### A — hot take

```
Everyone routes LLM calls through LiteLLM.

Almost nobody secures the tool calls behind it.

Model hop: logged, rate-limited, audited.
Gmail / Slack / CRM action: often still a god key.
```

### B — steal this pattern

```
AgentKit + LiteLLM, three steps:

1. LiteLLM for the model router
2. AgentKit for connected accounts
3. Tools only run with a user-scoped token

Writeup: [tutorial link]
```

---

## 4. VAPI

> **HOLD** until a live demo/docs link exists.

### A — vivid stakes *(copy ready; ship with URL)*

```
A voice agent that can book, cancel, and refund — without god-mode access to your systems.

If it can move money or inventory, it needs a scope. Not a root token.
```

### B — how it works *(needs live link)*

```
HOLD: scoped tokens for a VAPI voice agent. Post only with the live link.
```

---

## 5. LiveKit

> **HOLD** until a live demo/docs link exists.

### A — the part nobody talks about

```
Real-time agents get the demos.

The auth layer under them almost never does.

Streaming audio is the easy part. Showing how the agent is allowed to act is not.
```

### B — builder’s note *(needs live link)*

```
HOLD: what surprised me wiring LiveKit + Scalekit. Needs the live path first.
```

---

## 6. xMCP

### A — warning

```
MCP servers are shipping with zero auth.

That bill comes due when a tool can write email, move money, or touch prod.

Open protocol ≠ safe server.
```

### B — look how fast

```
npx the xMCP + Scalekit template.

Authed MCP server in minutes, not a week of OAuth homework.

If you’re exposing tools, start from auth. Happy-path demos can wait.
```

---

## 7. Chargebee

### A — expensive mistake

```
B2B billing breaks the day you add orgs + SSO.

Seats, entitlements, and IdP groups stop lining up. Support becomes the integration layer.

Here’s the clean sync.
```

### B — guide teaser

```
Org joins → SSO maps identity → Chargebee subscription and entitlement follow the org, not a lone user record.

Full flow + pitfalls: [blog link — KD-27 bet]
```

---

## 8. Cursor plugin

### A — meet devs where they are

```
Scalekit is in the Cursor directory.

Auth without leaving the editor.

The listing alone is a dead end. Start from scalekit.com if you want to ship.
```

### B — quick take

```
Agents inside the IDE are fine.

Auth only in a browser tab while the agent holds keys is not.

If the agent acts for a user, identity belongs in the tool — not a paste from .env.
```

---

## 9. FastRouter

### A — small tool, big unlock

```
FastRouter is niche.

Pair it with real auth and one headache goes away: which backend, which user, which token, on every hop.
```

### B — technical

```
The config that makes it click:

route by identity + scope, not just by path.

Once the router knows who and what they’re allowed to call, services stop inventing their own auth middleware.
```

---

## 10. npx @scalekit/cli

> **HOLD** until package + docs are live. Pair A with a 15-sec terminal gif.

### A — bold claim + proof

```
Auth setup should be one command.

[15-sec terminal gif]

npx @scalekit/cli
```

### B — before / after

```
Before: dashboard archaeology, copy-paste env, wrong redirect URI, three Slack threads.

After: one command. Project wired. You fix what actually matters for your app.

HOLD until package + docs are live.
```

---

## Posting checklist

| Do | Don’t |
|----|--------|
| Lead with the take or receipt | Scene / anecdote openers |
| Short paragraphs | “Excited to announce…” |
| Tag partners when true (Astro docs) | Engagement bait (“thoughts?”) |
| Link to real docs / tutorial / blog | Stop at a directory listing |
| Ship HOLD only with live URL + proof | Invent speed claims without gif/CLI |

### Placeholder links to fill

- [ ] LiteLLM B — tutorial URL
- [ ] Chargebee B — blog URL (KD-27)
- [ ] VAPI B — live demo/docs
- [ ] LiveKit B — live demo/docs
- [ ] CLI A — terminal gif + package live
