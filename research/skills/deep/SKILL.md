---
name: deep
description: Run deep, multi-source web research that ends in files on disk: a researched report, decision memo, literature review, migration guide built from web sources, or a corpus comparing five or more options. Use only when the user explicitly asks for deep research, a researched report, a landscape or market scan, or to resume a run, or accepts the ask skill's offer. Not for writing up local code or tests. It scopes the work with the user, dispatches scouts, and audits every claim against verbatim quotes. For a single question use the ask skill instead.
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
4. Draft the scope: deliverable type, three to five lenses or the entity list, freshness window, exclusions and depth. For a corpus whose options the user did not name, list the recon candidates on the card as a seed and say a discovery scout will settle the list.

## 2. Scope with the user

Always ask, with one AskUserQuestion call, before you create the run. Read [references/intake.md](references/intake.md) first and follow its shapes exactly. The question is a single-select with three options, and every option carries the scope card in its `preview` field: Question, Decider, Delivers, Lenses, Fresh and Out of scope, Budget. Keep the question text itself to one line. A scope question without previews is wrong; ask it again. The first question is a scope card that the user accepts with one click. Do not skip the card because the request already names a type or a depth. The card also confirms the lenses, the freshness window and the budget, which the user has not seen yet. Only the optional Deliverable and Depth questions are skipped when the request settles them. The Entities question is never part of this call; it comes after wave 0 (step 4).

The only reasons to skip the card are the `--no-ask` flag and a session in which you cannot ask, because AskUserQuestion is refused or unavailable. In either case take the recommended scope and record it as an assumption in the charter. Step 4 still applies: the depth table there sets the budgets, and a corpus whose options the user did not name still runs wave 0. Take the discovery scout's Core list, record it under Assumptions, and skip the checkpoint.

## 3. Charter

Run `rpp runs init <slug> --topic "<topic>" --type <report|brief|corpus> --depth <depth>`. Use a short kebab-case slug. Write `charter.md` as [references/charter.md](references/charter.md) describes. Then run `rpp runs phase <slug> research --next "<the next step>"`. For a corpus whose options the user did not name, the next step is "wave 0: dispatch the discovery scout"; otherwise it is "dispatch wave 1".

## 4. Research wave

### 4a. Wave 0: discovery (a corpus whose options the user did not name)

The user named the options only when the request lists every one of them ("A, B and C"). "Alternatives to X", "the main tools", a category or a partial list is not a list. In that case run wave 0 before any entity scout, even when recon already suggests candidates: recon is a few queries and cannot check status or find the long tail.

1. Dispatch one discovery scout (brief in [references/briefs.md](references/briefs.md), method in [references/corpus.md](references/corpus.md)) and pass the recon candidates as its seed. Its budget is 3 searches and 4 extractions at every depth.
2. Read `notes/discovery.md`.
3. Ask the Entities question from the intake reference, every time, with the table of candidates (status and tier) in the previews. Never ask it before `notes/discovery.md` exists.
4. Until the user answers, the charter holds one plain line, `Seed (unconfirmed): A, B, C`. Then replace it with the confirmed entities as numbered items under "Lenses or entities". `rpp runs phase` refuses `synthesis` while the seed line remains.

Wave 0 is not counted in `--waves`.

### 4b. Waves 1 onward

Dispatch the scouts in one message so they run in parallel. Use the Agent tool with `subagent_type: "research:scout"`. Send one scout per lens for a report or brief, and one per entity for a corpus. The depth sets the budgets, whether or not you asked the user. A search is one `web-search` call and an extraction is one `extract-evidence` call:

| Depth | Scouts per wave (corpus) | Searches per scout | Extractions per scout | Extra gap-filling waves |
|---|---|---|---|---|
| fast | 2 (3) | 2 | 3 | 0 |
| standard | 4 (5) | 3 | 4 | 1 |
| exhaustive | 6 (7) | 5 | 6 | 2 |

