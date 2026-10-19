# Charter: Streamable HTTP vs HTTP+SSE for a new Claude Code plugin MCP server

## Question
Which MCP transport should a new Claude Code plugin's MCP server use: Streamable HTTP or the older HTTP+SSE?

## Decider and use
A plugin developer choosing the transport for a new server. A finding that Claude Code drops or requires something specific would change the choice.

## Deliverable
Brief, draft.md rendered to report.md, one to two pages, with a recommendation.

## Depth and budget
Fast. 2 scouts, 2 searches and 3 extractions each, no extra waves.

## Lenses or entities
1. MCP spec status
   - Requirements: What is the status of HTTP+SSE in the current MCP spec? Which revision introduced Streamable HTTP? What does the spec say about backward compatibility with HTTP+SSE?
   - Preferred sources: modelcontextprotocol.io transports pages (latest and 2025-03-26/2025-11-25)
2. Claude Code plugin support
   - Requirements: Which transports does Claude Code support and recommend (http, sse, stdio)? Is SSE deprecated in Claude Code docs? What is the plugin .mcp.json syntax for an http server?
   - Preferred sources: code.claude.com/docs (mcp, plugins reference), anthropics/claude-code repo plugin-dev mcp-integration skill

## Freshness
2025-2026; latest revision preferred.

## Source policy
Primary first (spec, official docs). Blogs only as supporting leads.

## Out of scope
Auth, SDK benchmarks, Claude Desktop.

## Stop conditions
Scout stops when requirements have quotes or gaps. Run stops after wave 1.

## Assumptions
Scope card accepted as recommended. Stdio noted only in passing.

## Steering log
- 2026-10-20 scope accepted by user.
- 2026-10-20 gate: both lenses answered; one gap (plugins-reference MCP syntax quote) left open, fast depth allows no extra wave. Proceed to synthesis.
