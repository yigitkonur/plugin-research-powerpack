# Maintainer notes (plugin-research-powerpack)

Claude Code and Codex plugin `research` (marketplace `plugin-research-powerpack`, plugin folder `research/`): evidence-grounded web research on the hosted Research Powerpack MCP server, with skills, hooks, three Claude agents and the zero-dependency `rpp` node CLI. The Codex side is `research/.codex-plugin/plugin.json`, `research/.codex-mcp.json` and `research/hooks/codex-hooks.json`; skills and hook scripts are shared.

- Where things live: skills in `research/skills/`, hooks and the CLI in `research/scripts/` (`hook.mjs`, `cli.mjs`, `lib/`), recorded fixtures and the replay check in `research/recordings/`, the plugin reference in `research/README.md`.
- This is the one plugin that is installed globally and stays on in both hosts: `.github/kit.json` is `{"install": "global"}`, so its Claude manifest must not set `defaultEnabled: false`.
- Local checks: `node research/recordings/replay.mjs` (CI job `replay`).
- Never put a token, key or personal path in this repo; the server needs no key today.

<!-- kit:agents:start -->
## Releases, versions and installs (shared by every plugin repo)

- **Never bump a version by hand.** `.github/workflows/release.yml` runs after `ci` is green on `main`. `scripts/kit/release.py` reads the conventional-commit subjects since the last release tag (`feat` is a minor, `fix`/`perf`/unprefixed a patch, `type!:` or a BREAKING CHANGE line a major, a minor while the version is 0.x; docs, ci, chore, test, style, build and refactor release nothing) and counts only commits that touch shipped files. It writes every manifest, the marketplace entries and CHANGELOG.md, commits `chore(release): vX [skip ci]`, tags `vX` and `<plugin>--vX` (several plugins: `<plugin>--vX` only) and publishes the GitHub release. `python3 scripts/kit/release.py` with no flags prints what it would do; Actions > release > Run workflow forces a level or a dry run.
- **One version source: the manifests** (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, the marketplace entry). Never a constant in code; read the manifest at runtime.
- Installed copies update only when the version string changes, so a change users should get must reach `main` as a releasing commit type (`feat`, `fix`, `perf`, or `!`).
- **Install policy (the one exception):** installed globally and ON in every project, in both hosts (`.github/kit.json` says `install: global`). `plugin.json` must not set `defaultEnabled: false`.
- `scripts/kit/*`, `scripts/kit.sha256`, `.github/workflows/release.yml`, the `kit:manifests` job in `ci.yml` and the blocks between `kit:` markers in README.md and AGENTS.md are copies from [yigitkonur/plugin-kit](https://github.com/yigitkonur/plugin-kit). Change them there and run its `sync.sh`; `scripts/kit/check-manifests.py` fails CI on a local edit.
- Before pushing: `python3 scripts/kit/check-manifests.py --validate`, `python3 scripts/kit/secret-scan.py --tree`, `python3 scripts/kit/check-links.py`, then this repo's own checks.
<!-- kit:agents:end -->
