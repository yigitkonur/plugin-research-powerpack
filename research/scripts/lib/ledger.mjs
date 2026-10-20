// Evidence ledger: every verified quote gets a stable content-addressed ID.
// Files (one directory per run, or one per project for quick asks):
//   calls/<ts>-<tool>-<id>.json   raw structured output, one file per call (no write contention)
//   quotes.jsonl                  one row per verified quote
//   attempts/                     one claim file per extraction read of a URL (see below)
//   sources.jsonl                 search leads
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { config } from './config.mjs';
import { isThin } from './doc.mjs';

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
export const quoteId = (url, quote) => 'E-' + sha1(url + '\n' + quote).slice(0, 6);
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

// Hooks get CLAUDE_PROJECT_DIR. The CLI run from the Bash tool does not, and the model often cd's into a
// run folder, so walk up to the nearest ancestor whose output directory already holds runs.
export const projectRoot = (cwd) => {
  const env = process.env.CLAUDE_PROJECT_DIR;
  const start = env || cwd || process.cwd();
  let base;
  try { base = fs.realpathSync(start); } catch { base = start; }
  if (env) return base;
  const out = config().output_dir;
  let d = base;
  for (let i = 0; i < 8; i++) {
    try {
      const o = path.join(d, out);
      if (fs.existsSync(path.join(o, '.active')) || fs.readdirSync(o).some((n) => fs.existsSync(path.join(o, n, 'state.json')))) return d;
    } catch { /* not here, keep walking */ }
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return base;
};
export const outputRoot = (cwd) => path.resolve(projectRoot(cwd), config().output_dir);

// The run folder that contains cwd, if any: a model often cd's into the run, and a finished run has no
// .active pointer any more.
export function runDirOfCwd(cwd) {
  let d;
  try { d = fs.realpathSync(cwd || process.cwd()); } catch { return null; }
  const out = outputRoot(cwd);
  if (!d.startsWith(out + path.sep)) return null;
  const slug = path.relative(out, d).split(path.sep)[0];
  const runDir = path.join(out, slug);
  const stateFile = path.join(runDir, 'state.json');
  if (!SLUG_RE.test(slug) || !fs.existsSync(stateFile)) return null;
  try {
    const finished = JSON.parse(fs.readFileSync(stateFile, 'utf8')).phase === 'done';
    let active = '';
    try { active = fs.readFileSync(path.join(out, '.active'), 'utf8').trim(); } catch { /* none */ }
    if (finished && active && active !== slug) return null; // another run is in progress and owns new evidence
  } catch { /* unreadable state: treat the run as unfinished */ }
  return runDir;
}

// Where evidence goes: an explicit run, the run whose folder we are in, the active run of this project,
// or a per-project cache.
export function resolveLedger({ cwd, run } = {}) {
  if (run) {
    const runDir = path.resolve(cwd || process.cwd(), run);
    return { runDir, dir: path.join(runDir, 'evidence') };
  }
  const here = runDirOfCwd(cwd);
  if (here) return { runDir: here, dir: path.join(here, 'evidence') };
  const out = outputRoot(cwd);
  try {
    const slug = fs.readFileSync(path.join(out, '.active'), 'utf8').trim();
    const runDir = path.join(out, slug);
    if (SLUG_RE.test(slug) && fs.statSync(runDir).isDirectory()) return { runDir, dir: path.join(runDir, 'evidence') };
  } catch { /* no active run */ }
  const base = process.env.RESEARCH_LEDGER_DIR || path.join(os.homedir(), '.cache', 'claude-research', 'ledger');
  return { runDir: null, dir: path.join(base, sha1(projectRoot(cwd)).slice(0, 10)) };
}

const readJsonl = (file) => {
  try {
    return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => {
      try { return [JSON.parse(l)]; } catch { return []; }
    });
  } catch { return []; }
};

const appendJsonl = (file, rows) => {
  if (!rows.length) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
};

export const quotes = (dir) => {
  const seen = new Set();
  return readJsonl(path.join(dir, 'quotes.jsonl')).filter((q) => q.id && !seen.has(q.id) && seen.add(q.id));
};
export const sources = (dir) => readJsonl(path.join(dir, 'sources.jsonl'));

