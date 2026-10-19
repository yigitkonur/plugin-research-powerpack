// Research runs: <output_dir>/<slug>/ with state.json, charter.md, notes/, evidence/, ...
// <output_dir>/.active holds the slug of the run in progress so hooks can find it.
import fs from 'node:fs';
import path from 'node:path';
import { verifyDoc } from './doc.mjs';
import { outputRoot, quotes, SLUG_RE } from './ledger.mjs';
import { structureProblems } from './structure.mjs';

export const PHASES = ['charter', 'research', 'synthesis', 'audit', 'finalizing', 'done'];
export const TYPES = ['report', 'brief', 'corpus'];
export const DEPTHS = ['fast', 'standard', 'exhaustive'];
const DEFAULT_NEXT = {
  charter: 'write charter.md',
  research: 'dispatch or gate the scouts',
  synthesis: 'write the deliverable from the notes',
  audit: 'run rpp verify, dispatch the auditor, write audit.md',
  finalizing: 'render the deliverable, write README.md, mark done',
  done: '-',
};

const stateFile = (runDir) => path.join(runDir, 'state.json');
const activeFile = (cwd) => path.join(outputRoot(cwd), '.active');

export function readState(runDir) {
  try { return JSON.parse(fs.readFileSync(stateFile(runDir), 'utf8')); } catch { return null; }
}

function writeState(runDir, s) {
  s.updated = new Date().toISOString();
  fs.writeFileSync(stateFile(runDir), JSON.stringify(s, null, 2) + '\n');
}

export const outputIsPlugin = (cwd) => fs.existsSync(path.join(outputRoot(cwd), '.claude-plugin'));

