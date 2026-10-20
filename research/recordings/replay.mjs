#!/usr/bin/env node
// Replays recorded reality against today's code. Exit 0 means no drift.
//   node recordings/replay.mjs [fixtures-dir]
// The fixtures were cut from real runs (2026-10-19/20): lines of real documents with the quotes they cite,
// real page quotes with the verdict a person agreed with, and a two-entity excerpt of a real corpus.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const fx = path.resolve(process.argv[2] || path.join(here, 'fixtures'));
const { verifyDoc, isThin } = await import(path.join(root, 'scripts/lib/doc.mjs'));
let failed = 0;
const report = (name, bad) => { console.log(`${bad.length ? 'FAIL' : 'PASS'}  ${name}`); for (const b of bad) console.log(`        ${b}`); failed += bad.length ? 1 : 0; };
const json = (f) => JSON.parse(fs.readFileSync(path.join(fx, f), 'utf8'));

// 1. A sentence cites a quote that does not state its number.
{
  const bad = [];
  for (const r of json('number-in-quote.json')) {
    const byId = new Map(Object.entries(r.quotes));
    const got = verifyDoc(`# T\n\n${r.line}\n`, new Set(byId.keys()), byId).mismatch.flatMap((m) => m.numbers);
    if (JSON.stringify(got) !== JSON.stringify(r.mismatch)) bad.push(`expected ${JSON.stringify(r.mismatch)} got ${JSON.stringify(got)} for: ${r.line.slice(0, 90)}`);
  }
  report('wrong number cited', bad);
}

// 2. A quote that is only links must be recognised, a plain fact must not.
report('link-only quote', json('thin-quotes.json').filter((r) => isThin(r.quote) !== r.thin).map((r) => `${r.id} expected thin=${r.thin}: ${r.quote.replace(/\s+/g, ' ').slice(0, 80)}`));

// 3. A research folder with a TBD, a dead link, a blank cell, a missing comparison file or a vague gap.
{
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'research-replay-'));
  const run = path.join(proj, 'research', 'corpus-2x2');
  fs.mkdirSync(path.dirname(run), { recursive: true });
  fs.cpSync(path.join(fx, 'corpus-2x2'), run, { recursive: true });
  const verify = () => { try { return execFileSync('node', [path.join(root, 'bin/rpp'), 'verify', 'research/corpus-2x2'], { cwd: proj, encoding: 'utf8' }); } catch (e) { return e.stdout; } };
  const diff = (name, got, file) => {
    const want = fs.readFileSync(path.join(fx, file), 'utf8');
    report(name, got === want ? [] : ['--- expected', ...want.trimEnd().split('\n'), '--- got', ...got.trimEnd().split('\n')]);
  };
  diff('broken folder: clean excerpt passes', verify(), 'corpus-clean.expected.txt');
  const add = (rel, text) => fs.appendFileSync(path.join(run, rel), text);
  add('compare/speed.md', '\n\nCold-start numbers: TBD.\n\n| Entity | Value |\n|---|---|\n| node:test |  |\n\n- Cold start: insufficient evidence.\n');
  add('entities/vitest.md', '\nSee also [raw notes](notes/missing-file.md).\n');
  fs.writeFileSync(path.join(run, 'charter.md'), fs.readFileSync(path.join(run, 'charter.md'), 'utf8').replace('Axes: esm-ts, speed', 'Axes: esm-ts, speed, cost'));
  diff('broken folder: five seeded defects found', verify(), 'corpus-seeded.expected.txt');
  fs.rmSync(proj, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} check(s) drifted` : '\nno drift');
process.exit(failed ? 1 : 0);
