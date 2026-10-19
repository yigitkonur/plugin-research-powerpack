# Queries and requirements by use case

Each recipe gives the angles to cover and an example requirement. Adapt the names. Send one wave, read the leads, then decide on the next.

## A current fact, version or clause

- Queries: the product plus the exact claim, the official changelog or release page, the specification section.
- Requirement: "Which release of X introduced Y, and is Y deprecated in the latest release?"
- Read one primary source. A second source is for contested facts only.

## An error message or failure

- Queries: the exact error string in quotes, the same string plus the library name and major version, the issue tracker for that library, a postmortem or workaround write-up.
- Requirement: "What causes error '<string>' in <library> <version>, and which release fixes it?"
- Read the local dependency versions first. State the fix per version. Prefer maintainers' comments over guesses.

## An upgrade or migration

- Queries: the migration guide, the changelog between the two versions, breaking-change lists, issues titled with the upgrade, codemods.
- Requirements, one per area: "What breaking changes affect <API> between vX and vY?" and "Is there an official codemod?"
- Report only changes that touch what the project actually uses.

## Spec or standards compliance

- Queries: the spec revision page, the changelog, security considerations, the reference implementation.
- Requirements: one per clause. "Does the spec require servers to validate the Origin header, and what attack does that prevent?"
- Quote the MUST and SHOULD wording and name the revision.

## A security advisory or CVE

- Queries: the advisory ID, the package plus "advisory", the fix commit, the vendor bulletin.
- Requirements: "Which versions are affected?", "Which version fixes it?", "Is there a workaround?"
- Check the affected range against the version in the lockfile.

## Pricing or plans

- Queries: the pricing page, the limits or quotas page, the terms page, a recent changelog entry.
- Requirements: "What does the <plan> cost per <unit>, and what are its limits?"
- Quote with the retrieval date. Prices change, so say when the page was read.

## Comparing options

- Decide the axes with the user first. Use one requirement per axis per option.
- Take each option's own documentation for capabilities. Use independent sources for performance, reliability and sentiment.
- Rank conditionally: "A for high throughput, B when you need X." Name the variable that flips the ranking.

## Community sentiment

- Queries: the product plus "reddit", "hacker news", "issues", "migrating from".
- Requirement: "What do users report about <problem>, and which workarounds do they mention?"
- Report each opinion with handle, date and permalink. Say how many comments you read. A few comments are anecdotes, not a population.

## Requirement patterns

- One fact per requirement. Split "pricing and limits" in two.
- Name the entity, version and period.
- Ask for the sentence, not an opinion: "Quote what the page says about X."
- A negative is a valid result: "Does the page state a rate limit?" returning `not-found` is worth reporting.
