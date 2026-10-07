import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function versionState(previous, digest, amended = false) {
  if (amended) return 'AMENDED_DOCUMENT';
  return !previous ? 'FIRST_ARCHIVE' : previous.sha256 === digest ? 'UNCHANGED_HASH' : 'CHANGED_BYTES';
}
export function allowed(url, policy) {
  const u = new URL(url);
  return u.protocol === 'https:' && !u.username && !u.password && policy.some(p => u.hostname === p.host && u.pathname.startsWith(p.prefix));
}
export async function retrieve(source, { cache, prior = [], fetcher = fetch, clock, blocked = new Set() }) {
  const receipt = { sourceId: source.id, url: source.url, retrievedAt: clock, qualificationStatus: 'REVIEW_REQUIRED', sha256: null, byteSize: 0, mime: null, resolvedURL: null, sourceVersionId: null, identityState: null };
  let url = source.url;
  try {
    for (let redirects = 0; redirects <= 3; redirects++) {
      if (!allowed(url, source.allowedRoutes)) throw Error('REDIRECT_REJECTED');
      const host = new URL(url).hostname;
      if (blocked.has(host)) throw Error('ACCESS_BLOCKED_HOST_STOP');
      const res = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'WorldInflationLens research (contact: https://github.com/ccesm/world-inflation-lens/issues)' } });
      receipt.httpStatus = res.status;
      if ([403,429].includes(res.status)) { blocked.add(host); receipt.retryAfter = res.headers.get('retry-after'); throw Error('ACCESS_BLOCKED'); }
      if (res.status >= 300 && res.status < 400) { url = new URL(res.headers.get('location'), url).href; continue; }
      if (!res.ok) throw Error(`HTTP_${res.status}`);
      if (Number(res.headers.get('content-length')) > 15000000) throw Error('SIZE_REJECTED');
      const chunks = []; let size = 0;
      for await (const chunk of res.body) { size += chunk.length; if (size > 15000000) throw Error('SIZE_REJECTED'); chunks.push(chunk); }
      const bytes = Buffer.concat(chunks), text = bytes.toString('utf8');
      const mime = (res.headers.get('content-type') ?? '').split(';')[0];
      if (source.documentType === 'PDF' ? !bytes.subarray(0,5).equals(Buffer.from('%PDF-')) || !/pdf/.test(mime) : !/html/.test(mime) || !/<(?:html|!doctype|body)/i.test(text)) throw Error('CONTENT_MISMATCH');
      if (/verify you are human|access denied|just a moment|captcha|request unsuccessful/i.test(text)) throw Error('CONTENT_MISMATCH');
      // HTML identity markers; PDF textual identity is qualified separately by human review.
      if (source.documentType !== 'PDF' && !source.identityMarkers.every(m => text.toLowerCase().includes(m.toLowerCase()))) throw Error('ISSUER_MISMATCH');
      const digest = sha256(bytes), previous = prior.filter(r => r.url === source.url).at(-1);
      const identityState = versionState(previous, digest, source.amended === true);
      Object.assign(receipt, { resolvedURL: url, mime, byteSize: size, sha256: digest, sourceVersionId: `${source.id}@${digest}`, identityState, qualificationStatus: source.documentType === 'PDF' || ['CHANGED_BYTES','AMENDED_DOCUMENT'].includes(identityState) ? 'REVIEW_REQUIRED' : 'CONTENT_VALIDATED' });
      const object = path.join(cache, 'objects', digest.slice(0,2), digest);
      fs.mkdirSync(path.dirname(object), { recursive: true });
      if (fs.existsSync(object)) { if (sha256(fs.readFileSync(object)) !== digest) throw Error('CACHE_CORRUPTION'); }
      else fs.writeFileSync(object, bytes, { flag: 'wx' });
      return receipt;
    }
    throw Error('REDIRECT_LIMIT');
  } catch (error) { return { ...receipt, qualificationStatus: error.message.startsWith('ACCESS_BLOCKED') ? 'ACCESS_BLOCKED' : 'REVIEW_REQUIRED', error: error.message }; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const cache = process.env.WIL_AI_INFRA_CACHE || path.join(os.homedir(), 'Public/wil-ai-infrastructure-cache');
  fs.mkdirSync(path.join(cache, 'receipts'), { recursive: true });
  const prior = fs.readdirSync(path.join(cache, 'receipts')).sort().flatMap(f => JSON.parse(fs.readFileSync(path.join(cache,'receipts', f), 'utf8')).results);
  const blocked = new Set(), results = [];
  const startedAt = new Date().toISOString();
  for (const source of manifest) { const r = await retrieve(source, { cache, prior, blocked, clock: new Date().toISOString() }); results.push(r); console.log(JSON.stringify({ source: source.id, status: r.qualificationStatus, bytes: r.byteSize, error: r.error })); await new Promise(resolve => setTimeout(resolve, 1100)); }
  const receipt = { startedAt, endedAt: new Date().toISOString(), results };
  const name = `${startedAt.replace(/[:.]/g,'-')}.json`;
  fs.writeFileSync(path.join(cache,'receipts', name), JSON.stringify(receipt,null,2)+'\n', { flag:'wx' });
  console.log(JSON.stringify({ receiptFile: name }));
}
