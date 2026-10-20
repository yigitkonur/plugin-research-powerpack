// Client-side limits. The server is stateless and says the client owns retry decisions:
// "at most two total tool invocations per URL, including the first" (a retry rule). Shared state on disk is the
// only way parallel agents can respect that, so the PreToolUse hook and the CLI both call guard().
import { attemptCounts, claimAttempts, freshTs, quotes, setCount, SET_CAP, URL_CAP } from './ledger.mjs';

export const LIMITS = { urls: 20, reqs: 20, reqChars: 1000, queries: 50, sameQuestions: SET_CAP, perUrl: URL_CAP };

// Subagents have no shell, so they are pointed at the ledger file instead of the rpp command.
export const findHint = (shell) => (shell
  ? 'rpp ledger find "<text>"'
  : 'search quotes.jsonl in the run\'s evidence folder with Grep');

export function guard(tool, input, dir, { reserve = false, id, shell = true } = {}) {
  if (tool === 'web-search') {
    const n = (input.queries || []).length;
    if (n > LIMITS.queries) {
      return `web-search received ${n} queries; the supported range is 1-${LIMITS.queries}. Send a first wave of at most ${LIMITS.queries} orthogonal queries, read the leads, then send the next wave.`;
    }
    return null;
  }
  if (tool !== 'extract-evidence') return null;

  const urls = input.urls || [];
  const reqs = input.evidence_requirements || [];
  if (urls.length > LIMITS.urls) return `extract-evidence received ${urls.length} URLs; the maximum is ${LIMITS.urls}. Split into batches of at most ${LIMITS.urls} URLs and send the most promising batch first.`;
  if (reqs.length > LIMITS.reqs) return `extract-evidence received ${reqs.length} requirements; the maximum is ${LIMITS.reqs}. Merge overlapping requirements or split them across calls.`;
  const long = reqs.filter((r) => r.length > LIMITS.reqChars);
  if (long.length) return `${long.length} requirement(s) exceed ${LIMITS.reqChars} characters. Rewrite each as one short, checkable question or claim.`;

  const have = quotes(dir).filter((q) => freshTs(dir, q.ts));
  const covered = new Set(have.map((q) => `${q.url}\n${q.requirement}`));
  if (urls.length && reqs.length && urls.every((u) => reqs.every((r) => covered.has(`${u}\n${r}`)))) {
    return `Every URL and requirement pair in this call already has verbatim quotes in this run's ledger. Reuse them (${findHint(shell)}) or ask a different question of these pages.`;
  }

  const sameMsg = (list) => `These URLs were already read ${LIMITS.sameQuestions} times with these same requirements in this run: ${list.join(' ')}. The server allows one retry, and only for URLs in retry.sources; a finished read that lacks the answer is a negative result. Ask a different question of the page, use quotes already in the ledger (${findHint(shell)}), or pick other sources.`;
  const ceilingMsg = (list) => `These URLs were already read ${LIMITS.perUrl} times in this run: ${list.join(' ')}. Resend without them, use quotes already in the ledger (${findHint(shell)}), or pick other sources.`;
  const counts = attemptCounts(dir);
  const same = urls.filter((u) => setCount(dir, u, reqs) >= LIMITS.sameQuestions);
  if (same.length) return sameMsg(same);
  const ceil = urls.filter((u) => (counts.get(u) || 0) >= LIMITS.perUrl);
  if (ceil.length) return ceilingMsg(ceil);
  if (reserve) {
    const raced = claimAttempts(dir, urls, reqs, id);
    if (raced.sameSet.length) return sameMsg(raced.sameSet);
    if (raced.ceiling.length) return ceilingMsg(raced.ceiling);
  }
  return null;
}
