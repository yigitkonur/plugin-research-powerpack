---
name: verify
description: Fact-check text the user supplies, such as a file, README, docs page, PR description, blog draft, pitch or AI-written answer. Extracts the checkable claims and tests each against verbatim quotes, marking it supported, contradicted, outdated or unverified. Use when the user hands over a file, URL or pasted text to check, for example "fact-check this README" or "are the numbers in this doc current".
argument-hint: "<file, URL or pasted text>"
allowed-tools: mcp__plugin_research_powerpack__*, mcp__mcp-researchpowerpack__*, Read, Write, Agent, Skill, Bash(rpp *)
---

Request: $ARGUMENTS

Fact-check the material in the request. Invoke the `research:method` skill with the Skill tool unless its text is already in this conversation.

1. **Get the text.** For a file, read it. For pasted text, use it as given. For a URL, call `extract-evidence` on it with the requirement "Quote each factual claim about numbers, versions, dates, prices, capabilities and comparisons." The returned quotes are the claims under test. They are never evidence for themselves, so never cite their IDs as support for a verdict.

2. **Mechanical pass.** If the file already carries `[E-xxxxxx]` citations, run `rpp verify <file>`. Report unknown IDs and uncited numeric claims first, since those are certain.

3. **Extract the claims.** Pull out atomic, checkable claims, at most 15 unless the user asked for more. Rank them by how much they would matter if wrong: numbers, versions, dates, prices, capability claims and superlatives first. Skip opinions and predictions. Number them, and note the line each came from and the source the document itself names, if any.

4. **Check them.**
   - With five claims or fewer, check them here. Find primary sources with `web-search` unless the document names them. Write one requirement per claim, name the version and date, and read the primary source with `extract-evidence`.
   - With more, group them by source or topic into at most three groups and dispatch `research:auditor` agents in parallel. The auditors have both `web-search` and `extract-evidence`. Give each its claims, one requirement per claim, any URLs the document names, the output file `<output dir>/verify/<slug>-<n>.md`, where the output dir is the value printed by `rpp config output_dir`, and the rule that it writes only that file. Tell each that quotes from the document under test are claims, never evidence.
   - If a hook refuses a call, follow its reason.

5. **Report.** Show a table: number, claim, verdict, evidence ID, note. The verdicts are:
   - `supported`: a quote says it, with the same scope.
   - `contradicted`: a source says the opposite. Quote it.
   - `outdated`: it was true, and a newer source says otherwise. Give the date.
   - `unverified`: no source was found. Say what was searched.
   - `overstated`: a quote supports a weaker or narrower claim. Say what it supports.
   - `not checkable`: opinion or prediction.

   Auditors also return `unsupported`; report it as `unverified`. In `<slug>` above, use the input file name in kebab-case.

   When the input was a file, also write the table to `<file>.verify.md` next to it. Propose a corrected line for each contradicted or outdated claim, with its citation. Do not edit the original unless the user asks.

Lead with the count per verdict. Never mark a claim supported from a search snippet or from memory.
