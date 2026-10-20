# Scoping with the user

Goal: the user decides in one or two clicks, with the facts in front of them. Recon comes first, so every option names real lenses and real entities.

## Rules

- One scope call before the run starts, with at most four questions and usually one or two. During the run add the Entities question after discovery (only for a corpus whose options the user did not name) and at most one checkpoint call.
- Never skip the scope card because flags such as `--brief` or `--depth` were given. Only `--no-ask` or a session that cannot ask skips it.
- Skip the optional questions (deliverable, depth) when the request already settles them. Do not re-ask what the user said. The Entities question is not part of this call.
- The recommended option comes first and ends with "(Recommended)".
- Put the scope card in the `preview` of every option so the user sees what each choice would do. Previews work on single-select questions.
- The user can always pick "Other" and type free text. Treat it as steering and fold it into the scope.
- Subagents never ask. They return open decisions, and you batch them into the next gate.

## Question 1: the scope card (always)

Header: `Scope`. Question: "Run this research scope?" Single select.

Options:

1. **Run this scope (Recommended)**. Description: one line naming the deliverable and depth. Preview: the card below.
2. **Narrow to the decision-critical lenses**. Description: faster and cheaper, drops the lenses least likely to change the decision. Preview: the same card with fewer lenses and a smaller budget.
3. **Broaden: add <a real lens from the recon>**. Description: adds one lens the plan found. Preview: the same card with that lens and a larger budget.

Card format:

```
Question   <the question in one line>
Decider    <who decides, and what they will do with it>
Delivers   <type> → <output dir>/<slug>/<file>   (the output dir is `rpp config output_dir`)
Lenses     1 <lens> · 2 <lens> · 3 <lens>   (corpus: the comparison axes, each becomes compare/<axis>.md)
Fresh      <freshness window>       Out of scope  <exclusions>
Budget     <scouts> scouts · ~<n> search waves · ≤<n> URLs read · ~<n> min
Seed       <corpus with unnamed options only: recon candidates, to be settled by a discovery scout>
```

## Optional questions

Ask these only when the request leaves the dimension open.

**Deliverable.** Header `Deliverable`. Options: Report, Brief (one or two pages), Corpus (a folder with one note per option and comparison files). The recommended option follows the request. Previews show the file skeletons.

**Depth.** Header `Depth`. Describe each option with its real costs from the depth table in step 4 of the skill: scouts, searches, extractions and extra waves. Typical time is about 5 minutes for fast, 10 to 15 for standard and 25 to 40 for exhaustive. Use the configured default depth (`rpp config default_depth`) as the recommended option.

## Entities after discovery (corpus whose options the user did not name)

Ask this once, every time, after the discovery scout has written `notes/discovery.md`. Never before it exists. Header `Entities`. Options: "Core <n> (Recommended)" listing names, "All <m> researchable", and one narrower set. Each option's preview shows the table of candidates with status and tier. Candidates that are dead, acquired or gated with no public docs cannot be researched and stay listed as discovered only. The user can always type their own list through "Other".

## Checkpoint (mid-run, at most once)

Ask only when a trigger fires: the entity count exceeds one and a half times the plan, a contradiction would flip the recommendation, or the projected cost exceeds one and a half times the budget. Header `Checkpoint`. State the trigger in the question. Options: "Continue as scoped (Recommended)", "Trim" with what would be cut, "Expand" with what would be added.

## When you cannot ask

In a non-interactive run, or with `--no-ask`, take the recommended scope. Write every default you chose under "Assumptions" in the charter so the user can see and change it. Wave 0 still runs for a corpus with unnamed options: take the Core list, record it under Assumptions, skip the checkpoint.
