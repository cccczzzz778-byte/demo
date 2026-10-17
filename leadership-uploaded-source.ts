import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const encoded = [0, 1, 2, 3].map((i) =>
  readFileSync(new URL(`./leadership-upload-chunk-${i}.txt`, import.meta.url), 'utf8').trim()
).join('');

const html = brotliDecompressSync(Buffer.from(encoded, 'base64')).toString('utf8');
const checksum = createHash('sha256').update(html).digest('hex');
if (checksum !== '5153a88ae89612d0e8875bc0c947365ff9cb9158b4e39d5a41994198e423438a') {
  throw new Error(`Uploaded leadership HTML checksum mismatch: ${checksum}`);
}

export const UPLOADED_LEADERSHIP_HTML = html;
