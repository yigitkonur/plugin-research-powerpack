# Which MCP transport for a new Claude Code plugin server?

**Recommendation: Streamable HTTP, declared as `type: "http"`. Do not build on HTTP+SSE.** If the server only runs on the user's machine, stdio is the other sound choice; that case was not researched in depth.

## Why

- **The spec has deprecated HTTP+SSE.** The newest spec revision I read says "New implementations **SHOULD NOT** adopt it; existing implementations **SHOULD** migrate to Streamable HTTP. It is eligible for removal in a future revision" [1].
- **Deprecation is not new.** The same page dates it "since protocol version `2025-03-26`" [2].
- **Streamable HTTP is the replacement.** It "was introduced in protocol version 2025-03-26 as a replacement for the HTTP+SSE transport from protocol version 2024-11-05" [3].
- **Claude Code agrees.** Its docs say "HTTP servers are the recommended option for connecting to remote MCP servers" [4] and "The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available." [5]

## How to declare it in a plugin

- A `url` entry needs a `type`. "Claude Code reads an entry with no `type` as a stdio server, so a `url` entry without a `type` fails." [6] Claude Code's MCP docs say `streamable-http` is an alias for `http` in `.mcp.json` [7]. That is not confirmed for plugin manifests, so use `http`.
- Entry shape, from the general MCP docs (trimmed; a general `.mcp.json` example, not a plugin one): `{ "mcpServers": { "core-tools": { "type": "http", "url": "https://mcp.example.com/mcp" } } }` [8].
- The plugin-dev skill shows an http entry in flat form (trimmed): `{ "api-service": { "type": "http", "url": "https://api.example.com/mcp" } }` [9]. It calls a dedicated plugin-root `.mcp.json` the recommended method [10], so flat http in that file is an inference; an inline `mcpServers` field in `plugin.json` is the alternative [11].

## Do you need to keep SSE too?

Only if you must serve older clients. The spec says servers wanting that "Continue to host both the SSE and POST endpoints of the old transport, alongside the new 'MCP endpoint'" [12]. Claude Code recommends HTTP servers [4], so a Streamable HTTP server alone should work with it (inference, not tested). The recommendation flips only if a client you must support speaks nothing but HTTP+SSE.

## Conflicting source

The plugin-dev skill says "Focus on stdio for custom/local servers, SSE for hosted services with OAuth." [13] That conflicts with the main docs [5]. I treat the docs and the spec as authoritative; the skill's age was not checked.

## Not established

- Whether a plugin-root `.mcp.json` accepts the wrapped `mcpServers` form: the plugins-reference page gave no quote, so the two shapes above come from different pages.
- Whether Claude Code has announced a date for dropping SSE.
- stdio versus HTTP trade-offs for bundled plugin servers.

<!-- research:appendix:start -->
## References and evidence

