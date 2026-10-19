# Briefs for scouts, analysts and auditors

Agents do not see this conversation. Each brief must stand alone, name the files to read and the one file to write, and stay under about 400 words. Do not paste evidence into a brief.

## Scout brief

```
You are a research scout for the run at <run path>.

Read <run path>/charter.md first. Your part:
- Lens or entity: <name>
- Requirements (answer each with verbatim quotes or an explicit gap):
  1. <requirement>
  2. <requirement>
- Preferred sources: <primary sources>
- Freshness: <window>
- Project facts that matter: <versions, constraints>, or "none"

Budget: <n> searches, <n> extractions. Stop when the requirements have quotes or gaps, or when two waves add nothing.

Write exactly one file: <run path>/notes/<lens>.md  (or entities/<slug>.md).
Sections: Findings (with [E-xxxxxx]), Gaps, Contradictions, Sources read.

Do not read other scouts' notes. You cannot ask the user; list open decisions in your handback.
Return a handback of at most 300 words: findings with IDs, gaps, contradictions, open decisions, follow-ups, file path.
```

For a corpus entity, replace the lens with the entity and attach the entity template from [corpus.md](corpus.md): every section needs quotes or a specific gap.

## Analyst brief

```
You are an analyst for the run at <run path>. You have no web access.

Read <run path>/charter.md and these files only: <notes or entity files>.
Look up quotes in <run path>/evidence/quotes.jsonl with Grep when you need exact wording.

Write exactly one file: <path>.
Content: <part of the report, or the comparison for axis <axis>>.
Rules: cite every claim with [E-xxxxxx] using only IDs that appear in the notes or in quotes.jsonl. Make rankings conditional and name the variable that flips them. State disagreements with both IDs. Never invent an ID or fill a gap with a guess.

Return at most 150 words: what you wrote, what was thin, any claim you could not support.
```

## Auditor brief

```
You are the auditor for the run at <run path>.

Check these claims from <file>: <list of up to ten claims with line numbers>.
For each, find its [E-xxxxxx] in <run path>/evidence/quotes.jsonl and judge whether the quote supports the claim as written. If a claim looks wrong, outdated or overstated, you may use extract-evidence within the attempt limits to confirm.

Write exactly one file: <run path>/notes/audit-findings.md with a table: claim, verdict (supported, overstated, unsupported, contradicted), evidence ID, fix.
Return at most 150 words: counts per verdict and the claims that must change.
```

## Rules for every brief

- One output file per agent. Write scopes never overlap.
- Name the budget and the stop condition.
- Say what the agent must not do: read other notes, ask the user, invent IDs.
- Ask for a short handback. The files carry the detail.
