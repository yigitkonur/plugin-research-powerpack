# Vitest

## Snapshot
- Latest stable on the GitHub releases page is v5.0.5, marked Latest [E-6c95d4], released "15 Oct" [E-afa23d]. The page shows no year. The year is an inference.
- A v5.1.0-beta.1 pre-release also exists [E-df067c].
- v5.0.3 was released 30 Sep [E-c9eaa8]. the rc.4 tag (inferred from the section heading) was released 31 Aug [E-8e21f9], and rc.3 (inferred the same way) on 28 Aug [E-74fbc2].
- Release note: "Vitest 5 is officially out! This release focuses on performance and brings a lot of new features while fixing long-standing bugs." [E-83b4e0]
- The GA date of the major release was not read. The patch releases are frequent [E-c9eaa8] [E-6c95d4], an inference from the dates above.

## ESM and TypeScript
- Requirement: "Vitest requires Vite >=v6.4.0 and Node >=v22.12.0" [E-86683f]. Vitest 5 breaking change: "Require Node.js 22 and Vite 6.4" [E-8f1b75].
- Vitest is "powered by Vite" [E-1bdab3]. It reads `vite.config.*` by default, and a dedicated `vitest.config.*` is optional [E-e3165a].
- Inference: Vite is a required dependency, but a plain Node backend does not need a Vite app or a config file.
- The guide excerpt I read did not state the no-loader TypeScript mechanism. See Gaps.

## Mocking, coverage, watch
- Watch: the guide says "To run tests once without watching for file changes, use `vitest run`" [E-4f24ab]. Inference: watching is the default in dev, and `vitest run` is the one-shot mode.
- Mocking: v5 breaking change "Clear mocks by default before each test" [E-12f359]. This implies a built-in `vi` mocking layer. A `vi.mock` quote was not obtained.
- Coverage: the release notes mention both V8 [E-37f985] and Istanbul [E-8aa482] coverage. The v5 line includes "Switch to `@vitest/istanbuljs` packages" [E-998a5e], and V8 ignores "Vite SSR's generated import bindings" [E-637557].
- Inference: both the v8 and istanbul providers are live in v5.

## Maintenance and ecosystem
- Patch cadence is frequent, per the dates above [E-c9eaa8]. A 5.1 beta is in flight [E-df067c].
- Browser mode: the search leads said it went stable in an earlier major, but I did not read a primary quote. The v5 notes include "Drop experimental label from trace view" [E-805c1f]. Browser mode is out of scope for this charter.
- Caveat for plain Node: Vite is a hard requirement, and Node 22.12 or later is required [E-86683f]. This matters if the project is on Node 20. It also fits the charter's flip for "Node version below type-stripping support".
- Caveat: a major bump changed the default to clearing mocks before each test [E-12f359].

## Speed
- The only primary claim is the vendor's own: "This release focuses on performance" [E-83b4e0]. No benchmark was read.

## Practitioner signal
- None read, because of the budget. The Reddit lead "Is Vitest browser mode ready for prime time?" is about browser mode and was not read.

## Gaps
- The v5.0.0 GA date and the year on the releases page. Settling it needs the https://vitest.dev/blog/vitest-5.html page or the v5.0.0 tag.
- Quotes on how TypeScript and ESM are handled without a loader (esbuild/oxc transform through Vite). Settling it needs https://vitest.dev/guide/why or the features page.
- A `vi.mock` quote, a coverage-provider doc quote and a watch-default quote. Settling it needs https://vitest.dev/guide/mocking, https://vitest.dev/guide/coverage and https://vitest.dev/guide/cli.
- A stable-browser-mode primary quote, benchmarks and practitioner opinion.

## Contradictions
None found.

## Sources read
- https://github.com/vitest-dev/vitest/releases (partial)
- https://vitest.dev/guide/ (partial)
- https://vitest.dev/blog/vitest-4 (no useful quotes beyond "Today, we are thrilled to announce Vitest 4!" [E-5bd8eb])