**[1]** https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http line 512 (Streamable HTTP), read 2026-10-19
> **Deprecated**: The [HTTP+SSE transport](/specification/2024-11-05/basic/transports#http-with-sse) from protocol version 2024-11-05 has been deprecated since protocol version `2025-03-26` and is classified as Deprecated under the [feature lifecycle policy](/community/feature-lifecycle#deprecating-a-feature) ([SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596)). New implementations **SHOULD NOT** adopt it; existing implementations **SHOULD** migrate to [Streamable HTTP](/specification/2026-07-28/basic/transports/streamable-http). It is eligible for removal in a future revision; see the [deprecated features registry](/specification/2026-07-28/deprecated).

**[2]** https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http line 512 (Streamable HTTP), read 2026-10-19
> The [HTTP+SSE transport](/specification/2024-11-05/basic/transports#http-with-sse) from protocol version 2024-11-05 has been deprecated since protocol version `2025-03-26` and is classified as Deprecated under the [feature lifecycle policy](/community/feature-lifecycle#deprecating-a-feature) ([SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596)). New implementations **SHOULD NOT** adopt it; existing implementations **SHOULD** migrate to [Streamable HTTP](/specification/2026-07-28/basic/transports/streamable-http).

**[3]** https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http line 9 (Streamable HTTP), read 2026-10-19
> Streamable HTTP was introduced in protocol version 2025-03-26 as a replacement for the [HTTP+SSE transport](/specification/2024-11-05/basic/transports#http-with-sse) from protocol version 2024-11-05.

**[4]** https://code.claude.com/docs/en/mcp line 139 (Connect Claude Code to tools via MCP), read 2026-10-19
> HTTP servers are the recommended option for connecting to remote MCP servers. This is the most widely supported transport for cloud-based services.

**[5]** https://code.claude.com/docs/en/mcp line 163 (Example with Bearer token), read 2026-10-19
> The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available.

**[6]** https://code.claude.com/docs/en/mcp line 295 (List all configured servers), read 2026-10-19
> **A `url` with no `type`**: add `"type": "http"`, `"type": "sse"`, or `"type": "ws"` to match the endpoint. Claude Code reads an entry with no `type` as a stdio server, so a `url` entry without a `type` fails.

**[7]** https://code.claude.com/docs/en/mcp line 153 (Example with Bearer token), read 2026-10-19
> When configuring MCP servers via JSON in `.mcp.json`, `~/.claude.json`, or `claude mcp add-json`, the `type` field accepts `streamable-http` as an alias for `http`.

**[8]** https://code.claude.com/docs/en/mcp lines 1922-1932 (Disable tool search entirely), read 2026-10-19
> ```
> {
>   "mcpServers": {
>     "core-tools": {
>       "type": "http",
>       "url": "https://mcp.example.com/mcp",
>       "alwaysLoad": true
>     }
>   }
> }
> ```

**[9]** https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/mcp-integration/SKILL.md lines 188-197 (HTTP (REST API)), read 2026-10-19
> {
>   "api-service": {
>     "type": "http",
>     "url": "https://api.example.com/mcp",
>     "headers": {
>       "Authorization": "Bearer ${API\_TOKEN}",
>       "X-Custom-Header": "value"
>     }
>   }
> }

**[10]** https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/mcp-integration/SKILL.md lines 73-87 (Method 1: Dedicated .mcp.json (Recommended)), read 2026-10-19
> ### Method 1: Dedicated .mcp.json (Recommended)
>
> [](#method-1-dedicated-mcpjson-recommended)
>
> Create `.mcp.json` at plugin root:
>
> {
>   "database-tools": {
>     "command": "${CLAUDE\_PLUGIN\_ROOT}/servers/db-server",
>     "args": \["\--config", "${CLAUDE\_PLUGIN\_ROOT}/config.json"\],
>     "env": {
>       "DB\_URL": "${DB\_URL}"
>     }
>   }
> }

**[11]** https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/mcp-integration/SKILL.md lines 95-110 (Method 2: Inline in plugin.json), read 2026-10-19
> ### Method 2: Inline in plugin.json
>
> [](#method-2-inline-in-pluginjson)
>
> Add `mcpServers` field to plugin.json:
>
> {
>   "name": "my-plugin",
>   "version": "1.0.0",
>   "mcpServers": {
>     "plugin-api": {
>       "command": "${CLAUDE\_PLUGIN\_ROOT}/servers/api-server",
>       "args": \["\--port", "8080"\]
>     }
>   }
> }

**[12]** https://modelcontextprotocol.io/specification/2025-11-25/basic/transports lines 192-195 (Transports), read 2026-10-19
> **Servers** wanting to support older clients should:
>
> -   Continue to host both the SSE and POST endpoints of the old transport, alongside the new “MCP endpoint” defined for the Streamable HTTP transport.
>     -   It is also possible to combine the old POST endpoint and the new MCP endpoint, but this may introduce unneeded complexity.

**[13]** https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/mcp-integration/SKILL.md line 718 (Implementation Workflow), read 2026-10-19
> Focus on stdio for custom/local servers, SSE for hosted services with OAuth.
<!-- research:appendix:end -->
