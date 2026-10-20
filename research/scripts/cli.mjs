// rpp: direct CLI for the Research Powerpack MCP. Same server, same ledger as the plugin hooks.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { callTool, endpoint, initialize, listTools, readResource } from './lib/mcp.mjs';
import { config, configSources } from './lib/config.mjs';
import { guard } from './lib/budget.mjs';
import { agentStats, findQuotes, getQuote, projectRoot, quotes, resolveLedger, stats } from './lib/ledger.mjs';
import { ingest, parseStructured } from './lib/pipeline.mjs';
import { auditVerdict, checkRun, clean, gateProblems, thinWarnings, initRun, listRuns, outputIsPlugin, resolveRun, runOfPath, safeDepth, safePhase, safeType, setPhase } from './lib/runs.mjs';
import { renderDoc, verifyDoc } from './lib/doc.mjs';
import { unconfirmedSeed } from './lib/structure.mjs';

const EXPECTED_TOOLS = {
  'plan-research': ['objective'],
  'web-search': ['queries'],
  'extract-evidence': ['urls', 'evidence_requirements'],
};

const USAGE = `rpp <command>
  doctor                          check server, tool contract, duplicate config
  health | method                 print the server's health or method resource
  plan "<objective>"              plan-research
  search "<query>" ["<query>"...] web-search
  extract --url U [--url U...] --req "<requirement>" [--req ...]
                                  extract-evidence (also: --json <file|->)
  config [key]                    show the settings in effect (output_dir, default_depth, compact_tool_output)
  ledger get <E-id> | find <text> | stats | index
                                  read the quote ledger (active run, --run <dir>, or per-project cache)
  runs list [--brief] | init <slug> --topic T --type report|brief|corpus --depth D | phase <run> <phase> [--next text] | show [run]
                                  manage research run folders and their state; entering finalizing or
                                  done runs the audit gate (verdict pass, clean citations)
  verify <file> [--lenient]       every [E-id] resolves; numeric claims carry a citation and their number is in the quote
  verify <run-dir>                the same for every document of a run, plus structure: placeholders, links, blank cells, vague gaps, charter coverage
  render <file> --out <file>      [E-id] becomes [n]; appends references and verbatim quotes
  render <file> --in-place        keep IDs; add or refresh an evidence appendix
  common flags: --raw (print the server's own text), --run <dir> (write evidence into that run)`;

const BOOLEAN_FLAGS = new Set(['raw', 'lenient', 'in-place', 'force', 'brief']);

function parseArgs(argv) {
  const out = { _: [], url: [], req: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') out.url.push(argv[++i]);
    else if (a === '--req') out.req.push(argv[++i]);
    else if (a.startsWith('--')) {
      const name = a.slice(2);
      const next = argv[i + 1];
      if (!BOOLEAN_FLAGS.has(name) && next !== undefined && !next.startsWith('--')) out.flags[name] = argv[++i];
      else out.flags[name] = true;
    } else out._.push(a);
  }
  return out;
}

const readJsonSafe = (p) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
};

function findDuplicateServers() {
  const hits = [];
  const matches = (name, cfg) =>
    /researchpowerpack|research-mcp/i.test(name) || (cfg && cfg.url && cfg.url.replace(/\/$/, '') === endpoint().replace(/\/$/, ''));
  const claude = readJsonSafe(path.join(os.homedir(), '.claude.json'));
  if (claude) {
    for (const [n, c] of Object.entries(claude.mcpServers || {})) if (matches(n, c)) hits.push(`~/.claude.json mcpServers.${n}`);
    for (const [proj, v] of Object.entries(claude.projects || {}))
      for (const [n, c] of Object.entries(v.mcpServers || {})) if (matches(n, c)) hits.push(`~/.claude.json projects[${proj}].mcpServers.${n}`);
  }
  const proj = readJsonSafe(path.join(process.cwd(), '.mcp.json'));
  if (proj) for (const [n, c] of Object.entries(proj.mcpServers || {})) if (matches(n, c)) hits.push(`${process.cwd()}/.mcp.json mcpServers.${n}`);
  return hits;
}

