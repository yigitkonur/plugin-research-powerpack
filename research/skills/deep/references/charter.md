# The charter

`charter.md` is the contract for the run. Scouts read it, you re-read it at every gate, and the user may edit it to steer. Keep it to about one page.

## Template

```markdown
# Charter: <topic>

## Question
<One or two sentences. What must be learned or decided.>

## Decider and use
<Who decides, what they will do with the answer, what would change their mind, and how hard the choice is to undo.>

## Deliverable
<Type (report, brief or corpus), the report shape from report-types.md, file name, audience, expected length.>

## Depth and budget
<Depth, scouts per wave, searches and extractions per scout, extra waves allowed.>

## Lenses or entities
1. <lens or entity>
   - Requirements: <falsifiable questions, one fact each>
   - Preferred sources: <primary sources to read first>
2. ...

Axes: <corpus only: names, comma-separated, each with its unit in the requirements; each becomes `compare/<name>.md`>

## Language
<The language of the deliverable. Keep the words the checks read in English: unverified, inferred, computed, no public data, Verdict:, Axes:.>

## Freshness
<Sources must be newer than X, or "latest revision only". Name what changed in the last year that makes older sources unsafe.>

## Where practitioners talk
<The communities and trackers worth reading, named: a subreddit, an issue tracker, a forum. "None found" is an answer.>

## Source policy
<Primary first. How to treat vendor claims, forums, Reddit. Anything to avoid.>

## Out of scope
<Exclusions.>

## Stop conditions
<When a scout stops. When the run stops.>

## Assumptions
<Defaults chosen without asking, and anything inferred from the request.>

## Steering log
<Dated lines. The user or you append here. Gate decisions go here.>
```

## Rules

- Until the user confirms the options of a corpus, write them as one plain line: `Seed (unconfirmed): A, B, C`. Numbered items mean the user confirmed them.
- For a corpus, each numbered entity is its plain name, optionally followed by a parenthesis: `3. Next.js (Vercel)`. Its note is `entities/next-js.md`: parentheses dropped, accents folded, `+` becomes `-plus`, `#` becomes `-sharp`, every other run of characters becomes one hyphen, all lowercase. Write `Axes:` as one comma-separated line: `Price (USD per month)` gives `compare/price.md`. Work out every path yourself and put the exact path in each brief. `rpp verify <run-dir>` checks that these files exist.
- A corpus needs a decision to support. If the user wants information and no choice, write a report or a brief instead.
- An axis names its unit: price per month, milliseconds per request, a stability level. An axis without a unit is a feature category; split it or drop it.
- Requirements are checkable. "Which revision introduced X?" is checkable. "Understand X" is not.
- Each lens has two to five requirements. More means the lens should split.
- State exclusions. They prevent most wasted reading.
- Do not copy recon snippets into the charter. Snippets are leads, not evidence.
- Never leave a placeholder in a finished charter.
