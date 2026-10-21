---
name: ask
description: Answer one research question from web sources with verbatim, cited evidence using the Research Powerpack. Use when the answer needs the web, for example "look up whether X supports Y", "what do the docs say about", "read these URLs and tell me", what changed in a release, or an error message to diagnose. Not for what a package manager or the local code already answers, and not for fact-checking a document the user hands over (use verify). If the request turns out bigger, such as comparing three or more options, still start here: this skill offers the deep skill.
argument-hint: "<question or URLs> [--save] [--background]"
allowed-tools: mcp__plugin_research_powerpack__*, mcp__mcp-researchpowerpack__*, Read, Grep, Glob, Write, Agent, AskUserQuestion, Skill, Bash(rpp *)
---

Request: $ARGUMENTS

Answer the request with cited evidence. Follow these steps in order.

1. **Load the method.** Invoke the `research:method` skill with the Skill tool, unless its text is already in this conversation.

2. **Split the request.** `--save` and `--background` are flags. Everything else is the question or the URLs. If nothing else remains, ask the user for the question and stop.

3. **Check the size.** The question is report-sized if it compares three or more options, asks for a landscape, survey, paper or write-up, or clearly needs more than three search waves. If so, ask once with AskUserQuestion: "Quick answer here (Recommended)" or "Full report with the deep skill". If the user picks the report, invoke `research:deep` with the original request and stop. If you cannot ask, because AskUserQuestion is refused or unavailable in this session, take the quick path and say so in one line.

4. **Background mode.** With `--background`, dispatch the Agent tool with `subagent_type: "research:scout"` and `run_in_background: true`. The brief must hold the question, any project facts that matter such as dependency versions, the budget of three searches and three extractions, and the output file `<output dir>/notes/<slug>.md`, where the output dir is the value printed by `rpp config output_dir`. Then tell the user in one line that the scout started, where the note will appear, and that the result arrives as a notification. Stop. When the notification arrives, read the note, run `rpp verify <note>` and fix what it reports (cite each flagged number, version or date, or mark it unverified), then run `rpp render <note> --in-place` so it carries its appendix of quotes, and give the user the answer in the shape of step 6.

5. **Research here.** Use at most three `web-search` calls and three `extract-evidence` calls. Route the first call as the method says. In a coding project, read the manifest and lockfile first and use the versions you find. If a call is refused by a hook, follow the reason in the refusal.

6. **Answer.** Use the shape in the method's citations reference: the answer first with `[E-xxxxxx]` citations, then the evidence, then what you could not establish. Keep it short. Do not paste whole pages.

7. **Save.** With `--save`, write the answer to `<output dir>/notes/<slug>.md`, where the output dir is the value printed by `rpp config output_dir`. Make the slug kebab-case from the question, at most six words. The note holds the question, the answer with citations, what is not established, and today's date. Run `rpp verify <that file>` and fix what it reports: cite each flagged number, version or date, or mark it unverified. Then run `rpp render <that file> --in-place` so the note carries an appendix of verbatim quotes with URLs and locators. Tell the user the path.

Never claim anything the quotes do not support. If the evidence is thin, say so and say what would settle it.