// The server's contract: "call again for the URLs in retry.sources … at most two total tool invocations per
// URL, including the first". That is a retry rule, so it caps repeats of the same questions on one URL.
// A different question on a page that was read fine is not a retry; a ceiling per URL keeps cost bounded.
// Both are claimed with exclusive file creation, so parallel agents cannot exceed them:
//   attempts/<sha1(url)>.<n>             the nth read of this URL in this run (any questions), n <= URL_CAP
//   attempts/<sha1(url)>.s<set>.<n>      the nth read of this URL with this exact requirement set, n <= SET_CAP
export const SET_CAP = 2;
export const URL_CAP = 4;
const attemptsDir = (dir) => path.join(dir, 'attempts');
// Claims and quotes in the per-project cache (quick questions, no run) expire: the same question weeks later
// is a new question, and a price or a version read then may no longer be true.
const QUICK_TTL_MS = 6 * 3600 * 1000;
export const isRunLedger = (dir) => path.basename(dir) === 'evidence';
export const freshTs = (dir, ts) => isRunLedger(dir) || !(Date.now() - Date.parse(ts) > QUICK_TTL_MS);
const freshFile = (dir, file) => {
  if (isRunLedger(dir)) return true;
  try { return Date.now() - fs.statSync(file).mtimeMs < QUICK_TTL_MS; } catch { return false; }
};
const reqSet = (reqs) => sha1([...new Set((reqs || []).map((r) => String(r).replace(/\s+/g, ' ').trim()))].sort().join('\n')).slice(0, 10);

// Reads per URL in this run (any questions).
export function attemptCounts(dir) {
  const m = new Map();
  let names = [];
  try { names = fs.readdirSync(attemptsDir(dir)); } catch { return m; }
  for (const n of names) {
    if (!/^[0-9a-f]{40}\.\d+$/.test(n) || !freshFile(dir, path.join(attemptsDir(dir), n))) continue;
    try {
      const { url } = JSON.parse(fs.readFileSync(path.join(attemptsDir(dir), n), 'utf8'));
      if (url) m.set(url, (m.get(url) || 0) + 1);
    } catch { /* partially written claim: ignore */ }
  }
  return m;
}

// Reads of this URL with exactly this requirement set.
export function setCount(dir, url, reqs) {
  let names = [];
  try { names = fs.readdirSync(attemptsDir(dir)); } catch { return 0; }
  const prefix = `${sha1(url)}.s${reqSet(reqs)}.`;
  return names.filter((n) => n.startsWith(prefix) && freshFile(dir, path.join(attemptsDir(dir), n))).length;
}

function claimOne(dir, file, body) {
  for (let tries = 0; tries < 2; tries++) {
    try {
      const fd = fs.openSync(file, 'wx');
      fs.writeSync(fd, JSON.stringify(body));
      fs.closeSync(fd);
      return true;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      if (freshFile(dir, file)) return false;
      fs.rmSync(file, { force: true }); // an expired claim: take its place
    }
  }
  return false;
}

// Claim one read per distinct URL. Returns { sameSet, ceiling }: the URLs whose same-question retries are
// used up, and the URLs at the per-URL ceiling. If either is non-empty nothing is kept, so a refused call
// consumes no attempts.
export function claimAttempts(dir, urls, reqs, id) {
  fs.mkdirSync(attemptsDir(dir), { recursive: true });
  const ts = new Date().toISOString();
  const key = reqSet(reqs);
  const made = [];
  const sameSet = [];
  const ceiling = [];
  const claim = (file, url) => { const ok = claimOne(dir, file, { url, ts, id: id || null }); if (ok) made.push(file); return ok; };
  try {
    for (const url of new Set(urls)) {
      const h = sha1(url);
      let okSet = false;
      for (let n = 1; n <= SET_CAP && !okSet; n++) okSet = claim(path.join(attemptsDir(dir), `${h}.s${key}.${n}`), url);
      if (!okSet) { sameSet.push(url); continue; }
      let okUrl = false;
      for (let n = 1; n <= URL_CAP && !okUrl; n++) okUrl = claim(path.join(attemptsDir(dir), `${h}.${n}`), url);
      if (!okUrl) ceiling.push(url);
    }
  } catch (e) {
    for (const f of made) fs.rmSync(f, { force: true });
    throw e;
  }
  if (sameSet.length || ceiling.length) for (const f of made) fs.rmSync(f, { force: true });
  return { sameSet, ceiling };
}

