# When a wave goes wrong

Run `rpp runs show` first. It prints JSON. `totals` covers the run, and `agents[]` has one entry per agent with `searches`, `extracts`, `urls_read`, `quotes` and `not_found_share` (a fraction from 0 to 1). Every scout shows as `research:scout`, so match an entry to a brief by its `agent_id`, which the Agent result also gives, or by order of return when only one is outstanding.

## Signs of thin work

- No quotes, or fewer quotes than requirements asked.
- A requirement with neither a quote nor a gap sentence in the note.
- A number with no citation, or a `⚠thin` quote used as its proof.
- The note answers a different question than the brief asked.
- Hint, not proof: a `not_found_share` near 1 usually means the batch mixed pages with requirements they could not answer.

Budgets are instructions. A scout that overspent is not thin for that reason; look at what it produced.

## What to do

1. **Re-brief a scout once.** Name the exact gaps: "requirement 2 has no quote and no gap; the pricing claim cites a quote that is only a link". Say which pages to read. Keep the file name so the scout overwrites its own note.
2. **If the second return is still thin, stop.** Write the gap in the steering log, say so in the summary, and move on.
3. **A scout that timed out or returned nothing.** Split its scope into two smaller briefs and run them once.
4. **Two scouts disagree.** That is data. Keep both IDs and name the variable: version, date, scale or platform. Send one scout for a resolver (a release note, a maintainer comment) only when the answer decides the recommendation.
5. **A blocked or paywalled page.** Look for a mirror, the repository copy, a release note or an archive. Otherwise write the gap.
6. **The charter was wrong.** A lens nobody can answer, an axis that is only a feature list, entities that do not compete: stop dispatching, fix the charter, log the change in the steering log, tell the user in one line, then re-brief.
7. **Scope creep.** "While you are there, also…" is a new wave, never a longer brief.
8. **A scout that began without a research tool.** Its note says so. Run it again once the server is connected; do not accept a note written from memory.

Re-briefs, splits and resolver scouts do not use the depth table's allowance of extra gap-filling waves. Each scout gets at most one re-brief.

A scout's own report of success is a claim. The stats and the notes are the evidence.
