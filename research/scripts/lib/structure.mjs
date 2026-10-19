// Structure checks for a finished run, the mechanical part of what a reader would trip over:
// placeholder text, junk files, broken relative links, blank table cells, vague gaps, and (for a corpus)
// an entity note and a comparison file for everything the charter names.
import fs from 'node:fs';
import path from 'node:path';
import { stripAppendix } from './doc.mjs';

const PLACEHOLDER = /\b(?:TODO|TBD|FIXME|fill later|lorem ipsum)\b|\?\?\?|<placeholder>/i;
const JUNK = /^(?:\.DS_Store|Thumbs\.db|.*\.(?:tmp|bak|orig|swp)|.*~)$/;
const GAP_MARKER = /no public data|unverified|unknown|n\/a|not stated|not published|gap|—|–/i;
const VAGUE_GAP = /insufficient evidence|more research (?:is )?needed|not enough (?:data|evidence)/i;
const SPECIFIC = /searched|checked|\bread\b|settle|resolve|would|because|paywall|gated|not published|no public|source|page|docs|release|tag/i;

export const slugOf = (s) => String(s).replace(/\([^)]*\)/g, ' ').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const listMd = (dir) => { try { return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f)); } catch { return []; } };

function walk(dir, out = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'evidence') walk(p, out); } else out.push(p);
  }
  return out;
}

// What the charter names: entities (numbered items under "Lenses or entities") and the `Axes:` line.
export function charterTargets(runDir) {
  let text = '';
  try { text = fs.readFileSync(path.join(runDir, 'charter.md'), 'utf8'); } catch { return { entities: [], axes: [] }; }
  const axesLine = /^\s*\**axes\**\s*:\s*(.+)$/im.exec(text);
  const axes = axesLine ? axesLine[1].replace(/\([^)]*\)/g, ' ').split(/[,;]/).map((a) => a.replace(/[.\s]+$/, '').trim()).filter(Boolean) : [];
  const section = text.split(/^##\s+/m).find((s) => /^lenses or entities/i.test(s)) || '';
  const entities = [...section.matchAll(/^\d+\.\s+(.+?)\s*$/gm)].map((m) => m[1]);
  return { entities, axes };
}

// Lines of a deliverable that are the author's own words: no code fences, quoted passages or evidence appendix.
function prose(file) {
  const out = [];
  let fence = false;
  stripAppendix(fs.readFileSync(file, 'utf8')).split('\n').forEach((ln, i) => {
    if (/^\s*```/.test(ln)) { fence = !fence; return; }
    if (fence || /^\s*>/.test(ln)) return;
    out.push({ n: i + 1, ln });
  });
  return out;
}

export function structureProblems(runDir) {
  const problems = [];
  const rel = (f) => path.relative(runDir, f);
  const state = (() => { try { return JSON.parse(fs.readFileSync(path.join(runDir, 'state.json'), 'utf8')); } catch { return {}; } })();

  for (const f of walk(runDir)) if (JUNK.test(path.basename(f))) problems.push(`${rel(f)}: junk file, delete it`);

  const docs = [
    ...['draft.md', 'summary.md', 'README.md'].map((f) => path.join(runDir, f)).filter((f) => fs.existsSync(f)),
    ...listMd(path.join(runDir, 'compare')), ...listMd(path.join(runDir, 'entities')),
  ];
  for (const f of docs) {
    for (const { n, ln } of prose(f)) {
      if (PLACEHOLDER.test(ln)) problems.push(`${rel(f)} line ${n}: placeholder text ("${ln.trim().slice(0, 60)}")`);
      for (const m of ln.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const target = m[1].split('#')[0].split('?')[0];
        if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
        if (!fs.existsSync(path.resolve(path.dirname(f), decodeURIComponent(target)))) problems.push(`${rel(f)} line ${n}: broken link to ${m[1]}`);
      }
      if (/^\s*\|/.test(ln) && !/^[\s|:-]+$/.test(ln)) {
        const cells = ln.trim().replace(/^\||\|$/g, '').split('|');
        if (cells.some((c) => !c.trim()) && !GAP_MARKER.test(ln)) problems.push(`${rel(f)} line ${n}: empty table cell; write "no public data" or "unverified"`);
      }
    }
    const lines = prose(f);
    lines.forEach(({ n, ln }, idx) => {
      if (!VAGUE_GAP.test(ln)) return;
      const around = lines.slice(idx, idx + 3).map((x) => x.ln).join(' ');
      if (!SPECIFIC.test(around)) problems.push(`${rel(f)} line ${n}: vague gap; say what was searched, which sources were checked and what would settle it`);
    });
  }

  if (state.type === 'corpus') {
    const { entities, axes } = charterTargets(runDir);
    for (const e of entities) if (!fs.existsSync(path.join(runDir, 'entities', `${slugOf(e)}.md`))) problems.push(`charter names entity "${e}" but entities/${slugOf(e)}.md does not exist`);
    for (const a of axes) {
      const file = path.join(runDir, 'compare', `${slugOf(a)}.md`);
      if (!fs.existsSync(file)) { problems.push(`charter names axis "${a}" but compare/${slugOf(a)}.md does not exist`); continue; }
      const text = fs.readFileSync(file, 'utf8').toLowerCase();
      for (const e of entities) {
        const name = e.replace(/\([^)]*\)/g, '').trim().toLowerCase();
        if (!text.includes(name) && !text.includes(slugOf(e))) problems.push(`compare/${slugOf(a)}.md never mentions entity "${e}"; give it a row or say there is no public data`);
      }
    }
  }
  return problems;
}
