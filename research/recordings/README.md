# Recordings

Real outputs captured while the plugin's ledger rows passed live (2026-10-19/20).

## Replay

```bash
node recordings/replay.mjs        # from the plugin folder; exit 0 means no drift
```

It replays three behaviours against today's code and diffs the result with what was recorded and checked by eye:

| Check | What breaks silently without it | Fixture |
|---|---|---|
| wrong number cited | A report cites a quote that does not state its number (a version, a date, a count), so a reader trusts a figure nobody read. | `fixtures/number-in-quote.json`: 16 real lines (8 caught, 8 fine) with the quotes they cite |
| link-only quote | A claim rests on a quote that is only a "Latest" button or an avatar link. | `fixtures/thin-quotes.json`: 23 real quotes (10 link-only, 13 solid) with the verdict |
| broken folder | A finished folder ships with a TBD, a dead link, a blank table cell, a vague gap or a missing comparison file. | `fixtures/corpus-2x2/` (two entities and two axes cut from a real corpus run) plus `corpus-clean.expected.txt` and `corpus-seeded.expected.txt` |

Pass a different folder to test other fixtures: `node recordings/replay.mjs <fixtures-dir>`.

## Older fixtures

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

Replay ideas, run from this folder (`extract.compact.txt` was regenerated with the current renderer on 2026-10-20): `rpp render run-brief/draft.md --out X --run run-brief` should reproduce `run-brief/report.md` (apart from the trailing `<!-- nolink -->` marks on the quoted lines, which keep the repo link check from following the source site's relative links); `rpp verify run-brief/draft.md --run run-brief` should pass; the compact renderer applied to `extract.call.json` should reproduce `extract.compact.txt`.
