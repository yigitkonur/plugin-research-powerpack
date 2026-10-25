// Bump the research plugin version in plugin.json and marketplace.json together; print the new version.
// usage: node bump.mjs [patch|minor|major]
import fs from 'node:fs';

const kind = process.argv[2] || 'patch';
const PLUGIN = 'research/.claude-plugin/plugin.json';
const MARKET = '.claude-plugin/marketplace.json';

const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');

const plugin = read(PLUGIN);
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(plugin.version);
if (!m) throw new Error(`unexpected version ${plugin.version}`);
let [maj, min, pat] = m.slice(1).map(Number);
if (kind === 'major') { maj++; min = 0; pat = 0; } else if (kind === 'minor') { min++; pat = 0; } else pat++;
const next = `${maj}.${min}.${pat}`;

plugin.version = next;
write(PLUGIN, plugin);

const market = read(MARKET);
market.metadata.version = next;
for (const p of market.plugins) if (p.name === plugin.name) p.version = next;
write(MARKET, market);

console.log(next);