export function listRuns(cwd) {
  const out = outputRoot(cwd);
  let active = null;
  try { active = fs.readFileSync(activeFile(cwd), 'utf8').trim(); } catch { /* none */ }
  let names = [];
  try { names = fs.readdirSync(out, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { /* none */ }
  return names
    .map((slug) => ({ slug, dir: path.join(out, slug), state: readState(path.join(out, slug)), active: slug === active }))
    .filter((r) => r.state)
    .sort((a, b) => String(b.state.updated).localeCompare(String(a.state.updated)));
}

export const activeRun = (cwd) => listRuns(cwd).find((r) => r.active) || null;

// Accept a slug, a run directory, or any path inside one. Only runs directly under the output
// directory count, so a stray state.json elsewhere in a repository is never treated as a run.
export function resolveRun(arg, cwd) {
  if (!arg) return activeRun(cwd);
  const out = outputRoot(cwd);
  const candidates = [path.join(out, arg), path.resolve(cwd || process.cwd(), arg)];
  for (const c of candidates) {
    const run = runOfPath(c, cwd);
    if (run) return { slug: path.basename(run), dir: run, state: readState(run) };
  }
  return null;
}

// Walk up from a file or directory to the run folder: a direct child of the output directory
// that holds state.json. Returns null for anything outside the output directory.
export function runOfPath(p, cwd) {
  let d;
  try { d = fs.realpathSync(p); } catch { try { d = path.join(fs.realpathSync(path.dirname(p)), path.basename(p)); } catch { return null; } }
  try { if (!fs.statSync(d).isDirectory()) d = path.dirname(d); } catch { d = path.dirname(d); }
  const out = outputRoot(cwd);
  for (let i = 0; i < 8 && d.startsWith(out + path.sep); i++) {
    if (path.dirname(d) === out) return SLUG_RE.test(path.basename(d)) && fs.existsSync(stateFile(d)) ? d : null;
    d = path.dirname(d);
  }
  return null;
}

// Text that came from files in a repository is data, not instructions. Strip control characters
// and cap the length before it is shown to a model.
export const clean = (s, n = 120) => String(s ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, n);
export const safePhase = (s) => (PHASES.includes(s) ? s : 'unknown');
export const safeType = (s) => (TYPES.includes(s) ? s : 'unknown');
export const safeDepth = (s) => (DEPTHS.includes(s) ? s : 'unknown');

export function initRun({ cwd, slug, topic, type = 'report', depth = 'standard' }) {
  if (!SLUG_RE.test(slug || '')) throw new Error(`slug must be kebab-case (a-z, 0-9, -), got "${slug}"`);
  if (!TYPES.includes(type)) throw new Error(`type must be one of ${TYPES.join(', ')}`);
  if (!DEPTHS.includes(depth)) throw new Error(`depth must be one of ${DEPTHS.join(', ')}`);
  if (outputIsPlugin(cwd)) throw new Error(`the output directory ${outputRoot(cwd)} is a plugin source folder (it holds .claude-plugin). Set output_dir to another name, for example research-runs, with /plugin configure research`);
  const dir = path.join(outputRoot(cwd), slug);
  if (fs.existsSync(dir)) throw new Error(`run already exists: ${dir} (resume it instead)`);
  const subdirs = ['notes', 'evidence', ...(type === 'corpus' ? ['entities', 'compare'] : [])];
  for (const s of subdirs) fs.mkdirSync(path.join(dir, s), { recursive: true });
  const now = new Date().toISOString();
  writeState(dir, { slug, topic: topic || slug, type, depth, phase: 'charter', created: now, next: 'write charter.md', waves: 0 });
  fs.writeFileSync(activeFile(cwd), slug + '\n');
  return dir;
}

export function setPhase(runDir, phase, { next, waves } = {}, cwd) {
  if (!PHASES.includes(phase)) throw new Error(`phase must be one of ${PHASES.join(', ')}`);
  const s = readState(runDir);
  if (!s) throw new Error(`no state.json in ${runDir}`);
  s.phase = phase;
  s.next = next !== undefined ? next : DEFAULT_NEXT[phase];
  if (waves !== undefined) s.waves = Number(waves);
  writeState(runDir, s);
  const af = activeFile(cwd);
  if (phase === 'done') {
    try { if (fs.readFileSync(af, 'utf8').trim() === s.slug) fs.rmSync(af); } catch { /* none */ }
  } else {
    fs.writeFileSync(af, s.slug + '\n');
  }
  return s;
}

// Citation and structure problems in a run's documents. Used by `rpp verify <run>` and by the phase gate.
export function checkRun(runDir) {
  const problems = [];
  const byId = new Map(quotes(path.join(runDir, 'evidence')).map((q) => [q.id, q]));
  const known = new Set(byId.keys());
  const docs = ['draft.md', 'summary.md'];
  for (const d of ['compare', 'entities']) {
    try { for (const f of fs.readdirSync(path.join(runDir, d))) if (f.endsWith('.md')) docs.push(path.join(d, f)); } catch { /* none */ }
  }
  for (const rel of docs) {
    let text;
    try { text = fs.readFileSync(path.join(runDir, rel), 'utf8'); } catch { continue; }
    const r = verifyDoc(text, known, byId);
    for (const u of r.unknown) problems.push(`${rel} line ${u.line}: ${u.id} is not in the ledger`);
    if (r.uncited.length) problems.push(`${rel}: ${r.uncited.length} uncited numeric claim(s), first at line ${r.uncited[0].line}: "${r.uncited[0].text.slice(0, 80)}"`);
    for (const m of r.mismatch) problems.push(`${rel} line ${m.line}: ${m.numbers.join(', ')} not stated by the cited quote(s) ${m.ids.join(' ')}; cite the quote that states it or mark the number inferred or computed`);
  }
  problems.push(...structureProblems(runDir));
  return problems;
}

// Mechanical gate for entering "finalizing" or "done": a passing audit verdict, clean citations and structure.
export function gateProblems(runDir, phase) {
  const problems = [];
  if (auditVerdict(runDir) !== 'pass') problems.push('audit.md is missing or has no "Verdict: pass" line');
  problems.push(...checkRun(runDir));
  if (phase === 'done') {
    const type = (readState(runDir) || {}).type;
    const want = type === 'corpus' ? ['summary.md', 'README.md'] : ['report.md', 'README.md'];
    for (const f of want) if (!fs.existsSync(path.join(runDir, f))) problems.push(`${f} has not been written`);
  }
  return problems;
}

export function auditVerdict(runDir) {
  try {
    const t = fs.readFileSync(path.join(runDir, 'audit.md'), 'utf8');
    const m = /^verdict:\s*(pass|fail)/im.exec(t);
    return m ? m[1].toLowerCase() : 'unknown';
  } catch { return 'missing'; }
}
