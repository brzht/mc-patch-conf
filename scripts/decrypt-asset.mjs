// Inverse of encrypt-assets.mjs. Usage: node decrypt-asset.mjs <in.enc> <out>
import { createDecipheriv } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const key = Buffer.from(readFileSync(resolve(root, '.keys', 'aes.key'), 'utf8').trim(), 'base64');

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) { console.error('usage: decrypt-asset.mjs <in.enc> <out>'); process.exit(1); }

const blob = readFileSync(inPath);
const iv = blob.subarray(0, 12);
const tag = blob.subarray(12, 28);
const ct = blob.subarray(28);
const dec = createDecipheriv('aes-256-gcm', key, iv);
dec.setAuthTag(tag);
writeFileSync(outPath, Buffer.concat([dec.update(ct), dec.final()]));
console.log(`OK ${outPath} (${ct.length} bytes)`);
