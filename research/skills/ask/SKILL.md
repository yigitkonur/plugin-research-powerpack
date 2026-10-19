---
name: ask
description: Answer one research question from web sources with verbatim, cited evidence using the Research Powerpack. Use for "look up whether X supports Y", "what do the docs say", "is it true that", "latest version of", "read these URLs and tell me", or an error message to diagnose from the web. Not for comparing three or more options, surveys or reports; use the deep skill for those.
argument-hint: "<question or URLs> [--save] [--background]"
allowed-tools: mcp__plugin_research_powerpack__*, mcp__mcp-researchpowerpack__*, Read, Grep, Glob, Write, Agent, AskUserQuestion, Skill, Bash(rpp *)
---

Request: $ARGUMENTS

Answer the request with cited evidence. Follow these steps in order.

1. **Load the method.** Invoke the `research:method` skill with the Skill tool, unless its text is already in this conversation.

2. **Split the request.** `--save` and `--background` are flags. Everything else is the question or the URLs. If nothing else remains, ask the user for the question and stop.

3. **Check the size.** The question is report-sized if it compares three or more options, asks for a landscape, survey, paper or write-up, or clearly needs more than three search waves. If so, ask once with AskUserQuestion: "Quick answer here (Recommended)" or "Full report with the deep skill". If the user picks the report, invoke `research:deep` with the original request and stop. If you cannot ask, because AskUserQuestion is refused or unavailable in this session, take the quick path and say so in one line.

4. **Background mode.** With `--background`, dispatch the Agent tool with `subagent_type: "research:scout"` and `run_in_background: true`. The brief must hold the question, any project facts that matter such as dependency versions, the budget of three searches and three extractions, and the output file `<output dir>/notes/<slug>.md`, where the output dir is the value printed by `rpp config output_dir`. Then tell the user in one line that the scout started, where the note will appear, and that the result arrives as a notification. Stop. When the notification arrives, read the note, run `rpp render <note> --in-place` so it carries its appendix of quotes, and give the user the answer in the shape of step 6.

5. **Research here.** Use at most three `web-search` calls and three `extract-evidence` calls. Route the first call as the method says. In a coding project, read the manifest and lockfile first and use the versions you find. If a call is refused by a hook, follow the reason in the refusal.

6. **Answer.** Use the shape in the method's citations reference: the answer first with `[E-xxxxxx]` citations, then the evidence, then what you could not establish. Keep it short. Do not paste whole pages.

7. **Save.** With `--save`, write the answer to `<output dir>/notes/<slug>.md`, where the output dir is the value printed by `rpp config output_dir`. Make the slug kebab-case from the question, at most six words. The note holds the question, the answer with citations, what is not established, and today's date. Then run `rpp render <that file> --in-place` so the note carries an appendix of verbatim quotes with URLs and locators. Tell the user the path.

Never claim anything the quotes do not support. If the evidence is thin, say so and say what would settle it.
