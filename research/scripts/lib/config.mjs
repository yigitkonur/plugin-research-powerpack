// Plugin settings. Claude Code hands userConfig values to hook processes as CLAUDE_PLUGIN_OPTION_<KEY>,
// but the Bash tool (where the rpp command runs) does not get them. Values set with /plugin configure
// are stored under pluginConfigs["research@<marketplace>"].options in the settings files, so we read
// those too. Precedence: environment, local settings, project settings, user settings, default.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULTS = { output_dir: 'research', default_depth: 'standard', compact_tool_output: true };

const envOf = (key) => process.env['CLAUDE_PLUGIN_OPTION_' + key.toUpperCase()];

function readOptions(file) {
  try {
    const cfg = JSON.parse(fs.readFileSync(file, 'utf8')).pluginConfigs || {};
    const id = Object.keys(cfg).find((k) => k === 'research' || k.startsWith('research@'));
    return (id && cfg[id] && cfg[id].options) || {};
  } catch { return {}; }
}

// Settings files that apply to this project: walk up from the project directory to find .claude/.
function settingsFiles() {
  const files = [];
  let d = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  for (let i = 0; i < 8; i++) {
    const c = path.join(d, '.claude');
    if (fs.existsSync(path.join(c, 'settings.json')) || fs.existsSync(path.join(c, 'settings.local.json'))) {
      files.push(path.join(c, 'settings.local.json'), path.join(c, 'settings.json'));
      break;
    }
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  files.push(path.join(os.homedir(), '.claude', 'settings.json'));
  return files;
}

function lookup(key) {
  const e = envOf(key);
  if (e !== undefined && e !== '') return { value: e, source: 'env' };
  for (const f of settingsFiles()) {
    const v = readOptions(f)[key];
    if (v !== undefined && v !== null && v !== '') return { value: v, source: 'settings' };
  }
  return { value: undefined, source: 'default' };
}

export function config() {
  const out = {};
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const { value } = lookup(key);
    if (value === undefined) out[key] = def;
    else if (typeof def === 'boolean') out[key] = typeof value === 'boolean' ? value : !['false', '0', 'no', 'off'].includes(String(value).toLowerCase());
    else out[key] = String(value);
  }
  return out;
}

export function configSources() {
  return Object.keys(DEFAULTS).map((k) => [k, lookup(k).source]);
}
