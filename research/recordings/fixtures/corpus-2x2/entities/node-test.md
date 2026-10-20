# node:test

## Snapshot
- Stability: the docs history says "v20.0.0 The test runner is now stable." [E-223ee0], mirrored in the CLI docs [E-d6c3e6]. The literal "Stability: 2" banner was not captured (see Gaps).
- Node lines per the releases page: "[v26] - May 05, 2026 Oct 14, 2026 Current" [E-7d6290]; "[v24] Krypton May 06, 2025 Oct 14, 2026 LTS" [E-bc0eb8]; "[v22] Jod Apr 24, 2024 Sep 23, 2026 LTS" [E-32dd82]. The table's date columns are unlabeled in the extract, so I do not know which date is the LTS start or the end of life. Inference: the LTS line is the safe target [E-bc0eb8].
- Dev dependencies: none needed. "The `node:test` module facilitates the creation of JavaScript tests... This module is only available under the `node:` scheme." [E-c42326]

## ESM and TypeScript
- Type stripping is on by default: "v23.6.0, v22.18.0 Type stripping is enabled by default." [E-ea2bd7]. It is stable: "v25.2.0, v24.12.0 Type stripping is now stable, the flag was renamed ... to `--no-strip-types`." [E-8c0ef0]. Inference: on those versions .ts test files run with no flag [E-ea2bd7] [E-8c0ef0].
- Test discovery includes TS files: "Unless `--no-strip-types` is supplied, the following additional patterns are also matched: `**/*.test.{cts,mts,ts}` ..." [E-17479b]
- Limits. "Node.js ignores `tsconfig.json` files and therefore features that depend on settings within `tsconfig.json`, such as paths ... are intentionally unsupported." [E-03fed3] Also "[`tsconfig` "paths"] won't be transformed and therefore produce an error." [E-c28d74]
- Features that need transformation: "`Enum` declarations - `namespace` with runtime code - parameter properties - import aliases" [E-80af77]. They raise ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX [E-a341b0].
- ESM caveats. "file extensions are mandatory in `import` statements ...: `import './file.ts'`, not `import './file'`" [E-5f0ea6]. "`.tsx` files are unsupported." [E-3c33d1]. "Node.js refuses to handle TypeScript files inside folders under a `node_modules` path." [E-753468]
- There is no type-checking; Node only strips types. This is my inference, and I did not quote it. The same extract does show tsconfig is ignored [E-03fed3].

## Mocking, coverage, watch
- Function mocks: "supports mocking during testing via a top-level `mock` object" [E-e38b10]. Mock timers: "v23.1.0 The Mock Timers is now stable." [E-81f2b3]; they can also mock `Date` [E-c5c736].
- Module mocking is not stable: "`mock.module` ... Stability: 1.0 - Early development" [E-306a97]. It needs a flag: "Node.js must be started with the `--experimental-test-module-mocks` command-line flag." [E-2f4cc7]
- Coverage is experimental: "Collecting code coverage Stability: 1 - Experimental" [E-172994]. It is enabled with `--experimental-test-coverage` [E-277067]. Thresholds are experimental too: "`--test-coverage-branches=threshold` Added in: v22.8.0 Stability: 1 - Experimental" [E-aaa956].
- Watch: the test-runner docs section reads "Watch mode Added in: v19.2.0, v18.13.0 Stability: 1 - Experimental" [E-0f8872]. The CLI history says "v22.0.0, v20.13.0 Watch mode is now stable." [E-76cd88], and that entry appears under `--watch`. The two sources disagree; see Contradictions.
- Snapshots: "v23.4.0 Snapshot testing is no longer experimental." [E-8747e2]. Update them with `--test-update-snapshots` [E-849241].
- Isolation: the default is process isolation, "each test file is run in a separate child process" [E-3179a5]. Default concurrency is "`os.availableParallelism() - 1`" [E-c9b6bd]. Configuration can come from a config file [E-65cf46].

## Maintenance and ecosystem
- It ships inside Node core, so it follows the Node release schedule [E-7d6290, E-bc0eb8, E-32dd82]. The docs show recent additions such as `--test-rerun-failures` [E-14ae98] and a `--test-isolation` rename in v23.6.0 [E-3179a5]. These show the API is still changing.
- Gap: no ecosystem data (plugins, IDE support). See Gaps.

## Speed
- Secondary source, single author, 29 pure-JS tests: "it finished in 90 ms against Jest's 711 ms" [E-3ba87c]. The same article says Vitest was faster than Jest by 25% on that suite [E-3ba87c]. The article also says the common advice is stale because it dates from when `node:test` "still carried an experimental warning" [E-4b2da5]. This is one tiny suite, so treat it as indicative only.

## Practitioner signal
- I read the visible part of one r/node thread (partial text). Three comments recommend it:
  - "The node std lib testing suite is great Id really recommended it" [E-a8dbee] (comment mdyrsln).
  - "i really like nodes native new test system a lot too" [E-a8d322] (comment me0tap7).
  - "I just use node's built in test runner" [E-6e6460] (comment me7zetw).
- This is not a consensus. The thread date is unverified and the sample is small.

## Gaps
- The literal top-of-page "Stability: 2 - Stable" banner for node:test was not captured. Searched: the nodejs.org/api/test.html extraction (the text was truncated). Only the v20.0.0 "now stable" history line was found. Re-reading the page top would settle it.
- The meaning of the date columns in the previous-releases table, and the exact LTS dates. The nodejs/release schedule.json would settle it.
- Mock/reporter/ecosystem limits, such as no built-in `vi.mock` hoisting or jsdom, were not sourced.
- No independent benchmark on a realistic TypeScript backend. The hashnode benchmark and EvHaus/test-runner-benchmarks (leads only) were not read.

## Contradictions
- Watch mode stability: test.html says "Stability: 1 - Experimental" [E-0f8872]. cli.html says "v22.0.0, v20.13.0 Watch mode is now stable." [E-76cd88]. The CLI entry is for generic `node --watch`, and the test.html entry is for `node --test --watch`. Treat test-runner watch as experimental per test.html.
