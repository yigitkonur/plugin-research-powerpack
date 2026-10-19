// Shared by the PostToolUse hook and the rpp CLI: persist a call, index quotes, render compactly.
import { attemptCounts, recordCall } from './ledger.mjs';
import { compact } from './render.mjs';

export function parseStructured(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    if (raw.structuredContent) return raw.structuredContent;
    if (raw.schema_version) return raw;
    if (Array.isArray(raw.content)) return parseStructured(raw.content);
    return null;
  }
  if (Array.isArray(raw)) {
    for (const b of raw) {
      const p = b && b.type === 'text' ? parseStructured(b.text) : null;
      if (p) return p;
    }
    return null;
  }
  if (typeof raw === 'string' && raw.trimStart().startsWith('{')) {
    try { return parseStructured(JSON.parse(raw)); } catch { return null; }
  }
  return null;
}

export function ingest(dir, tool, input, structured, meta, opts) {
  const { added } = recordCall(dir, tool, input, structured, meta);
  const text = compact(tool, structured, attemptCounts(dir), opts);
  return { added, text };
}
