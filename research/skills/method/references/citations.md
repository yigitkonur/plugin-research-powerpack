# Citations and the ledger

## IDs

Every verified quote gets an ID, `E-` plus six hex characters, derived from the URL and the quote text. The same quote always gets the same ID, in any agent and any call. Duplicates collapse.

The ledger lives in the active run's `evidence/` folder. Without a run it lives in `~/.cache/claude-research/ledger/<project hash>/`.

## Inline answer shape

1. The answer in one to three sentences, with citations.
2. Evidence: one bullet per key claim, `claim [E-id]`, then a few words of the quote when it helps.
3. What you could not establish, and what would settle it.

```
Streamable HTTP replaced the HTTP+SSE transport in spec revision 2025-03-26 [E-1a5bc4].
Servers must validate the Origin header to prevent DNS rebinding [E-aabfbf].

Not established: whether the 2026-07-28 revision keeps session IDs.
```

## Ledger commands

Use the `rpp` command from the Bash tool.

```bash
rpp ledger find "Origin header"   # search quotes by text, URL or requirement
rpp ledger get E-aabfbf           # full quote, URL, locator, requirement, date
rpp ledger stats                  # counts and URLs at the read ceiling
rpp ledger index                  # every quote, one line each
```

Add `--run <dir>` to read a specific run. Agents without a shell (scouts, analysts, auditors) search `quotes.jsonl` in the run's `evidence/` folder with Grep instead.

## Documents

- Write citations as `[E-xxxxxx]` in the text. Do not paste long quotes into prose.
- Run `rpp verify <file>` before delivering. It fails on unknown IDs, on sentences with numbers, versions, dates or prices that carry no citation, and on numbers that the cited quotes do not state (unless the sentence says inferred or computed). It warns about `⚠thin` quotes. `rpp verify <run-dir>` checks every document of a run and its structure. A bare major version such as "Node 22" is not checked, so cite it anyway.
- Run `rpp render <file>` to turn IDs into numbered references with an appendix of verbatim quotes, URLs, locators and retrieval dates.

## Attribution

- Reddit, forums, Hacker News: handle, date, permalink, and the number of comments read.
- Vendor claims: say the vendor made them, and look for an independent source.
- Disagreement: show both quotes, their sources and their scope.
- Inference: say "inferred from" and cite the quotes it rests on.