async function doctor() {
  const lines = [];
  let bad = 0;
  const ok = (m) => lines.push('✓ ' + m);
  const warn = (m) => lines.push('! ' + m);
  const fail = (m) => { bad++; lines.push('✗ ' + m); };

  try {
    const init = await initialize();
    const info = init.serverInfo || {};
    ok(`server ${clean(info.name, 60)} v${clean(info.version, 30)} at ${endpoint()} (protocol ${clean(init.protocolVersion, 30)})`);
    const rp = init.capabilities?.experimental?.research_powerpack;
    if (rp) {
      const prof = Object.entries(rp.profiles || {}).map(([k, v]) => `${clean(k, 30)}=${clean(v?.prompt_version, 30)}`).join(' ');
      ok(`schema planning/search v${clean(rp.schema_version, 10)}, extraction v${clean(rp.extraction_output_schema_version, 10)}; ${prof}`);
      if (rp.extraction_output_schema_version !== '3') warn(`extraction schema is v${clean(rp.extraction_output_schema_version, 10)}; the plugin was written for v3`);
    } else warn('server did not advertise research_powerpack capabilities');
  } catch (e) {
    fail(`cannot reach ${endpoint()}: ${clean(e.message, 200)}`);
    console.log(lines.join('\n'));
    process.exit(1);
  }

  try {
    const tools = await listTools();
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
    for (const [name, required] of Object.entries(EXPECTED_TOOLS)) {
      const t = byName[name];
      if (!t) { fail(`tool ${name} is missing`); continue; }
      const got = clean([...(t.inputSchema?.required || [])].sort().join(','), 120);
      if (got === [...required].sort().join(',')) ok(`tool ${name} (required: ${got})`);
      else fail(`tool ${name} required inputs changed: expected ${required.join(',')} got ${got}`);
    }
    const extra = tools.map((t) => t.name).filter((n) => !EXPECTED_TOOLS[n]);
    if (extra.length) warn(`new server tools the plugin does not know: ${extra.map((n) => clean(n, 40)).join(', ')}`);
  } catch (e) {
    fail(`tools/list failed: ${clean(e.message, 200)}`);
  }

  try {
    const h = JSON.parse((await readResource('health://status')).text);
    ok(`health ${clean(h.status, 30)}, uptime ${clean(h.uptime_seconds, 20)}s, content concurrency ${clean(h.content_preparation?.concurrency, 10)}`);
  } catch (e) {
    warn(`health resource unavailable: ${clean(e.message, 200)}`);
  }

  const dups = findDuplicateServers();
  if (dups.length) warn(`the same server is also configured outside the plugin, so tools may appear twice:\n    ${dups.map((d) => clean(d, 200)).join('\n    ')}`);
  else ok('no duplicate user-level or project-level server entry');

  const cfg = config();
  const src = Object.fromEntries(configSources());
  ok('settings: ' + Object.entries(cfg).map(([k, v]) => `${k}=${v} (${src[k]})`).join(', '));
  if (outputIsPlugin(process.cwd())) warn(`output_dir "${cfg.output_dir}" resolves to a plugin source folder in this project, so research runs cannot be created here. Set output_dir to another name with /plugin configure research.`);

  console.log(lines.join('\n'));
  process.exit(bad ? 1 : 0);
}

async function runTool(name, args, flags) {
  const { dir } = resolveLedger({ cwd: process.cwd(), run: flags.run });
  const reason = guard(name, args, dir, { reserve: true });
  if (reason) {
    console.error(`blocked: ${reason}`);
    process.exit(2);
  }
  const result = await callTool(name, args);
  if (result.isError) {
    console.error(result.content?.[0]?.text || 'tool error');
    process.exit(1);
  }
  const structured = parseStructured(result);
  if (!structured) return console.log(result.content?.[0]?.text ?? '');
  const { text } = ingest(dir, name, args, structured, { id: `cli${Date.now()}` });
  if (flags.raw) console.log(result.content?.[0]?.text ?? JSON.stringify(structured, null, 2));
  else console.log(text ?? JSON.stringify(structured, null, 2));
}

function ledgerCmd(a) {
  const { dir } = resolveLedger({ cwd: process.cwd(), run: a.flags.run });
  const [sub, ...args] = a._;
  switch (sub) {
    case 'get': {
      const q = getQuote(dir, args[0] || '');
      if (!q) { console.error(`no quote ${args[0]} in ${dir}`); process.exit(1); }
      return console.log(JSON.stringify(q, null, 2));
    }
    case 'find': {
      const hits = findQuotes(dir, args.join(' '));
      for (const q of hits) console.log(`${q.id} ${q.url} ${q.locator?.start_line ?? ''}: ${q.quote.replace(/\s+/g, ' ').slice(0, 200)}`);
      return console.log(`${hits.length} match(es)`);
    }
    case 'stats': return console.log(JSON.stringify(stats(dir), null, 2));
    case 'index':
      for (const q of quotes(dir)) console.log(`${q.id}\t${q.url}\t${q.locator?.start_line ?? ''}\t${q.requirement?.slice(0, 80) ?? ''}`);
      return;
    default: throw new Error('usage: rpp ledger <get E-id|find text|stats|index> [--run dir]');
  }
}

