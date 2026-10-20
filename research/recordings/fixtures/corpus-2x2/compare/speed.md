# Speed

Axis: speed and concurrency for a small team's TypeScript + ESM Node project.

**Evidence strength: thin.** The corpus holds three kinds of speed evidence. Each is weak.
1. Vendor or maintainer claims in release notes, which are statements and not measurements.
2. One secondary benchmark: a single-author Medium article that timed a 29-test suite [E-3ba87c].
3. Descriptions of how each runner schedules work.

No independent, realistic TypeScript benchmark was found. The Vitest, Jest, Mocha and AVA notes each record "no benchmark read". The node:test note lists two benchmark leads that were never opened (a Hashnode post and EvHaus/test-runner-benchmarks), so they are unread, not absent. This file therefore does not rank the runners on speed unconditionally.

Assumption: "concurrency model" means how test files or tests are scheduled across processes or threads, as far as the notes show.

## Matrix

| Entity | Speed evidence | Concurrency model | Evidence |
|---|---|---|---|
| Vitest | Vendor claim only. The v5 release note says "This release focuses on performance" [E-83b4e0]. No numbers, no benchmark. In the Medium 29-test suite, Vitest "won by 25%" in a comparison with Jest (the quote does not name the baseline) [E-3ba87c]. | no public data (in this corpus). The notes did not read any worker, thread or process description. | [E-83b4e0], [E-3ba87c] |
| Jest | Maintainer claims in release notes: "Warm module resolution costs about a third of what it did" and `jest-snapshot` loads "~200 fewer modules" per test process [E-ca0221]. These are not benchmarks. In the Medium suite Jest took 711 ms [E-3ba87c]. | no public data (in this corpus). The one hint is that each test process loads modules [E-ca0221], which implies per-process workers. That is an inference, not a described model. | [E-ca0221], [E-3ba87c] |
| Mocha | no public data. No benchmark was read. | An opt-in `--parallel` mode exists. The release notes show it being stabilized and fixed: "stabilize `--parallel` integration suite" [E-b744cc] and "propagate spec file path on parallel worker death" [E-5e87e8]. The default (serial) behaviour was not quoted. | [E-b744cc], [E-5e87e8] |
| node:test | The only measurement in the corpus: 90 ms on `node:test` against Jest's 711 ms, on the same 29-test suite, same machine, five cold runs each [E-3ba87c]. The article also says the common advice is stale [E-4b2da5]. Single author, tiny suite, pure JS. | Process isolation by default: "each test file is run in a separate child process" [E-3179a5]. File concurrency defaults to `os.availableParallelism() - 1`, and is ignored (concurrency one) if isolation is `'none'` [E-c9b6bd]. | [E-3ba87c], [E-3179a5], [E-c9b6bd] |
| AVA | Vendor claims only. README bullets say "Runs tests concurrently" and "Isolated environment for each test file" [E-d43807], and "thread isolation" [E-dcec52]. No benchmark. | Concurrent tests with a per-file isolated environment [E-d43807]. A `filterNodeArgumentsForWorkerThreads` option exists [E-072395], so worker threads are likely used (inference). The default of worker threads versus processes was not quoted. | [E-d43807], [E-dcec52], [E-072395] |

## Reading the matrix

- **Only one cell holds a measured number.** It comes from one Medium article: 29 tests, same machine, five cold runs each. It reports `node:test` at 90 ms, Jest at 711 ms, and Vitest ahead of Jest by 25% [E-3ba87c]. The same article claims `node:test` was "Nearly eight times faster than Jest, and six times faster than" Vitest [E-3ba87c]. That is a secondary source with one author, one machine and no stated TypeScript setup. Treat it as an anecdote.
- **Why the number may not scale (inference).** On a 29-test suite, fixed costs probably dominate: process start, module loading and config. A runner with no install, no config and no transform step would do well there. The corpus has no data on a large suite, a TypeScript transform, or watch-mode re-runs.
- **The article is not neutral on method.** It frames the result as overturning stale advice [E-4b2da5]. Its claim that the advice is stale is the author's opinion.
- **Vendor and maintainer claims do not compare across runners.** Vitest's "focuses on performance" [E-83b4e0] has no figure. Jest's improvements [E-ca0221] are relative to Jest's own earlier versions. AVA's "Runs tests concurrently" [E-d43807] describes a feature, not a speed result. Treat all three as vendor claims.
- **Concurrency is described unevenly.** node:test is the only runner with a documented default and a tunable limit in the notes [E-c9b6bd], [E-3179a5]. Mocha's parallel mode is known to exist [E-b744cc] but not how it is configured. For Vitest and Jest, the notes hold no scheduling description.
- **Version and date context.** Figures in the Medium article have no version or date in the notes beyond a reference to "Vitest 0.34" as old advice [E-4b2da5]. Runner versions used in the timing are unknown. The latest versions on the release pages are Vitest 5.0.5 [E-6c95d4], Jest 30.5.2 [E-5cce2e], Mocha 12.0.3 [E-a013ed] and AVA 8.1.0 [E-14c93c]. The Vitest page shows "15 Oct" [E-afa23d], the Jest page "18 Sep" [E-5cce2e] and the AVA page "18 Oct" [E-b3b168], with no year, so the 2026 dating is an inference (unverified).
- **Isolation costs speed and buys safety (inference).** node:test's `--test-isolation=none` runs all files in one process and sets concurrency to one [E-c9b6bd]. That tradeoff is stated by the docs. Whether it is faster in practice is not measured in the corpus.

## Conditional ranking

No unconditional speed ranking is supported. The conditional statements below say what the evidence allows and name the variable that would flip each one.

1. **If the suite is small and mostly plain logic (tens of tests, little transform work):** the only data point favours `node:test` over Vitest and Jest [E-3ba87c], with Vitest ahead of Jest [E-3ba87c]. Confidence is low: one article, one 29-test suite. Variable that flips it: suite size and transform cost. A re-run on the team's own repo would settle it.
2. **If the suite is large or CPU-bound:** no ranking. The corpus has no data. Inference: scheduling matters more here, and the documented knobs are `--test-concurrency` for node:test [E-c9b6bd], `--parallel` for Mocha [E-b744cc], and AVA's concurrent, isolated files [E-d43807]. Vitest and Jest have no described model in the notes. Variable that flips it: file count and per-file runtime.
3. **If you are on Jest already and want faster runs without switching:** the maintainers report resolution and loading improvements [E-ca0221]. The size of the gain is unquantified, so upgrade and measure. Variable: current Jest version.
4. **If shared state between test files is acceptable:** node:test can run files in one process with `--test-isolation=none`, but concurrency is then one [E-c9b6bd], so this is not a clear speed win. Variable: whether files need isolation.
5. **If Mocha is the incumbent:** `--parallel` is available and being maintained [E-b744cc], [E-5e87e8], but its benefit is unmeasured here.

What would settle the axis: a benchmark on a realistic TypeScript backend, with versions and cold and warm runs reported. The unread leads (Hashnode and EvHaus/test-runner-benchmarks, from the node:test note) are the first things to read. Failing that, a timing of each candidate on the team's own repository.

Speed also should not decide the pick alone. Other axes carry hard constraints that the notes do record: Vitest 5 requires Node >=22.12.0 [E-86683f], and node:test coverage is experimental [E-172994]. Those are covered in the other compare files and the summary.
