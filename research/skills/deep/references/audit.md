# Audit

The audit decides whether the deliverable can be trusted. Run it after synthesis and before delivery. A hook blocks the final answer while the run is in the audit or finalizing phase without a passing `audit.md`.

## Steps

1. **Mechanical check.** Run `rpp verify <file>` on the draft, or on `summary.md` and every file under `compare/` and `entities/`.
   - Every ID must exist in the ledger.
   - Every sentence with a number, version, date or price must carry a citation, or be marked unverified.
   - Fix each failure by finding the real quote, rewording the claim, or marking it unverified.
2. **Semantic check.** Dispatch one `research:auditor` on the ten most decision-relevant claims. A quote can exist and still not support the claim. Read its table. Fix every claim it marks overstated, unsupported or contradicted.
3. **Coverage check.** Compare the deliverable against the charter. Every requirement should have quotes or an explicit gap. Every lens or entity should appear.
4. **Honesty check.** Gaps are visible. Contradictions show both sides. Rankings name their conditions. Sentiment is attributed with a sample size.

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
