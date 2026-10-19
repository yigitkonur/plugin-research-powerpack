// Evidence ledger: every verified quote gets a stable content-addressed ID.
// Files (one directory per run, or one per project for quick asks):
//   calls/<ts>-<tool>-<id>.json   raw structured output, one file per call (no write contention)
//   quotes.jsonl                  one row per verified quote
//   attempts.jsonl                one row per URL extract attempt (the server allows two per URL)
//   sources.jsonl                 search leads
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { config } from './config.mjs';

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

// Where evidence goes: an explicit run, the active run of this project, or a per-project cache.
export function resolveLedger({ cwd, run } = {}) {
  if (run) {
    const runDir = path.resolve(cwd || process.cwd(), run);
    return { runDir, dir: path.join(runDir, 'evidence') };
  }
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

export const quotes = (dir) => readJsonl(path.join(dir, 'quotes.jsonl'));
export const sources = (dir) => readJsonl(path.join(dir, 'sources.jsonl'));

// Extract attempts are claimed with exclusive file creation, so parallel agents cannot exceed the cap:
// attempts/<sha1(url)>.<n> exists once the nth attempt for that URL has been claimed.
const ATTEMPT_CAP = 2;
const attemptsDir = (dir) => path.join(dir, 'attempts');

export function attemptCounts(dir) {
  const m = new Map();
  let names = [];
  try { names = fs.readdirSync(attemptsDir(dir)); } catch { return m; }
  for (const n of names) {
    try {
      const { url } = JSON.parse(fs.readFileSync(path.join(attemptsDir(dir), n), 'utf8'));
      if (url) m.set(url, (m.get(url) || 0) + 1);
    } catch { /* partially written claim: ignore */ }
  }
  return m;
}

// Claim one attempt per distinct URL. Returns the URLs that were already at the cap; in that case
// nothing is kept, so a refused call does not consume attempts.
export function claimAttempts(dir, urls, id) {
  fs.mkdirSync(attemptsDir(dir), { recursive: true });
  const ts = new Date().toISOString();
  const made = [];
  const capped = [];
  for (const url of new Set(urls)) {
    const h = sha1(url);
    let ok = false;
    for (let n = 1; n <= ATTEMPT_CAP && !ok; n++) {
      const f = path.join(attemptsDir(dir), `${h}.${n}`);
      try {
        const fd = fs.openSync(f, 'wx');
        fs.writeSync(fd, JSON.stringify({ url, ts, id: id || null }));
        fs.closeSync(fd);
        made.push(f);
        ok = true;
      } catch (e) {
        if (e.code !== 'EEXIST') throw e;
      }
    }
    if (!ok) capped.push(url);
  }
  if (capped.length) for (const f of made) fs.rmSync(f, { force: true });
  return capped;
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
    urls_at_attempt_cap: [...att].filter(([, n]) => n >= 2).map(([u]) => u),
  };
}
