# research

Evidence-grounded web research for Claude Code. It bundles the Research Powerpack MCP server and adds skills, agents and hooks that make every claim traceable to a verbatim quote.

## What you get

| Command | Use it for |
|---|---|
| `/research:ask <question or URLs> [--save] [--background]` | One question, one cited answer. Debug an error, check a version, read given URLs, check a spec clause. |
| `/research:deep <topic or run path> [--report\|--brief\|--corpus] [--depth fast\|standard\|exhaustive] [--no-ask]` | A report, paper, decision memo, migration guide or a comparison corpus written to disk. Resumes unfinished runs. |
| `/research:verify <file, URL or text>` | Fact-check a README, docs page, draft or AI-written text. Each claim gets a verdict and a quote. |
| `/research:doctor` | Check the server, the tool contract, the settings and duplicate configuration. |

Agents: `scout` researches one bounded lens or entity, `analyst` synthesizes gathered notes without web access, `auditor` checks claims against their quotes. The `method` skill holds the evidence rules and loads automatically when Claude researches on the web.

`deep` asks one scoping question with a preview card, so you decide in one click. For a comparison where you did not name the options, a discovery scout finds them first and you confirm the list once. It asks again only when a trigger fires, such as the entity count growing by half or a contradiction that flips the recommendation.

## Install

Requires Claude Code 2.1.271 or later, Node 20 or later, and network access.

Try it for one session:

```bash
claude --plugin-dir /path/to/plugin-devs/research
```

Install it through the local marketplace:

```bash
claude plugin marketplace add /path/to/plugin-devs
claude plugin install research@plugin-devs
```

If you already configured the same server yourself (for example `claude mcp add ... mcp-researchpowerpack`), Claude Code skips the plugin's copy because the address matches. Run `/research:doctor`. To let the plugin's server take over, run `claude mcp remove mcp-researchpowerpack -s user`. The hooks cover both tool names, so nothing breaks in the meantime.

## How it works

- **Evidence rules.** Search results are leads. Only a quote returned by `extract-evidence` is evidence. Pending sources are never reported as absent.
- **Ledger.** A hook gives every verified quote a stable ID such as `E-a1b2c3`, stored in the run's `evidence/quotes.jsonl`. Quick questions use `~/.cache/claude-research/ledger/<project>/`. The model sees a compact rendering of tool output that keeps every quote and about 60% fewer characters. Set `compact_tool_output` to false to turn the rewrite off.
- **Limits.** The server allows one retry per URL and does not remember history. A PreToolUse hook enforces that across all agents: a third read of a URL with the same requirements is refused, and so is a fifth read of any URL. Asking a different question of a page you already read is fine. Batch size limits apply too.
- **Citations.** After a Write or Edit under the output directory, a hook flags unknown IDs, uncited numbers, versions, dates and prices, and numbers that the cited quotes do not state. It also flags quotes that are mostly links (`⚠thin`), which prove a link exists and nothing more. The check covers numbers in digits or words with a dot, a unit, a percent sign, a currency or a year. A bare major version such as "Node 22" is not checked.
- **Runs.** Each `deep` run lives in `research/<slug>/` with `charter.md`, `state.json`, `notes/`, `evidence/`, the deliverable, `audit.md` and `README.md`. A SessionStart hook reminds a new session about an unfinished run and restores a digest after compaction.
- **Audit gate.** A Stop hook blocks once if a run is in its audit phase without a passing `audit.md`. `rpp runs phase <run> finalizing` refuses while citations fail to verify or the run's structure is broken: placeholders, broken links, blank table cells, vague gaps, or a charter entity or axis without its file.
- **Scout statistics.** Every call records which agent made it. `rpp runs show` lists each scout's searches, extractions, pages read, quotes and the share of results that found nothing, so a thin scout is visible before you read its note.

## The `rpp` command

The plugin's `bin/` is on the PATH inside Claude Code's shell. You can also run it directly: `node research/bin/rpp <command>`.

```
rpp doctor                     check server, tool contract, duplicate config
rpp search "<query>" ...       web-search with the guard and the ledger
rpp extract --url U --req "R"  extract-evidence with the guard and the ledger
rpp plan "<objective>"         plan-research
rpp ledger find|get|stats|index
rpp runs list|init|phase|show  show prints totals and one line per agent
rpp verify <file>              every [E-id] resolves; numeric claims are cited and stated by their quote
rpp verify <run-dir>           every document of a run, plus its structure
rpp render <file> --out F      [E-id] becomes [n], with references and verbatim quotes
rpp render <file> --in-place   keep IDs, add an evidence appendix
```

## Settings

Set them with `/plugin configure research`. Outside Claude Code, use environment variables named `CLAUDE_PLUGIN_OPTION_<KEY>`.

| Key | Default | Meaning |
|---|---|---|
| `output_dir` | `research` | Where runs and saved notes are written, relative to the project. |
| `default_depth` | `standard` | Depth used when a request does not say. |
| `compact_tool_output` | `true` | Replace raw tool output with the compact rendering. |

`RESEARCH_MCP_URL` points the plugin and `rpp` at another server.

## Privacy

Queries and URLs are sent to `https://research-mcp.yigitkonur.com/mcp`, a third-party service that needs no key today. Do not research anything you would not send to that service. The ledger and run folders stay on your machine.

## Known limits

- Two sessions in the same project share one active-run pointer.
- The server's quote check certifies the quotation, not your reading of it. The `auditor` exists for that reason.
- Scout budgets (searches, extractions) are instructions, not limits: a scout can overspend, and `rpp runs show` is where you see it.
- A scout can start without one of the three tools while the MCP server is still connecting. It reports that in its note.
- Headless runs (`claude -p`) cannot answer the scoping question. Use `--no-ask` to take the recommended scope.
