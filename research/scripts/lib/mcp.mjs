// Minimal MCP-over-HTTP client for the Research Powerpack server.
// The server is stateless (no Mcp-Session-Id), so plain JSON-RPC POSTs are enough.

export const DEFAULT_URL = 'https://research-mcp.yigitkonur.com/mcp';
// Queries and URLs travel to this server, so a plain-http override is only allowed for loopback.
export const endpoint = () => {
  const url = process.env.RESEARCH_MCP_URL || DEFAULT_URL;
  const u = new URL(url);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))) {
    throw new Error(`RESEARCH_MCP_URL must use https (http is allowed only for localhost), got ${u.protocol}//${u.hostname}`);
  }
  return url;
};

let nextId = 1;

async function post(body, timeoutMs) {
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-06-18',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${endpoint()}: ${text.slice(0, 300)}`);
  let json;
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    const datas = text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim());
    json = JSON.parse(datas[datas.length - 1]);
  } else {
    json = JSON.parse(text);
  }
  if (json.error) throw new Error(`MCP error ${json.error.code}: ${json.error.message}`);
  return json.result;
}

export const rpc = (method, params = {}, timeoutMs = 30000) =>
  post({ jsonrpc: '2.0', id: nextId++, method, params }, timeoutMs);

export const initialize = () =>
  rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'research-plugin', version: '0.1.0' },
  });

export const listTools = async () => (await rpc('tools/list')).tools;
export const readResource = async (uri) => (await rpc('resources/read', { uri })).contents[0];

// extract-evidence has a 60 s server ceiling; allow headroom for transport.
export const callTool = (name, args, timeoutMs = 90000) =>
  rpc('tools/call', { name, arguments: args }, timeoutMs);
