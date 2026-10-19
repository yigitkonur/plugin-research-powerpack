# Recordings

Real outputs captured while the plugin's ledger rows passed live (2026-10-19/20). They are fixtures for replay checks, not tests yet.

| File | What it is | Source |
|---|---|---|
| `search.server-text.txt` | The server's own markdown for a 2-query `web-search` | `rpp search --raw` |
| `search.compact.txt` | The plugin's compact rendering of the same call | `rpp search` |
| `extract.compact.txt` | Compact rendering of an `extract-evidence` call (2 URLs, 2 requirements) | `rpp extract` |
| `extract.call.json` | The raw structured output of that call, as stored in the ledger | `evidence/calls/` |
| `posttooluse-mcp.stdin.json` | Real PostToolUse hook input for an MCP call (ids scrubbed) | live headless session |
| `guard-21-urls.stdin.json` | PreToolUse input the guard must deny | hand-built from the real shape |
| `run-brief/` | A finished brief run: draft with IDs, rendered report, audit, charter, state, ledger quotes | live interactive `deep` run |

Replay ideas, run from this folder: `rpp render run-brief/draft.md --out X --run run-brief` should reproduce `run-brief/report.md`; `rpp verify run-brief/draft.md --run run-brief` should pass; the compact renderer applied to `extract.call.json` should reproduce `extract.compact.txt`.
