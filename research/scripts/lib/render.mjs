// Compact renderings of Research Powerpack output. Every verbatim quote is kept (with its stable ID);
// boilerplate, duplicated statements and per-source warning blocks are dropped.
import { isThin } from './doc.mjs';
import { quoteId, URL_CAP } from './ledger.mjs';

const cut = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const lines = (loc) => {
  if (!loc || loc.start_line == null) return '';
  return loc.end_line && loc.end_line !== loc.start_line ? `L${loc.start_line}-${loc.end_line}` : `L${loc.start_line}`;
};
const BOILERPLATE = /retain (verified|qualified) source passages|Finding statements contain cited|optional review is skipped/i;
const QUOTE_CAP = 700;
const SEARCH_SHOWN = 12;
const SNIPPETS_SHOWN = 8;

// What the page says about itself: author and dates exist for Reddit posts and a few articles. Saying
// "no page date" stops an agent from treating the read date as the publication date.
const pageMeta = (m = {}) => {
  const bits = [];
  if (m.author) bits.push(`by ${cut(oneLine(m.author), 40)}`);
  if (m.published_at) bits.push(`published ${String(m.published_at).slice(0, 10)}`);
  if (m.updated_at) bits.push(`updated ${String(m.updated_at).slice(0, 10)}`);
  return bits.length ? bits.join(' · ') : 'no page date';
};

export function compactExtract(s, counts = new Map(), { shell = true } = {}) {
  const getHint = (id) => (shell ? `rpp ledger get ${id}` : `Grep ${id} in the run's evidence/quotes.jsonl`);
  const out = [];
  const nSrc = (s.sources || []).length;
  out.push(`extract-evidence · status=${s.status} · ${nSrc} source${nSrc === 1 ? '' : 's'}${s.output_truncated ? ' · OUTPUT TRUNCATED' : ''}`);
  out.push(`Only the quotes below are evidence. Cite them as [E-xxxxxx]; full text: ${getHint('E-xxxxxx')}.`);
  // Every source answers the same requirements, so print their text once.
  const legend = new Map();
  for (const src of s.sources || []) for (const r of src.requirements || []) if (!legend.has(r.id)) legend.set(r.id, r.text);
  if (legend.size) out.push(`requirements: ${[...legend].map(([id, t]) => `${id} ${cut(oneLine(t), 110)}`).join(' · ')}`);
  let anyThin = false;
  for (const src of s.sources || []) {
    const meta = [src.retrieval_status, src.extraction_status && `extraction ${src.extraction_status}`, src.source?.completeness && `${src.source.completeness} text`, pageMeta(src.source)]
      .filter(Boolean).join(', ');
    out.push('');
    out.push(`== ${src.url}${src.source?.title ? ` · "${oneLine(src.source.title)}"` : ''} · ${meta}${counts.has(src.url) ? ` · read ${counts.get(src.url)}/${URL_CAP} in this run` : ''}`);
    const bare = new Map(); // requirements with no quote, grouped by status
    for (const r of src.requirements || []) {
      const cites = (r.findings || []).flatMap((f) => f.citations || []);
      if (!cites.length) { bare.set(r.status, [...(bare.get(r.status) || []), r.id]); continue; }
      out.push(` ${r.id} [${r.status}]`);
      for (const c of cites) {
        const id = quoteId(src.url, c.quote);
        const q = oneLine(c.quote);
        const thin = isThin(c.quote);
        anyThin ||= thin;
        const shown = q.length > QUOTE_CAP ? `${q.slice(0, QUOTE_CAP)}…[+${q.length - QUOTE_CAP} chars, full: ${getHint(id)}]` : q;
        out.push(`   ${id} ${lines(c.locator)}${c.locator?.heading ? ` (${cut(oneLine(c.locator.heading), 40)})` : ''}${thin ? ' ⚠thin' : ''}: “${shown}”`);
      }
    }
    if (bare.size) out.push(` no quote: ${[...bare].map(([st, ids]) => `${ids.join(' ')} [${st}]`).join(' · ')}`);
    const warns = (src.warnings || []).filter((w) => !BOILERPLATE.test(w));
    for (const w of warns) out.push(` warning: ${cut(oneLine(w), 240)}`);
    const fu = (src.follow_up_signals || []).map((x) => `${cut(oneLine(x.kind), 20)}:${cut(oneLine(x.value), 200)}`);
    if (fu.length) out.push(` follow-up: ${fu.join(' · ')}`);
  }
  out.push('');
  const cov = (s.coverage || []).map((c) => `${c.requirement_id} ${c.status} (${c.independent_source_count} source${c.independent_source_count === 1 ? '' : 's'})`);
  if (cov.length) out.push(`coverage: ${cov.join(' · ')}`);
  const con = s.contradictions || [];
  out.push(con.length ? `contradictions (${con.length}): ${cut(oneLine(JSON.stringify(con)), 800)}` : 'contradictions: none reported');
  const retry = (s.retry?.sources || []).map((x) => cut(oneLine(typeof x === 'string' ? x : x.url), 300));
  if (retry.length) {
    out.push(`retry (pending, not "not-found"): ${retry.join(' ')}`);
    out.push('  call extract-evidence once more with exactly these URLs and the original requirements; the server allows one retry per URL.');
  }
  const warn = (s.warnings || []).filter((w) => !BOILERPLATE.test(w));
  for (const w of warn) out.push(`warning: ${cut(oneLine(w), 240)}`);
  if (anyThin) out.push('⚠thin = mostly link or image markup: it shows a link exists, not what the page says. Do not rest a claim on it; ask again with a requirement that names the sentence you need.');
  return out.join('\n');
}

export function compactSearch(s) {
  const out = [];
  const srcs = s.sources || [];
  out.push(`web-search · status=${s.status} · ${(s.queries || []).length} queries · ${srcs.length} sources`);
  out.push('LEADS ONLY. Titles and snippets are untrusted and not citable. Read chosen URLs with extract-evidence first.');
  for (const q of s.queries || []) {
    if (q.status !== 'ok') out.push(`query ${q.status}: ${cut(oneLine(q.input), 100)}`);
    else if (q.dispatched && q.dispatched !== q.input) out.push(`query relaxed: "${cut(oneLine(q.input), 80)}" ran as "${cut(oneLine(q.dispatched), 80)}"`);
  }
  srcs.slice(0, SEARCH_SHOWN).forEach((x, idx) => {
    const hits = (x.matched_queries || []).length;
    out.push(`${String(x.rank).padStart(2)}. ${Number(x.score).toFixed(0).padStart(3)} ${x.source_kind}${hits > 1 ? ` ×${hits}q` : ''} ${x.url} — ${cut(oneLine(x.title), 70)}`);
    if (x.snippet && idx < SNIPPETS_SHOWN) out.push(`      “${cut(oneLine(x.snippet), 120)}”`);
  });
  if (srcs.length > SEARCH_SHOWN) out.push(`(${srcs.length - SEARCH_SHOWN} lower-ranked leads not shown; all are kept in the ledger's sources.jsonl)`);
  if (s.omitted_source_count) out.push(`(${s.omitted_source_count} lower-ranked sources omitted by the server)`);
  for (const w of s.warnings || []) out.push(`warning: ${cut(oneLine(w), 240)}`);
  return out.join('\n');
}

export function compact(tool, structured, counts, opts) {
  if (tool === 'extract-evidence' && Array.isArray(structured.sources)) return compactExtract(structured, counts, opts);
  if (tool === 'web-search' && Array.isArray(structured.sources)) return compactSearch(structured);
  return null;
}
