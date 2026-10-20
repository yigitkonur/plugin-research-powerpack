# Audit

The audit decides whether the deliverable can be trusted. Run it after synthesis and before delivery. A hook blocks the final answer while the run is in the audit or finalizing phase without a passing `audit.md`.

## Steps

1. **Mechanical check.** Run `rpp verify <run-dir>`. It checks the draft, the summary and every file under `compare/` and `entities/`, and the structure of the run. It also warns about `⚠thin` quotes the documents cite; keep those IDs for the auditor.
   - Every ID must exist in the ledger.
   - Every sentence with a number, version, date or price must carry a citation, or be marked unverified.
   - A cited number must appear in a cited quote. If you worked it out, say "computed" or "inferred".
   - No placeholders, broken links, blank table cells or vague gaps, and the charter's entities and axes all have their files.
   - Fix each failure by finding the real quote, rewording the claim, or marking it unverified.
2. **Semantic check.** Dispatch one `research:auditor`. Its list starts with every claim that rests on a `⚠thin` quote, then fills to ten with the most decision-relevant claims. If more than ten claims rest on page-chrome quotes, re-read those sources instead of auditing them. A quote can exist and still not support the claim. Read its table. Fix every claim it marks overstated, unsupported or contradicted.
3. **Coverage check.** Compare the deliverable against the charter. Every requirement should have quotes or an explicit gap. Every lens or entity should appear.
4. **Honesty check.** Gaps are visible. Contradictions show both sides. Rankings name their conditions. Sentiment is attributed with a sample size.
5. **Fresh-context read.** Read the summary as a stranger would, with no memory of the run. Can the reader act on it? Is each number traceable? Is anything inferred written in the voice of a fact?

## audit.md

```markdown
# Audit

Verdict: pass

## Mechanical
<rpp verify output summary: citations, unknown IDs, uncited claims.>

## Semantic
<Claims checked, verdicts, fixes made.>

## Coverage
<Requirements answered, gaps accepted.>

## Remaining risks
<What a reader should still treat with care.>
```

The command `rpp runs phase <run> finalizing` repeats the mechanical check itself. It refuses to move the run on while `audit.md` lacks a passing verdict or any draft, summary, comparison or entity file has unknown IDs or uncited numeric claims. It does the same before `done`, and also needs the deliverable and `README.md` to exist. Do not use `--force`; fix what it lists.

The `Verdict:` line is read by the hook. Use `pass` only when every failure above is fixed. If something cannot be fixed, write `Verdict: fail`, list it under Remaining risks, and tell the user plainly in the final message.