const ledgerDirFor = (file, a) => {
  if (a.flags.run) return resolveLedger({ cwd: process.cwd(), run: a.flags.run }).dir;
  const run = runOfPath(path.resolve(file), process.cwd());
  return run ? path.join(run, 'evidence') : resolveLedger({ cwd: process.cwd() }).dir;
};

function runsCmd(a) {
  const cwd = process.cwd();
  const [sub, ...args] = a._;
  const rel = (p) => path.relative(cwd, p) || '.';
  switch (sub) {
    case 'list': {
      const runs = listRuns(cwd);
      if (a.flags.brief) {
        const open = runs.filter((r) => r.state.phase !== 'done');
        if (!open.length) return console.log('No unfinished research runs.');
        for (const r of open) console.log(`${r.active ? '*' : ' '} ${rel(r.dir)}  ${safeType(r.state.type)}/${safeDepth(r.state.depth)}  phase=${safePhase(r.state.phase)}  topic (from file): "${clean(r.state.topic, 80)}"`);
        return;
      }
      if (!runs.length) return console.log('No research runs yet.');
      for (const r of runs) console.log(`${r.active ? '*' : ' '} ${rel(r.dir)}\t${safeType(r.state.type)}/${safeDepth(r.state.depth)}\t${safePhase(r.state.phase)}\t${String(r.state.updated).slice(0, 16)}\t${clean(r.state.topic, 100)}`);
      return;
    }
    case 'init': {
      const dir = initRun({ cwd, slug: args[0], topic: a.flags.topic, type: a.flags.type, depth: a.flags.depth || config().default_depth });
      return console.log(rel(dir));
    }
    case 'phase': {
      const run = resolveRun(args[0], cwd);
      if (!run) throw new Error(`no run found for "${args[0]}"`);
      if (['synthesis', 'audit', 'finalizing', 'done'].includes(args[1]) && unconfirmedSeed(run.dir) && !a.flags.force) {
        console.error(`cannot enter phase "${args[1]}": charter.md still has "Seed (unconfirmed)". Ask the user the Entities question and replace the seed with the confirmed list.`);
        process.exit(1);
      }
      if (['finalizing', 'done'].includes(args[1]) && !a.flags.force) {
        const problems = gateProblems(run.dir, args[1]);
        if (problems.length) {
          console.error(`cannot enter phase "${args[1]}" yet:\n  - ${problems.join('\n  - ')}\nFix these and run the command again.`);
          process.exit(1);
        }
      }
      const s = setPhase(run.dir, args[1], { next: a.flags.next === true ? undefined : a.flags.next, waves: a.flags.waves }, cwd);
      return console.log(`${s.slug}: phase=${s.phase} next: ${s.next || '-'}`);
    }
    case 'show': {
      const run = resolveRun(args[0], cwd);
      if (!run) throw new Error(`no run found for "${args[0] || '(active)'}"`);
      const agents = agentStats(path.join(run.dir, 'evidence'));
      const sum = (k) => agents.reduce((n, a) => n + a[k], 0);
      const elapsed = Math.round((Date.parse(run.state.updated) - Date.parse(run.state.created)) / 60000);
      const totals = { searches: sum('searches'), extractions: sum('extracts'), quotes: stats(path.join(run.dir, 'evidence')).quotes, elapsed_minutes: Number.isFinite(elapsed) ? elapsed : null };
      return console.log(JSON.stringify({ dir: rel(run.dir), ...run.state, audit: auditVerdict(run.dir), totals, agents }, null, 2));
    }
    default: throw new Error('usage: rpp runs <list [--brief]|init <slug> --topic T --type report|brief|corpus --depth D|phase <run> <phase> [--next text]|show [run]>');
  }
}

