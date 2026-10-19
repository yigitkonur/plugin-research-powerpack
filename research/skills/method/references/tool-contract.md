# Research Powerpack tool contract

Verified against server `mcp-researchpowerpack` v9.0.0. Run `rpp doctor` to recheck after a server change.

## Shared behaviour

- The server is stateless. Every call runs without history, sessions or checkpoints. The client owns accumulated evidence and retry decisions. This plugin's ledger does that job.
- All three tools are read-only and idempotent. Unknown input properties are rejected, so put filters in query text.
- The optional `timeout` input is a hint in seconds.
- `research://method` is the server's own short contract. `rpp method` prints it.

## `plan-research`

- Input: `objective`, up to 64,000 characters.
- Output (schema 2): clusters with a question, priority, evidence requirements, preferred source types, positive and negative signals and query ideas. It also returns a suggested first wave, a reserve bank of queries, gaps, stop conditions and budgets.
- It is a weak example by its own admission. State known facts, constraints, what to skip and what a complete answer must establish, then adopt only what improves your plan.

## `web-search`

- Input: `queries`, 1 to 50 complete queries, 500 characters each.
- Output: ranked, de-duplicated leads with a score, the queries that matched, a source kind (`web` or `reddit`) and a snippet. `evidence_status` is always `leads-only`.
- Scores rank agreement between queries, not truth.
- A query the server could not run exactly is reported as relaxed or failed. Do not treat a relaxed query as an exact one, and do not treat zero results as proof of absence.
- The compact rendering shows the top 12 leads. The ledger keeps all of them in `sources.jsonl`.

## `extract-evidence`

- Input: `urls` (1 to 20) and `evidence_requirements` (1 to 20, 1,000 characters each).
- Handles web pages, supported documents and Reddit post permalinks. Reddit comments carry their own permalinks.
- Each extraction has a 60-second ceiling. Finished sources are frozen and returned. Unfinished ones go to the retry list.
- Output (schema 3), per source:
  - `retrieval_status` and `extraction_status`
  - `source.completeness`, which says whether the whole text was read
  - per requirement: `status` (`answered`, `partial`, `not-found`, `conflicting`) and findings with verbatim quotes and locators (`start_line`, `end_line`, `heading`)
  - `follow_up_signals`, which suggest URLs or terms worth a second look
- Output at call level: `coverage` per requirement with an independent-source count, `contradictions`, `retry` and `output_truncated`.
- `partial` is common even when a quote answers the requirement. The server only certifies the quotation.
- The server's text: "call again for the URLs in `retry.sources` … at most two total tool invocations per URL, including the first." That is a retry rule. The guard hook applies it across agents to repeats of the same requirements on one URL, and adds a ceiling of four reads per URL per run. A different question of a page that was read fine is not a retry.

## Source classes worth distinguishing

- Primary: specification, official documentation, changelog, source code, advisory.
- Secondary: vendor blog, tutorial, analyst write-up.
- Experience: issue tracker, forum, Reddit, Hacker News.
- Mark which class every cited quote comes from.
