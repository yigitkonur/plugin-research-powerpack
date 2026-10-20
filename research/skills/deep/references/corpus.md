# Corpus mode

Use a corpus when the user wants five or more options compared and a folder they can navigate and re-read. The run folder holds entity notes, comparison files and a summary.

```
research/<slug>/
  README.md  charter.md  state.json  audit.md  summary.md
  entities/<entity>.md        one per core entity
  compare/<axis>.md           one per comparison axis
  notes/                      scout and analyst working files
  evidence/                   the ledger
```

## Finding the entities

When the user names the options, use their list. When they ask for the landscape, send one discovery scout first (the brief is in [briefs.md](briefs.md)) and ask the user to confirm the list before the entity scouts start.

- Ask four to six orthogonal questions, not synonyms: leaders, challengers, open source, the newest entrants, niche or regional players, and adjacent approaches.
- Check each candidate's status from a dated source: active, dead, waitlist or acquired.
- Merge duplicates: a renamed product, an acquired one, or a feature of a parent product. Keep the current name and note the old one.
- A gated or waitlist product with no public docs cannot be researched. List it as discovered only.

## Choosing entities

- Define an entity by the decider's verb: the things they would actually choose between.
- Test each candidate head to head against the others. Drop what does not compete.
- Tier them. Core entities get a full note. Peripheral ones get a line in `summary.md`. A peripheral entity that turns out to change the ranking is promoted to core and gets a note.
- The scope card shows only a seed from recon. The user confirms the real list in the Entities question after wave 0.

## Choosing axes

- An axis is something that would change the decision: cost, capability, limits, integration, security, longevity.
- Each axis needs a unit or a scale. "Good support" is not one.
- Use three to six axes. More makes the summary unreadable.

## Entity note

```markdown
# <Entity>

## Snapshot
<What it is, current version or plan. Do not write the read date; the evidence appendix carries it.>

## <Axis 1>
<Findings with [E-xxxxxx], or a gap: what was searched, which sources were checked, what would settle it.>

## <Axis 2>
...

## Practitioner signal
<Attributed: handle, date, permalink, number of comments read. Label each item direct or adjacent.>

## Best fit when / Avoid when
<Conditions, each with its citation or marked as inference.>

## Gaps
<Every axis without evidence, listed once.>
```

Every axis section carries quotes or a specific gap. A silent omission is the failure to avoid.

## Comparison file

```markdown
# <Axis>

## Digest
<Two or three sentences: who leads, the trade-off, and what flips it. The summary writer reads this first.>

## Matrix
| Entity | <Measure> | Evidence |
|---|---|---|
| A | <value with unit> | [E-xxxxxx] |
| B | no public data | no public data |

## Reading the matrix
<Differences that matter, disagreements between sources with both IDs.>

## Conditional ranking
<"A when X. B when Y." Name the variable that flips it.>
```

No empty cells. Write "no public data" or "unverified".

## Summary

Write it yourself after reading the digest of each comparison file, then the files you need to settle a doubt. Include: the recommendation and the condition that changes it, the ranking per scenario, the three findings that matter most, next actions in priority order, the coverage (what was researched and what was left out on purpose), the gaps that could change the answer, and an index of the files.