Lenses or entities beyond the wave size run as sub-waves of the wave size. Put the budgets in each brief. They are instructions, not limits; `rpp runs show` is where you see an overrun.

Write each brief from [references/briefs.md](references/briefs.md), with the exact output path in it. Each scout writes exactly one file: `notes/<lens>.md`, or `entities/<slug>.md` for a corpus (the slug rule is in [references/charter.md](references/charter.md)). Scouts cannot ask the user. They return open decisions, and you bring those to the next gate.

## 5. Gate

Run `rpp runs show` first and read each scout's entry against its brief. If a scout looks thin, or a wave went wrong, follow [references/recovery.md](references/recovery.md) before anything else.

Then read the notes. Do not read the raw evidence. Re-read `charter.md`, because the user may have edited its steering log. Check four things:

- Every requirement has quotes or an explicit gap.
- Contradictions between scouts are visible and not averaged.
- Surprises that change the scope.
- Open decisions the scouts returned.

Decide whether to run another wave to fill a gap or settle a contradiction. The depth table above caps the extra waves.

Besides the scope question and the Entities question after discovery, ask the user at most once more per run, and only when a trigger fires: the entity count is more than one and a half times the confirmed list, a contradiction would flip the recommendation, or the projected cost is more than one and a half times the budget. See the checkpoint in the intake reference.

Append your decision to the steering log in `charter.md`. Run `rpp runs phase <slug> research --waves <n> --next "<next step>"`.

## 6. Synthesis

Run `rpp runs phase <slug> synthesis --next "<next step>"`.

- **Report or brief.** Outline from [references/report-types.md](references/report-types.md). Write the draft yourself when the planned report is under about 1,500 words or has fewer than four sections. Otherwise dispatch `research:analyst` agents in parallel, each writing one part to `notes/part-<name>.md` from the notes and the ledger, and assemble `draft.md` yourself. Write the summary, the recommendation and the limitations yourself in both cases.
- **Corpus.** Dispatch one analyst per axis, each writing `compare/<axis>.md`. Use [references/corpus.md](references/corpus.md). Write `summary.md` yourself.

## 7. Audit

Run `rpp runs phase <slug> audit`. Then do every step of [references/audit.md](references/audit.md), in its order: the mechanical check (`rpp verify <run-dir>`), the semantic check by one auditor, the coverage and honesty checks, and the fresh-context read. Fix every failure.

Write `audit.md` with a `Verdict: pass` or `Verdict: fail` line. On pass, run `rpp runs phase <slug> finalizing`; the command repeats the mechanical checks and refuses until they pass. On `Verdict: fail`, do not move on. Tell the user what could not be fixed, using the remaining risks in `audit.md`. Never use `--force`.

## 8. Deliver

- Run `rpp runs show` and keep its `totals` for the final message.
- **Report or brief.** Run `rpp render <run-dir>/draft.md --out <run-dir>/report.md`. That numbers the citations and appends the references with verbatim quotes. Use paths and no `cd`, so the command stays inside what is pre-approved.
- **Corpus.** Run `rpp render <file> --in-place` on `summary.md` and on every file under `compare/` and `entities/`.
- Write `README.md`: what is in the folder, how to read it, the open gaps.
- Run `rpp runs phase <slug> done`.
- Finish with a short message: the answer in two sentences, the path to the deliverable, the three findings that matter most, the open gaps, and what you would check next. Add one line of real spend copied from `totals` (searches, extractions, quotes, minutes), never an estimate.

## Rules

- Cite every number, version, date and price with `[E-xxxxxx]`. Mark anything you could not verify as unverified.
- A gap is a paragraph that names what was searched and what would settle it. Never create a stub or placeholder file.
- Rankings are conditional. Name the variable that flips them.
- Only you ask the user questions. Scouts, analysts and auditors cannot.
- If a hook refuses a tool call, follow its reason.
