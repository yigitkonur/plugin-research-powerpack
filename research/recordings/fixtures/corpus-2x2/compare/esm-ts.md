# ESM and TypeScript

Axis: ESM + TypeScript setup for a Node backend (no Vite app assumed, per the charter). The run date comes from the charter. Several release pages show day and month without a year, so the year is an unverified inference.

Assumption: "Node floor" means the minimum Node version the runner itself or its TypeScript path needs. Where the notes did not quote one, the cell says so.

## Matrix

| Entity | Setup needed | Node floor | Evidence |
|---|---|---|---|
| Vitest (v5.0.5, "15 Oct", year not shown) | Install `vitest`. Vite is a hard dependency, but a plain backend needs no Vite app. A `vitest.config.*` is optional. The no-loader TS/ESM mechanism was not quoted: unverified. | Node >=22.12.0 and Vite >=6.4.0 | [E-86683f] [E-8f1b75] [E-1bdab3] [E-e3165a] [E-6c95d4] [E-afa23d] |
| Jest (v30.5.2, "18 Sep", year unverified) | ESM is experimental and needs `node --experimental-vm-modules`. A `.ts` file treated as ESM needs `extensionsToTreatAsEsm`. A release added type stripping via Node when no transformer claims the file. The ts-jest/@swc/jest/babel guidance was not quoted: unverified. | no public data in the notes (the runner's own floor was not read). Node 24.9+ is cited only for `require(esm)`, and that still needs the flag. | [E-704cc5] [E-ddaa5b] [E-caf885] [E-2fc394] [E-ca6070] [E-5cce2e] |
| Mocha (12.0.3, 2026-10-01) | ESM-first as of v12. A TS route is `--import=tsx`, shown only in an integration test. Official TS docs were not read: unverified. | no public data (not quoted; settle with 12.0.0 release notes or `engines`) | [E-a013ed] [E-8ab68d] [E-f476e4] [E-d71e34] [E-7f9b33] |
| node:test (built into Node) | Ships in core [E-c42326]; no dev dependency needed (inference). Type stripping is on by default and stable. Enums, runtime namespaces, parameter properties and import aliases need transformation [E-80af77] and error under stripping [E-bc374f]. tsconfig `paths` are ignored. Imports need `.ts` extensions. There is no type-check (inference). | Type stripping on by default from Node 22.18 / 23.6; stable from 24.12 / 25.2 | [E-c42326] [E-ea2bd7] [E-8c0ef0] [E-17479b] [E-03fed3] [E-80af77] [E-5f0ea6] |
| AVA (v8.1.0, "18 Oct", year not shown) | Internally fully ESM, with CJS still supported. Test files load via `import()`. TS routes are `@ava/typescript` v7 (precompiled with `tsc`) or a loader via `nodeArguments` (the recipe uses `--import=tsimp`). tsx was not quoted: unverified. | Node 22.20, 24.12 or newer (the extract does not show which release the quote belongs to) | [E-58b84a] [E-668dbf] [E-2c4274] [E-9d8a79] [E-feb875] [E-8eb51a] [E-14c93c] [E-b3b168] |

## Reading the matrix

**Fewest moving parts: node:test.** Per the notes, it ships in Node core [E-c42326], so no dev dependency is needed (inference), and TS test files are discovered with no flag on Node 22.18+ or 24.12+ [E-ea2bd7] [E-17479b]. The cost is that Node only strips types. Node ignores `tsconfig.json`, so `paths` are unsupported [E-03fed3] [E-c28d74]. Enums, runtime namespaces, parameter properties and import aliases raise errors [E-80af77] [E-a341b0]. Relative imports need explicit extensions [E-5f0ea6]. The notes also say `.tsx` is unsupported [E-3c33d1] and files under `node_modules` are refused [E-753468]. The point that type-checking is absent is the note author's inference, not a quote. A project would still need `tsc --noEmit` separately (inference).

**Most explicit ESM story with a documented floor: Vitest and AVA.**
- Vitest sets its floor in its own docs: Node >=22.12.0 [E-86683f]. The notes did not quote the TS transform mechanism, so I cannot say how it handles `paths` or enums. The `vite.config.*` default is documented [E-e3165a].
- AVA's floor is Node 22.20 or 24.12+ [E-8eb51a]. The v8 notes mention Node 26 support and dropping Node 25 [E-63866d]. The TS recipe text still cites Node 18-21 minimums, so it may lag the floor [E-e5db3f]. The loader recipe names tsimp, not tsx [E-feb875].
- Both floors are above Node 20. The charter lists "a Node version below type-stripping support" as a flip condition. A Node 20 project is excluded from both on these quotes.

**Heaviest setup: Jest.** ESM is still labelled experimental [E-704cc5] and needs a Node flag [E-ddaa5b]. A release note says `require(esm)` works on Node 24.9+ but "still requires `--experimental-vm-modules` like before" [E-ca6070]. A newer release can strip types through Node when no transformer claims the file [E-2fc394]. How that interacts with the experimental ESM flag was not read (gap). No Jest 31 appeared on the releases page (inference from the Latest tag).

**Mocha: ESM-first, TS thinly evidenced.** The one TS setup evidence is a `--import=tsx` integration test [E-d71e34]. Issue #5452 reports an `ERR_INTERNAL_ASSERTION` when an interface is imported without `import type`, seen with both ts-node and tsx [E-7f9b33] [E-75c9b5]. The workaround is `import type` [E-63185f]. A maintainer closed it as out of scope, and the fix is to disable Node's strip-types [E-0ca2b9]. It carries the wontfix label [E-4fcf2c]. Inference from the notes: this may affect Node 22.18+/24 users, where stripping is on by default [E-ea2bd7].

**Disagreements and scope limits.**
- No source pair in these five notes directly contradicts another on ESM/TS. The one contradiction in the notes is about watch mode (test.html [E-0f8872] against cli.html [E-76cd88]). It is not part of this axis.
- Release years are unverified for Vitest [E-afa23d], Jest [E-5cce2e] and AVA [E-b3b168].
- The Vitest, Jest and AVA TS mechanisms rest on release notes and a partial guide, not the setup docs. The notes list these as gaps.

## Conditional ranking

Ranking is for ESM + TS setup effort only, on a small-team Node backend. It is not an overall pick.

1. **node:test first when the project can pin Node 22.18+/24.12+ [E-ea2bd7] [E-8c0ef0], uses erasable-only TypeScript, and does not rely on `tsconfig` `paths`.** The flip variable is whether the code uses enums, runtime namespaces, parameter properties or `paths` aliases. If it does, node:test fails on those files [E-80af77] [E-03fed3], and a loader or a transforming runner is needed. This ranking depends on setup effort only. The notes mark module mocking [E-306a97] and coverage [E-172994] as experimental, so the features axis may change the overall pick.
2. **Vitest second, and first when the codebase uses non-erasable TS or `paths`.** I could not verify how Vitest handles those cases, because the transform mechanism was not quoted. This is a gap, not a finding. The flip variable is Node version: Node below 22.12 rules Vitest out [E-86683f].
3. **AVA third.** It needs Node 22.20 or 24.12+ [E-8eb51a] and a TS route that requires either a precompile step (`@ava/typescript` v7 [E-9d8a79]) or a loader recipe [E-feb875]. It moves up if the team already precompiles with `tsc`.
4. **Mocha and Jest last, for different reasons.**
   - Mocha is ESM-first [E-f476e4], but its TS path is evidenced only by one integration test [E-d71e34]. It has a known issue with Node's strip-types that a maintainer closed as out of scope [E-0ca2b9]. The Node floor is unknown. The flip variable is whether the team uses `import type` consistently. If so, #5452 is avoidable [E-63185f].
   - Jest requires the experimental flag [E-ddaa5b] and `extensionsToTreatAsEsm` [E-caf885]. It is the choice only when a hard need for Jest-only tooling exists, as the charter's flip says. In that case, accept the flag.

Not established: Mocha's Node floor, Jest's Node floor, Vitest's no-loader TS mechanism, any practitioner report of setup effort for these five, and whether the stripped-TS Jest path works under ESM. Searching the Mocha release notes for the current major, the Jest getting-started and code-transformation docs, and vitest.dev/guide/features would settle these.