// Persist a call and index its quotes. Returns the IDs that were new to the ledger.
export function recordCall(dir, tool, input, structured, meta = {}) {
  const ts = new Date().toISOString();
  const tag = String(meta.id || crypto.randomBytes(4).toString('hex')).slice(-8);
  const callFile = `${ts.replace(/[:.]/g, '-')}-${tool}-${tag}.json`;
  fs.mkdirSync(path.join(dir, 'calls'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'calls', callFile), JSON.stringify({ tool, ts, input, output: structured, meta }));

  const added = [];
  if (tool === 'extract-evidence') {
    const have = new Set(quotes(dir).map((q) => q.id));
    const rows = [];
    for (const src of structured.sources || []) {
      for (const req of src.requirements || []) {
        for (const f of req.findings || []) {
          for (const c of f.citations || []) {
            const id = quoteId(src.url, c.quote);
            if (have.has(id)) continue;
            have.add(id);
            added.push(id);
            rows.push({
              id, url: src.url, title: src.source?.title || null, quote: c.quote, locator: c.locator || null,
              requirement: req.text, status: req.status, ts, call: callFile,
              ...(isThin(c.quote) ? { thin: true } : {}),
            });
          }
        }
      }
    }
    appendJsonl(path.join(dir, 'quotes.jsonl'), rows);
  } else if (tool === 'web-search') {
    appendJsonl(path.join(dir, 'sources.jsonl'), (structured.sources || []).map((s) => ({
      url: s.url, title: s.title, score: s.score, kind: s.source_kind, queries: s.matched_queries, ts,
    })));
  }
  return { added, callFile };
}

export const normId = (id) => 'E-' + String(id).replace(/^e-/i, '').toLowerCase();
export const getQuote = (dir, id) => quotes(dir).find((q) => q.id === normId(id));
export const findQuotes = (dir, text) => {
  const t = text.toLowerCase();
  return quotes(dir).filter((q) => (q.quote + ' ' + q.url + ' ' + (q.requirement || '')).toLowerCase().includes(t));
};

// What each agent did, from the stored calls: lets the orchestrator see a thin scout (few pages read,
// no quotes, everything not-found) before it reads the notes. Calls from the main thread have no agent.
export function agentStats(dir) {
  const by = new Map();
  let names = [];
  try { names = fs.readdirSync(path.join(dir, 'calls')); } catch { return []; }
  for (const n of names) {
    let c;
    try { c = JSON.parse(fs.readFileSync(path.join(dir, 'calls', n), 'utf8')); } catch { continue; }
    const key = c.meta?.agent_id || c.meta?.agent || 'main';
    const a = by.get(key) || { agent: c.meta?.agent || 'main', agent_id: c.meta?.agent_id || null, searches: 0, extracts: 0, urls: new Set(), quotes: new Set(), results: 0, not_found: 0 };
    if (c.tool === 'web-search') a.searches++;
    if (c.tool === 'extract-evidence') {
      a.extracts++;
      for (const u of c.input?.urls || []) a.urls.add(u);
      for (const s of c.output?.sources || []) for (const r of s.requirements || []) {
        a.results++;
        if (r.status === 'not-found') a.not_found++;
        for (const f of r.findings || []) for (const q of f.citations || []) a.quotes.add(quoteId(s.url, q.quote));
      }
    }
    by.set(key, a);
  }
  return [...by.values()].map((a) => ({
    agent: a.agent, agent_id: a.agent_id, searches: a.searches, extracts: a.extracts, urls_read: a.urls.size,
    quotes: a.quotes.size, not_found_share: a.results ? Math.round((100 * a.not_found) / a.results) / 100 : null,
  }));
}

export function stats(dir) {
  const q = quotes(dir);
  const calls = (() => { try { return fs.readdirSync(path.join(dir, 'calls')).length; } catch { return 0; } })();
  const att = attemptCounts(dir);
  return {
    dir,
    calls,
    quotes: q.length,
    sources_with_quotes: new Set(q.map((x) => x.url)).size,
    urls_attempted: att.size,
    urls_at_read_ceiling: [...att].filter(([, n]) => n >= URL_CAP).map(([u]) => u),
  };
}
