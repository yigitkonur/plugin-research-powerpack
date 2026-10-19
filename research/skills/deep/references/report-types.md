# Report types

Pick the type from the charter. Each is a skeleton, not a form to fill. Cut a section when it has nothing to say. Every section uses `[E-xxxxxx]` citations.

## Decision memo

1. Recommendation, in two or three sentences, and the condition that would change it.
2. Options considered, one line each.
3. Comparison on the axes that matter, as a table with a citation per cell.
4. Conditional ranking: "A when X, B when Y".
5. Risks and unknowns.
6. Evidence gaps.

## Technical deep dive (paper form)

1. Abstract: question, method, finding, limit, in under 150 words.
2. Background: what the reader needs, and nothing more.
3. Method: how the sources were chosen and read, and the freshness window.
4. Findings: one subsection per lens.
5. Discussion: what the findings mean together, and where they disagree.
6. Limitations: what was not found or not checked.
7. References: added by `rpp render`.

## Migration or upgrade guide

1. Summary: from version, to version, effort, the three changes that matter.
2. Breaking changes that affect this project, in the order a developer meets them.
3. Deprecations and removals.
4. Step-by-step path, with the official codemod or guide when one exists.
5. What to test.
6. Open issues and workarounds reported by users, attributed.

## Literature review

1. Scope and search method.
2. Themes, one subsection each. Group by finding, not by paper.
3. Agreement and disagreement, with both sides quoted.
4. Methodological weaknesses.
5. Open questions.

## Debugging or incident dossier

1. Symptom and environment, with versions.
2. Cause, with the quote that establishes it.
3. Fix per version.
4. Workarounds, ranked by risk.
5. What was ruled out, and how.

## Brief (one or two pages)

1. Answer, in three sentences.
2. Three to five findings, each with its citation.
3. Caveats and gaps.

## Rules for every type

- The summary and the recommendation are yours. Do not delegate them.
- A table cell without a citation must say "unverified" or "no public data".
- Numbers carry units, versions carry dates.
- Do not pad. A short report with solid evidence beats a long one.
