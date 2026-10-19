---
name: deep
description: Run deep, multi-source research that ends in files on disk, such as a report, paper, decision memo, migration guide, literature review or a corpus comparing five or more options. Use only when the user explicitly asks for deep research, a report or write-up, a landscape or market scan, or to resume a research run. It scopes the work with one question, dispatches scouts, and audits every claim against verbatim quotes. For a single question use the ask skill instead.
argument-hint: "<topic or run path> [--report|--brief|--corpus] [--depth fast|standard|exhaustive] [--no-ask]"
allowed-tools: mcp__plugin_research_powerpack__*, mcp__mcp-researchpowerpack__*, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion, Skill, Bash(rpp *)
---

Request: $ARGUMENTS

Unfinished runs in this project:
!`rpp runs list --brief 2>&1 || true`

You are the orchestrator. You scope the work, dispatch scouts, gate their output, write the conclusions yourself and audit the result. The filesystem is the channel between agents. Scouts write files, you read the files, and you never paste raw evidence into the conversation.

Invoke the `research:method` skill with the Skill tool now unless its text is already in this conversation.

## 0. Resume or start

If the argument is a run path, or the list above shows an unfinished run on the same topic, read that run's `state.json` and `charter.md`. Tell the user the phase in one line. Continue from that phase. List `notes/` first so that finished work is not repeated. Otherwise go to step 1.

Flags: `--report`, `--brief` and `--corpus` set the type. `--depth` sets the depth. `--no-ask` skips step 2.

## 1. Frame

Do not create files yet.

1. Restate the question and the decision it serves. Name who decides. In a code project, read the manifests and lockfiles so the research uses the real versions.
2. Run one recon wave of 4 to 8 orthogonal `web-search` queries. In the same message, call `plan-research` with a constrained objective that states known facts, constraints and what a complete answer needs.
3. Read the leads. Note the vocabulary, the entities, the authorities and any surprise. Spend about 4,000 tokens here.
4. Draft the scope: deliverable type, three to five lenses or the entity list, freshness window, exclusions and depth.

## 2. Scope with the user

Always ask, with one AskUserQuestion call, before you create the run. Read [references/intake.md](references/intake.md) first and follow its shapes exactly. The question is a single-select with three options, and every option carries the scope card in its `preview` field: Question, Decider, Delivers, Lenses, Fresh and Out of scope, Budget. Keep the question text itself to one line. A scope question without previews is wrong; ask it again. The first question is a scope card that the user accepts with one click. Do not skip the card because the request already names a type or a depth. The card also confirms the lenses, the freshness window and the budget, which the user has not seen yet. Only the optional questions about deliverable, depth and entities are skipped when the request settles them.

The only reasons to skip the card are the `--no-ask` flag and a session in which you cannot ask, because AskUserQuestion is refused or unavailable. In either case take the recommended scope and record it as an assumption in the charter. Step 4 still applies: the depth table there sets the budgets.

## 3. Charter

Run `rpp runs init <slug> --topic "<topic>" --type <report|brief|corpus> --depth <depth>`. Use a short kebab-case slug. Write `charter.md` as [references/charter.md](references/charter.md) describes. Then run `rpp runs phase <slug> research --next "dispatch wave 1"`.

## 4. Research wave

Dispatch the scouts in one message so they run in parallel. Use the Agent tool with `subagent_type: "research:scout"`. Send one scout per lens for a report or brief, and one per entity for a corpus. The depth sets the budgets, whether or not you asked the user:

| Depth | Scouts per wave (corpus) | Searches per scout | Extractions per scout | Extra gap-filling waves |
|---|---|---|---|---|
| fast | 2 (3) | 2 | 3 | 0 |
| standard | 4 (5) | 3 | 4 | 1 |
| exhaustive | 6 (7) | 5 | 6 | 2 |

For longer entity lists, run sub-waves of the wave size. Put the budgets in each brief.

Write each brief from [references/briefs.md](references/briefs.md). Each scout writes exactly one file: `notes/<lens>.md`, or `entities/<slug>.md` for a corpus. Scouts cannot ask the user. They return open decisions, and you bring those to the next gate.

## 5. Gate

Read the notes. Do not read the raw evidence. Re-read `charter.md`, because the user may have edited its steering log. Check four things:

- Every requirement has quotes or an explicit gap.
- Contradictions between scouts are visible and not averaged.
- Surprises that change the scope.
- Open decisions the scouts returned.

Decide whether to run another wave to fill a gap or settle a contradiction. The depth table above caps the extra waves.

Besides the scope question, ask the user at most once more per run, and only when a trigger fires: the entity count is more than one and a half times the plan, a contradiction would flip the recommendation, or the projected cost is more than one and a half times the budget. See the checkpoint in the intake reference.

Append your decision to the steering log in `charter.md`. Run `rpp runs phase <slug> research --waves <n> --next "<next step>"`.

## 6. Synthesis

Run `rpp runs phase <slug> synthesis --next "<next step>"`.

- **Report or brief.** Outline from [references/report-types.md](references/report-types.md). Write the draft yourself when the outline is under about 1,500 words or has fewer than four sections. Otherwise dispatch `research:analyst` agents in parallel, each writing one part to `notes/part-<name>.md` from the notes and the ledger, and assemble `draft.md` yourself. Write the summary, the recommendation and the limitations yourself in both cases.
- **Corpus.** Dispatch one analyst per axis, each writing `compare/<axis>.md`. Use [references/corpus.md](references/corpus.md). Write `summary.md` yourself.

## 7. Audit

Run `rpp runs phase <slug> audit`. Then follow [references/audit.md](references/audit.md):

1. Run `rpp verify` on the draft or on the summary and every file under `compare/` and `entities/`. Fix every failure.
2. Dispatch one `research:auditor` to check the ten most decision-relevant claims against their quotes. Read its findings and fix what it found.
3. Write `audit.md` with a `Verdict: pass` or `Verdict: fail` line.
4. On pass, run `rpp runs phase <slug> finalizing`. The command repeats the mechanical checks and refuses until they pass.
5. On `Verdict: fail`, do not move on. Tell the user what could not be fixed, using the remaining risks in `audit.md`. Never use `--force`.

## 8. Deliver

- **Report or brief.** Run `rpp render draft.md --out report.md` inside the run folder. That numbers the citations and appends the references with verbatim quotes.
- **Corpus.** Run `rpp render <file> --in-place` on `summary.md` and on every file under `compare/` and `entities/`.
- Write `README.md`: what is in the folder, how to read it, the open gaps.
- Run `rpp runs phase <slug> done`.
- Finish with a short message: the answer in two sentences, the path to the deliverable, the three findings that matter most, the open gaps, and what you would check next.

## Rules

- Cite every number, version, date and price with `[E-xxxxxx]`. Mark anything you could not verify as unverified.
- A gap is a paragraph that names what was searched and what would settle it. Never create a stub or placeholder file.
- Rankings are conditional. Name the variable that flips them.
- Only you ask the user questions. Scouts, analysts and auditors cannot.
- If a hook refuses a tool call, follow its reason.
