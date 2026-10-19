# Which MCP transport for a new Claude Code plugin server?

**Recommendation: Streamable HTTP, declared as `type: "http"`. Do not build on HTTP+SSE.** If the server only runs on the user's machine, stdio is the other sound choice; that case was not researched in depth.

## Why

- **The spec has deprecated HTTP+SSE.** The newest spec revision I read says "New implementations **SHOULD NOT** adopt it; existing implementations **SHOULD** migrate to Streamable HTTP. It is eligible for removal in a future revision" [E-8791da].
- **Deprecation is not new.** The same page dates it "since protocol version `2025-03-26`" [E-f095f8].
- **Streamable HTTP is the replacement.** It "was introduced in protocol version 2025-03-26 as a replacement for the HTTP+SSE transport from protocol version 2024-11-05" [E-c87324].
- **Claude Code agrees.** Its docs say "HTTP servers are the recommended option for connecting to remote MCP servers" [E-b8b726] and "The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available." [E-056878]

## How to declare it in a plugin

- A `url` entry needs a `type`. "Claude Code reads an entry with no `type` as a stdio server, so a `url` entry without a `type` fails." [E-77f025] Claude Code's MCP docs say `streamable-http` is an alias for `http` in `.mcp.json` [E-061fdf]. That is not confirmed for plugin manifests, so use `http`.
- Entry shape, from the general MCP docs (trimmed; a general `.mcp.json` example, not a plugin one): `{ "mcpServers": { "core-tools": { "type": "http", "url": "https://mcp.example.com/mcp" } } }` [E-62c040].
- The plugin-dev skill shows an http entry in flat form (trimmed): `{ "api-service": { "type": "http", "url": "https://api.example.com/mcp" } }` [E-557c28]. It calls a dedicated plugin-root `.mcp.json` the recommended method [E-840b88], so flat http in that file is an inference; an inline `mcpServers` field in `plugin.json` is the alternative [E-faf30e].

## Do you need to keep SSE too?

Only if you must serve older clients. The spec says servers wanting that "Continue to host both the SSE and POST endpoints of the old transport, alongside the new 'MCP endpoint'" [E-568b42]. Claude Code recommends HTTP servers [E-b8b726], so a Streamable HTTP server alone should work with it (inference, not tested). The recommendation flips only if a client you must support speaks nothing but HTTP+SSE.

## Conflicting source

The plugin-dev skill says "Focus on stdio for custom/local servers, SSE for hosted services with OAuth." [E-9f819c] That conflicts with the main docs [E-056878]. I treat the docs and the spec as authoritative; the skill's age was not checked.

## Not established

- Whether a plugin-root `.mcp.json` accepts the wrapped `mcpServers` form: the plugins-reference page gave no quote, so the two shapes above come from different pages.
- Whether Claude Code has announced a date for dropping SSE.
- stdio versus HTTP trade-offs for bundled plugin servers.
