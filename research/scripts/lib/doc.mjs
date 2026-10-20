// Mechanical document checks: citation IDs resolve, numeric claims are cited, references render.
export const ID_RE = /E-[0-9a-f]{6}/g;
const HAS_ID = /E-[0-9a-f]{6}/;
const APPENDIX_START = '<!-- research:appendix:start -->';
const APPENDIX_END = '<!-- research:appendix:end -->';

// Numbers, versions, years, prices, percentages and sized quantities need a citation. A bare integer after a
// product name ("Node 22") is not matched: on the finished runs it flagged mostly scope statements about the
// user's own project, so this gate is a floor and the auditor covers the rest.
const NUMBERS = /\$\s?\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?\s?%|(?<![\d.])v?\d+\.\d+(?:\.\d+)*\b|\b(?:19|20)\d{2}\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s?(?:ms|sec|seconds|minutes|hours|days|kb|mb|gb|tb|x|requests|users|stars|tokens)\b/gi;
const claimTokens = (s) => [...s.matchAll(NUMBERS)].map((m) => m[0]);
// Quantities written as words: "three times faster", "fifty percent", "fifteen dollars".
const SPOKEN = /\b(?:(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|hundred|thousand|million|billion|dozens?|half|double|triple|twice)\s+(?:times|percent|dollars?|euros?|cents?|milliseconds?)|\w+\s+times\s+(?:as\s+)?(?:fast|faster|slow|slower|cheap|cheaper|large|larger|small|smaller|more|less|many|much)|twice\s+as\s+\w+)\b/i;
const EXEMPT_SENTENCE = /\bunverified\b|\bnot established\b|\bno public data\b|\binsufficient evidence\b|\bunknown\b|\bunclear\b|\bnot (?:shown|stated|published)\b/i;
// A number the sources do not state is fine when the sentence says it was worked out.
const DERIVED = /\b(?:inferred?|inference|computed|calculated|derived|estimated?|approximately|roughly|probably|likely|presumably)\b|~\s?\d/i;
const EXEMPT_SECTION = /gap|not established|open (?:question|decision)|limitation|assumption|methodology|scope/i;

const hasClaim = (s) => claimTokens(s).length > 0 || SPOKEN.test(s);
const digitRuns = (s) => (s.match(/\d[\d,]*(?:\.\d+)*/g) || []).map((n) => n.replace(/,/g, ''));
const norm = (s) => s.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');

// Numbers in a sentence that none of its cited quotes states. A longer version in the quote ("22.12")
// supports a shorter claim ("22"); a different number does not.
function missingNumbers(unit, quotesText) {
  const found = [];
  for (const tok of claimTokens(unit)) {
    for (const n of digitRuns(tok)) {
      const re = new RegExp(`(?<![\\d.])${n.replace(/\./g, '\\.')}(?!\\d)`);
      if (!quotesText.some((q) => re.test(q)) && !found.includes(n)) found.push(n);
    }
  }
  return found;
}

// Page chrome: a quote that is mostly link or image markup with little prose proves only that the page
// contains links ("[v5.0.5](…) [Latest](…)"). Terse plain facts such as "Version: 30.5" are not thin.
export function isThin(raw) {
  const quote = String(raw).slice(0, 20000);
  const markup = (quote.match(/!\[[^\]\n]{0,300}\]\([^)\n]{0,500}\)|\[[^\]\n]{0,300}\]\([^)\n]{0,500}\)|https?:\/\/\S+/g) || []).join('').length;
  const unlinked = quote.replace(/!\[[^\]\n]{0,300}\]\([^)\n]{0,500}\)/g, ' ').replace(/\[([^\]\n]{0,300})\]\([^)\n]{0,500}\)/g, ' $1 ').replace(/https?:\/\/\S+/g, ' ');
  if (/\b\d{4}-\d{2}-\d{2}\b/.test(unlinked)) return false; // a dated release heading states something
  const words = (unlinked.replace(/[#*_`>|~\\-]+/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'.:@/-]*/gu) || []).length;
  return words === 0 || (markup / (quote.length || 1) >= 0.5 && words < 8);
}

export function stripAppendix(text) {
  const a = text.indexOf(APPENDIX_START);
  const b = text.indexOf(APPENDIX_END);
  if (a === -1 || b === -1 || b < a) return text;
  return (text.slice(0, a).replace(/\s+$/, '') + '\n' + text.slice(b + APPENDIX_END.length).replace(/^\s+/, '')).replace(/\s+$/, '') + '\n';
}

// byId maps an evidence ID to its ledger row. With it, verifyDoc also reports cited numbers that the cited
// quotes do not state (mismatch) and citations of page-chrome quotes (thin). Without it only the cheap checks run.
export function verifyDoc(text, known, byId = new Map()) {
  const lines = stripAppendix(text).split('\n');
  const unknown = new Map();
  const cited = new Set();
  const uncited = [];
  const mismatch = [];
  const thin = new Map();
  let fence = false;
  let front = false;
  let exemptSection = false;
  lines.forEach((rawLine, i) => {
    const ln = rawLine.length > 5000 ? rawLine.slice(0, 5000) : rawLine; // a longer line is not prose
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
      const q = byId.get(id);
      if (q && !thin.has(id) && isThin(q.quote)) thin.set(id, i + 1);
    }
    if (exemptSection) return;
    // A citation written after the full stop ("… default. [E-a1b2c3]") belongs to the sentence before it.
    const joined = ln.replace(/([.!?])\s+(?=\[\s*E-[0-9a-f]{6})/g, '$1');
    const units = joined.trim().startsWith('|') ? [joined] : joined.split(/(?<=[.!?])\s+(?=[A-Z"“(\[*])/);
    for (const u of units) {
      // Link targets and bare URLs are not prose: a version or percent sign inside one is not a claim.
      const bare = u.replace(/E-[0-9a-f]{6}/g, '').replace(/\]\([^)\n]{0,500}\)/g, ']').replace(/https?:\/\/\S+/g, ' ');
      if (!HAS_ID.test(u)) {
        if (hasClaim(bare) && !EXEMPT_SENTENCE.test(u)) uncited.push({ line: i + 1, text: u.trim().slice(0, 140) });
        continue;
      }
      if (DERIVED.test(u) || EXEMPT_SENTENCE.test(u)) continue;
      // The source's URL and title count as text it states: "the 2025-03-26 spec says …" is attributed by the URL.
      const texts = (u.match(ID_RE) || []).filter((id) => byId.has(id)).map((id) => { const q = byId.get(id); return norm(`${q.quote} ${q.url || ''} ${q.title || ''}`); });
      if (!texts.length) continue;
      const numbers = missingNumbers(norm(bare), texts);
      if (numbers.length) mismatch.push({ line: i + 1, numbers, ids: [...new Set(u.match(ID_RE))], text: u.trim().slice(0, 140) });
    }
  });
  return {
    cited: [...cited],
    unknown: [...unknown].map(([id, line]) => ({ id, line })),
    uncited,
    mismatch,
    thin: [...thin].map(([id, line]) => ({ id, line })),
  };
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
