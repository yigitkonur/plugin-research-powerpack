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

## Choosing entities

- Define an entity by the decider's verb: the things they would actually choose between.
- Test each candidate head to head against the others. Drop what does not compete.
- Tier them. Core entities get a full note. Peripheral ones get a line in `summary.md`.
- Let recon propose the list and the user confirm it in the scope question.

## Choosing axes

- An axis is something that would change the decision: cost, capability, limits, integration, security, longevity.
- Each axis needs a unit or a scale. "Good support" is not one.
- Use three to six axes. More makes the summary unreadable.

## Entity note

```markdown
# <Entity>

## Snapshot
<What it is, current version or plan, date read.>

## <Axis 1>
<Findings with [E-xxxxxx], or a gap: what was searched, which sources were checked, what would settle it.>

## <Axis 2>
...

## Practitioner signal
<Attributed: handle, date, permalink, number of comments read.>

## Gaps
<Every axis without evidence, listed once.>
```

Every axis section carries quotes or a specific gap. A silent omission is the failure to avoid.

## Comparison file

```markdown
# <Axis>

## Matrix
| Entity | <Measure> | Evidence |
|---|---|---|
| A | <value with unit> | [E-xxxxxx] |
| B | no public data | |

## Reading the matrix
<Differences that matter, disagreements between sources with both IDs.>

## Conditional ranking
<"A when X. B when Y." Name the variable that flips it.>
```

No empty cells. Write "no public data" or "unverified".

## Summary

Write it yourself after reading the comparison files. Include: the recommendation and the condition that changes it, the ranking per scenario, the three findings that matter most, the gaps that could change the answer, and an index of the files.
