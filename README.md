# plugin-research-powerpack

a claude code and codex plugin that makes your agent do web research like it has to defend every sentence. answers come with verbatim quotes, every number points at the exact line that says it, and the plugin itself refuses to let a made-up citation through.

it bundles the **research powerpack** mcp server (search, plan, and quote-verified extraction) and wraps it in skills, hooks and (in claude code) agents that do the boring discipline for you.

## why it exists

agents are bad at web research in a very specific way. they skim a search snippet, paraphrase it with confidence, and drop a link that doesn't actually say the thing. or they paste five pages of raw html into context and torch 40k tokens to answer one question.

this plugin fixes both:

- **only quotes count.** search results are treated as leads, never evidence. a claim needs a quote the server pulled from the page itself, with a line number.
- **every quote gets an id.** `E-a1b2c3`, stable across agents and sessions, kept in a ledger on disk instead of in your context window.
- **the hooks check the work.** a cited number has to actually appear in the cited quote. a quote that's just a "Latest" button or an avatar link gets flagged as thin. unknown ids, uncited numbers, blank table cells, `TBD`s and dead links block a research run from finishing.
- **tool output gets compacted.** the model still sees every quote, but across 130 recorded extraction calls it read 62% fewer characters than the raw output, and 74% fewer on searches (top 12 leads, the rest stay in the ledger).

<!-- kit:install:start -->
## install

This plugin is the one exception to our install-off rule: it is installed **globally and stays on in every project**, in Claude Code and Codex.

### 1. install it globally

**Claude Code**

```sh
claude plugin marketplace add yigitkonur/plugin-research-powerpack
claude plugin install research@plugin-research-powerpack -s user
```

**Codex** (0.163+)

```sh
codex plugin marketplace add yigitkonur/plugin-research-powerpack
codex plugin add research@plugin-research-powerpack
```

All our plugins, both hosts, plus the `plugin` command and the 6-hourly update job, in one line:

```sh
curl -fsSL https://raw.githubusercontent.com/yigitkonur/plugin-kit/main/install.sh | sh -s -- --all
```

### 2. updates

A plugin updates only when its `version` changes, and this repo's `release` workflow bumps it on every shipped change. Machines pick it up with `plugin update`, or by themselves with the 6-hourly job (`plugin autoupdate install`). By hand:

```sh
claude plugin marketplace update plugin-research-powerpack && claude plugin update research@plugin-research-powerpack
codex plugin marketplace upgrade plugin-research-powerpack        # then start a new session
```

No GitHub SSH key on the machine? `export CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` (`plugin install` sets it in Claude's settings for you).

### 3. uninstall

```sh
claude plugin uninstall research@plugin-research-powerpack -s user
claude plugin marketplace remove plugin-research-powerpack
codex plugin remove research@plugin-research-powerpack
codex plugin marketplace remove plugin-research-powerpack
```
<!-- kit:install:end -->

### research is installed globally and stays on

unlike our other plugins, research is installed globally and stays on in claude code and codex, in every project. there is nothing to switch on per project.

### first run

the claude code installer says 3 userConfig options aren't set yet. that's expected, they all have defaults (`/plugin configure research` if you want to change them).

restart claude code (or run `/reload-plugins`), then run `/research:doctor` to check the server is reachable. that's it, no api key.

needs node 20+ on your path (the hooks and the `rpp` cli are zero-dependency node scripts).

### codex differences

codex reviews a plugin's hooks the first time: open `codex`, pick "trust all" on the "hooks need review" screen. what's different from claude code: no `/research:*` slash commands (say "use the research ask skill to ..." or `$ask`), no scout/analyst/auditor agent types (the skills spawn plain codex agents or do the step themselves), and the tool output isn't shortened (the hook lists the new quote ids instead). the server url is fixed in `.codex-mcp.json`; `rpp` still honors `RESEARCH_MCP_URL`. check with `codex plugin list` and `codex mcp list`.

## what's in the box

| command | use it for |
|---|---|
| `/research:ask <question or urls> [--save] [--background]` | one question, one cited answer. debug an error, check what changed in a release, read the urls you paste, check a spec clause. `--save` writes it to a note, `--background` hands it to a scout so you keep working. |
| `/research:deep <topic> [--report\|--brief\|--corpus] [--depth fast\|standard\|exhaustive] [--no-ask]` | the big one. a report, decision memo, migration guide or literature review, or a corpus comparing five or more options, written to disk as a folder you can read later. resumes unfinished runs. |
| `/research:verify <file, url or text>` | fact-check a readme, docs page, pr description or ai-written answer. every claim gets a verdict (supported, contradicted, outdated, overstated, unverified) and a quote. |
| `/research:doctor` | is the server up, did its contract change, are your settings sane. |

three agents do the legwork, all sonnet: **scout** researches one lens or entity, **analyst** writes comparisons from notes with no web access, and **auditor** checks whether a quote really supports its claim.

## quick tour

```shell
/research:ask did vitest 5 drop node 20?
```

you get two or three sentences with `[E-xxxxxx]` citations, the evidence, and what it couldn't establish. look any id up with `rpp ledger get E-xxxxxx`.

```shell
/research:deep which self-hosted password managers could a 10-person team run? map the options --corpus --depth fast
```

this one asks you one scoping question with a preview card (accept with one click). since you didn't name the options, a discovery scout maps the field first and you confirm the list once. then scouts research each option in parallel, analysts build the comparison files, an auditor checks the key claims, and you get a folder like:

```
research/selfhosted-password-managers/
  summary.md          the recommendation, conditional rankings, gaps
  entities/*.md       one note per option, every claim cited
  compare/*.md        one file per axis: digest, matrix, conditional ranking
  audit.md            what was checked, what's still risky
  evidence/           the quote ledger
```

fast corpora like that took 7 to 11 minutes in our test runs, and about $2.40 to $2.60 where we tracked the cost. the final message tells you the real spend for yours.

```shell
/research:verify README.md
```

writes `README.md.verify.md` next to it with a verdict table and a corrected line for anything wrong. your original stays untouched.

## how it decides who asks you things

only the main conversation can ask you questions (subagents can't). so a deep run asks at most: the scope card, the entity list after discovery (only when you didn't name the options), and one checkpoint if something big changes, like a contradiction that would flip the recommendation. `--no-ask` skips all of it and writes every default it picked into the charter.

## privacy

queries and urls go to the hosted research powerpack server at `https://research-mcp.yigitkonur.com/mcp`, which is run by the plugin author. it needs no key today. don't research anything you wouldn't send there. the method tells agents to strip secrets, internal hostnames and paths from error strings before searching. the ledger and run folders stay on your machine. if you run your own deployment, set `RESEARCH_MCP_URL`.

## more

- the plugin reference (how it works, the `rpp` cli, settings, known limits): [research/README.md](research/README.md)
- replay checks recorded from real runs: `node research/recordings/replay.mjs`
- hack on it locally: `claude --plugin-dir ./research`

## license

MIT