function verifyCmd(a) {
  const file = a._[0];
  if (!file) throw new Error('usage: rpp verify <file|run-dir> [--run dir] [--lenient]');
  const isFile = fs.existsSync(file) && fs.statSync(file).isFile();
  const run = isFile ? null : resolveRun(file, process.cwd());
  if (!isFile && !run) throw new Error(`${file} is neither a file nor a research run (a slug, or a path to a run folder under the output directory)`);
  if (run) {
    const problems = checkRun(run.dir);
    console.log(`verify run ${path.relative(process.cwd(), run.dir) || '.'}: ${problems.length} problem(s)`);
    for (const p of problems) console.log(`  - ${p}`);
    for (const w of thinWarnings(run.dir)) console.log(`  warning: ${w}`);
    console.log(problems.length ? 'FAIL' : 'PASS');
    process.exit(problems.length ? 1 : 0);
  }
  const dir = ledgerDirFor(file, a);
  const byId = new Map(quotes(dir).map((q) => [q.id, q]));
  const r = verifyDoc(fs.readFileSync(file, 'utf8'), new Set(byId.keys()), byId);
  console.log(`verify ${file}: ${r.cited.length} distinct citation(s), ${r.unknown.length} unknown, ${r.uncited.length} uncited numeric claim(s), ${r.mismatch.length} number(s) not in the cited quote, ${r.thin.length} thin quote(s)`);
  for (const u of r.unknown) console.log(`  unknown ${u.id} (line ${u.line}) is not in ${dir}`);
  for (const u of r.uncited) console.log(`  uncited line ${u.line}: "${u.text}"`);
  for (const m of r.mismatch) console.log(`  number line ${m.line}: ${m.numbers.join(', ')} not stated by ${m.ids.join(' ')} — cite the quote that states it, or say inferred or computed: "${m.text}"`);
  for (const t of r.thin) console.log(`  warning: ${t.id} (line ${t.line}) is ⚠thin, page chrome (mostly links); it shows the page has links, not what it says. Re-read the source with a sharper requirement.`);
  const fail = r.unknown.length > 0 || ((r.uncited.length > 0 || r.mismatch.length > 0) && !a.flags.lenient);
  console.log(fail ? 'FAIL' : 'PASS');
  process.exit(fail ? 1 : 0);
}

function renderCmd(a) {
  const file = a._[0];
  if (!file) throw new Error('usage: rpp render <file> [--out file | --in-place] [--run dir]');
  const dir = ledgerDirFor(file, a);
  const byId = new Map(quotes(dir).map((q) => [q.id, q]));
  const inPlace = Boolean(a.flags['in-place']);
  // `Bash(rpp *)` is pre-approved, so rendering may only write inside the project.
  const root = projectRoot(process.cwd());
  for (const target of [inPlace ? file : null, typeof a.flags.out === 'string' ? a.flags.out : null].filter(Boolean)) {
    const abs = path.resolve(target);
    if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error(`refusing to write ${target}: it is outside the project (${root})`);
  }
  const r = renderDoc(fs.readFileSync(file, 'utf8'), byId, inPlace ? 'ids' : 'numbered');
  if (r.missing.length) console.error(`warning: ${r.missing.length} ID(s) not in the ledger and left unchanged: ${r.missing.join(' ')}`);
  if (inPlace) fs.writeFileSync(file, r.text);
  else if (typeof a.flags.out === 'string') fs.writeFileSync(a.flags.out, r.text);
  else process.stdout.write(r.text);
  console.error(`rendered ${r.count} quote(s) from ${dir}${inPlace ? ` into ${file}` : typeof a.flags.out === 'string' ? ` into ${a.flags.out}` : ''}`);
}

export async function main(argv) {
  const [cmd, ...rest] = argv;
  const a = parseArgs(rest);
  switch (cmd) {
    case 'doctor': return doctor();
    case 'health': return console.log((await readResource('health://status')).text);
    case 'method': return console.log((await readResource('research://method')).text);
    case 'config': {
      const c = config();
      if (a._[0]) {
        if (!(a._[0] in c)) throw new Error(`unknown setting "${a._[0]}" (known: ${Object.keys(c).join(', ')})`);
        return console.log(String(c[a._[0]]));
      }
      return console.log(JSON.stringify(c, null, 2));
    }
    case 'ledger': return ledgerCmd(a);
    case 'runs': return runsCmd(a);
    case 'verify': return verifyCmd(a);
    case 'render': return renderCmd(a);
    case 'plan':
      if (!a._.length) throw new Error('usage: rpp plan "<objective>"');
      return runTool('plan-research', { objective: a._.join(' ') }, a.flags);
    case 'search':
      if (!a._.length) throw new Error('usage: rpp search "<query>" ["<query>"...]');
      return runTool('web-search', { queries: a._ }, a.flags);
    case 'extract': {
      let args;
      if (a.flags.json) args = JSON.parse(fs.readFileSync(a.flags.json === '-' ? 0 : a.flags.json, 'utf8'));
      else args = { urls: a.url, evidence_requirements: a.req };
      if (!args.urls?.length || !args.evidence_requirements?.length) throw new Error('usage: rpp extract --url U --req "<requirement>"');
      return runTool('extract-evidence', args, a.flags);
    }
    default:
      console.log(USAGE);
      process.exit(cmd && cmd !== 'help' && cmd !== '--help' ? 1 : 0);
  }
}
