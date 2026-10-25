# research — plugin reference

the internals of the `research` plugin: how the evidence pipeline works, the `rpp` cli, settings, and the honest list of limits. the quick tour lives in the [repo readme](https://github.com/yigitkonur/plugin-research-powerpack#readme).

install: see the [install section of the repo readme](https://github.com/yigitkonur/plugin-research-powerpack#install). research is installed globally and stays on in claude code and codex.

## how it works

- **evidence rules.** search results are leads. only a quote returned by `extract-evidence` is evidence. a source the server didn't finish reading is never reported as "not found".
- **the ledger.** a hook gives every verified quote a stable id like `E-a1b2c3` (a hash of the url and the quote, so parallel agents never collide). a deep run keeps its ledger in `research/<slug>/evidence/`. quick questions use `~/.cache/claude-research/ledger/<project>/`, where claims and quotes expire after 6 hours and raw calls are pruned after 30 days.
- **compact output.** the model sees a short rendering of each tool call. every quote stays, with its id, line numbers, the page's author and date when the page has them, and a `⚠thin` mark when the quote is mostly link markup. set `compact_tool_output` to false and you get the raw output plus a list of new ids with the start of each quote.
- **limits.** the server allows one retry per url. a PreToolUse hook enforces that across every agent: a third read of a url with the same requirements is refused, and so is a fifth read of any url in a run. asking a page you already read a different question is fine. batches are capped at 20 urls, 20 requirements and 50 queries.
- **citations.** after a write or edit under the output directory, a hook flags unknown ids, uncited numbers, versions, dates and prices, numbers the cited quote doesn't state, and thin quotes. it catches digits with a dot, units, percent, currency and years, plus spelled-out multiples like "three times faster". a bare major version ("node 22") is not checked, so cite it anyway.
- **runs.** each deep run is a folder with `charter.md`, `state.json`, `notes/`, `evidence/`, the deliverable, `audit.md` and `README.md`. a SessionStart hook reminds a new session about an unfinished run and restores a digest after compaction.
- **the gate.** `rpp runs phase <run> finalizing` refuses while citations fail or the folder is broken: placeholders, dead or escaping links, blank table cells, vague gaps, a charter entity or axis without its file, or an entity list the user never confirmed. a Stop hook blocks once if a run is in its audit phase without a passing `audit.md`.
- **write fence.** scouts, analysts and auditors read untrusted pages, so they can only write `.md` files inside `notes/`, `entities/`, `compare/` or `verify/`. the ledger, state, charter and audit are off limits to them.
- **scout stats.** every call records which agent made it. `rpp runs show` lists each agent's searches, extractions, pages read, quotes and not-found share, so a thin scout shows up before you read its note.

## the `rpp` cli

the plugin's `bin/` is on the path inside claude code's shell. outside it, run `node <plugin dir>/bin/rpp <command>`. the server is stateless json-rpc, so the cli talks to it directly and writes into the same ledger, from codex, ci or a plain terminal.

```
rpp doctor                      server, tool contract, duplicate config, settings
rpp search "<query>" ...        web-search through the guard and the ledger
rpp extract --url U --req "R"   extract-evidence through the guard and the ledger
rpp plan "<objective>"          plan-research
rpp ledger find|get|stats|index look things up in the ledger
rpp runs list|init|phase|show   show prints totals and one entry per agent
rpp verify <file>               ids resolve, numbers are cited and stated by their quote
rpp verify <run>                every document of a run, plus its structure
rpp render <file> --out F       [E-id] becomes [n], references with verbatim quotes appended
rpp render <file> --in-place    keep the ids, add or refresh an evidence appendix
rpp config [key]                the settings in effect
```

## settings

set them with `/plugin configure research`. outside claude code, use env vars named `CLAUDE_PLUGIN_OPTION_<KEY>`.

| key | default | what it does |
|---|---|---|
| `output_dir` | `research` | where runs and saved notes go, relative to the project. must stay inside it. |
| `default_depth` | `standard` | depth for `/research:deep` when you don't pass `--depth`. |
| `compact_tool_output` | `true` | swap raw tool output for the compact rendering. |

`RESEARCH_MCP_URL` points the plugin and `rpp` at another deployment of the server (https only, localhost excepted).

## troubleshooting

- **tools missing in a fresh session.** the plugin's mcp server connects a moment after start. the main thread waits for it; a scout that starts too early says `Research tools unavailable` and gets re-run.
- **you already added the same server yourself** (say `claude mcp add ... mcp-researchpowerpack`). claude code then skips the plugin's copy because the url matches. `/research:doctor` names the entry; `claude mcp remove <name> -s user` lets the plugin's copy take over. the hooks cover both tool names in the meantime.
- **`rpp: command not found`.** restart claude code after enabling the plugin so `bin/` lands on the path.

## codex

the skills and the hooks run in codex too, through `.codex-plugin/plugin.json`, `.codex-mcp.json` and `hooks/codex-hooks.json`. the guard (url limits), the quote ledger and the write-time citation check all work there. what doesn't carry over:

- no slash commands and no `research:scout|analyst|auditor` agent types. the skills tell codex to spawn plain agents from the agent files, or to do the step itself.
- no compact tool output: codex rejects a hook rewriting an mcp result, so the hook adds the list of new quote ids as context and the raw result stays.
- the plugin's `bin/` isn't on codex's path. the hooks print `node <plugin>/bin/rpp ...` when they name the cli.
- the server url is fixed in `.codex-mcp.json` (no `RESEARCH_MCP_URL`), and plugin settings (`output_dir` and the others) have no codex equivalent: set `CLAUDE_PLUGIN_OPTION_OUTPUT_DIR` and friends in the environment if you need them.
- codex names the tools `mcp__research_powerpack__web_search` (underscore), and the `writeguard` fence for subagents is claude-only.

## known limits

- two sessions in the same project share one active-run pointer.
- the server's quote check certifies the quotation, not your reading of it. that's what the auditor is for.
- scout budgets are instructions, not hard limits. `rpp runs show` is where an overrun shows up.
- headless runs (`claude -p`) can't answer questions. pass `--no-ask` and the run takes the recommended scope.
- in `claude -p`, claude code stops background agents that are still running 10 minutes after the main thread's last turn. we saw this cut a `deep` run mid-wave once, when three scouts' model requests stalled. run `deep` interactively for big jobs, or set `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`. a stopped run resumes with `/research:deep <run folder>`.
- the checks read a few english words (`unverified`, `inferred`, `computed`, `no public data`, `Verdict:`, `Axes:`), so those stay english whatever language the report is in.

## replay checks

`node recordings/replay.mjs` replays three behaviours against today's code with fixtures cut from real runs: a wrong number cited, a link-only quote, and a broken research folder. details in [recordings/README.md](recordings/README.md).
