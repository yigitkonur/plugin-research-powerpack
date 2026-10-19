// Mechanical document checks: citation IDs resolve, numeric claims are cited, references render.
export const ID_RE = /E-[0-9a-f]{6}/g;
const HAS_ID = /E-[0-9a-f]{6}/;
const APPENDIX_START = '<!-- research:appendix:start -->';
const APPENDIX_END = '<!-- research:appendix:end -->';

// Numbers, versions, years, prices, percentages and sized quantities need a citation.
const CLAIM = /(\$\s?\d|\d\s?%|\bv?\d+\.\d+(?:\.\d+)?\b|\b(?:19|20)\d{2}\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s?(?:ms|sec|seconds|minutes|hours|days|kb|mb|gb|tb|x|requests|users|stars|tokens)\b)/i;
const EXEMPT_SENTENCE = /\bunverified\b|\bnot established\b|\bno public data\b|\binsufficient evidence\b/i;
const EXEMPT_SECTION = /gap|not established|open (?:question|decision)|limitation|assumption|methodology|scope/i;

export function stripAppendix(text) {
  const a = text.indexOf(APPENDIX_START);
  const b = text.indexOf(APPENDIX_END);
  if (a === -1 || b === -1 || b < a) return text;
  return (text.slice(0, a).replace(/\s+$/, '') + '\n' + text.slice(b + APPENDIX_END.length).replace(/^\s+/, '')).replace(/\s+$/, '') + '\n';
}

export function verifyDoc(text, known) {
  const lines = stripAppendix(text).split('\n');
  const unknown = new Map();
  const cited = new Set();
  const uncited = [];
  let fence = false;
  let front = false;
  let exemptSection = false;
  lines.forEach((ln, i) => {
    if (i === 0 && ln.trim() === '---') { front = true; return; }
    if (front) { if (ln.trim() === '---') front = false; return; }
    if (/^\s*```/.test(ln)) { fence = !fence; return; }
    if (fence) return;
    const heading = /^#{1,6}\s+(.*)/.exec(ln);
    if (heading) { exemptSection = EXEMPT_SECTION.test(heading[1]); return; }
    if (/^\s*>/.test(ln) || /^[\s|:-]+$/.test(ln) || !ln.trim()) return;
    for (const id of ln.match(ID_RE) || []) {
      cited.add(id);
      if (!known.has(id) && !unknown.has(id)) unknown.set(id, i + 1);
    }
    if (exemptSection) return;
    const units = ln.trim().startsWith('|') ? [ln] : ln.split(/(?<=[.!?])\s+(?=[A-Z"“(\[*])/);
    for (const u of units) {
      if (CLAIM.test(u.replace(/E-[0-9a-f]{6}/g, '')) && !HAS_ID.test(u) && !EXEMPT_SENTENCE.test(u)) {
        uncited.push({ line: i + 1, text: u.trim().slice(0, 140) });
      }
    }
  });
  return { cited: [...cited], unknown: [...unknown].map(([id, line]) => ({ id, line })), uncited };
}

const CITE_GROUP = /\[\s*(E-[0-9a-f]{6}(?:\s*[,;]\s*E-[0-9a-f]{6})*)\s*\]/g;

const quoteBlock = (q) => q.split('\n').map((l) => `> ${l}`.trimEnd()).join('\n');
const where = (q) => {
  const l = q.locator || {};
  const range = l.start_line == null ? '' : l.end_line && l.end_line !== l.start_line ? ` lines ${l.start_line}-${l.end_line}` : ` line ${l.start_line}`;
  return `${q.url}${range}${l.heading ? ` (${l.heading})` : ''}, read ${String(q.ts).slice(0, 10)}`;
};

// mode "numbered": [E-id] becomes [n] and the appendix is keyed by number (a deliverable).
// mode "ids": the text keeps its IDs and only the appendix is added or refreshed (a note).
export function renderDoc(text, byId, mode) {
  const body = stripAppendix(text);
  const order = [];
  for (const id of body.match(ID_RE) || []) if (!order.includes(id)) order.push(id);
  const known = order.filter((id) => byId.has(id));
  const missing = order.filter((id) => !byId.has(id));
  const num = new Map(known.map((id, i) => [id, i + 1]));

  let out = body;
  if (mode === 'numbered') {
    out = out.replace(CITE_GROUP, (m, grp) => {
      const ids = grp.split(/[,;]\s*/).map((s) => s.trim());
      return '[' + ids.map((id) => (num.has(id) ? num.get(id) : id)).join(', ') + ']';
    });
    out = out.replace(ID_RE, (id) => (num.has(id) ? `[${num.get(id)}]` : id));
  }
  const entries = known.map((id) => {
    const q = byId.get(id);
    const label = mode === 'numbered' ? `[${num.get(id)}]` : id;
    return `**${label}** ${where(q)}\n${quoteBlock(q.quote)}`;
  });
  const heading = mode === 'numbered' ? '## References and evidence' : '## Evidence';
  const appendix = entries.length ? `\n${APPENDIX_START}\n${heading}\n\n${entries.join('\n\n')}\n${APPENDIX_END}\n` : '';
  return { text: out.replace(/\s+$/, '') + '\n' + appendix, count: known.length, missing };
}
