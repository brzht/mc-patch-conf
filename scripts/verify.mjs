// Verify games.json.enc against games.json.enc.sig, then decrypt and re-parse as JSON
// to confirm the launcher will be able to consume it. Run: npm run verify

import { verify, createPublicKey, createDecipheriv } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pubPath = resolve(root, '.keys', 'sign.pub.b64');
const aesPath = resolve(root, '.keys', 'aes.key');
const encPath = resolve(root, 'games.json.enc');
const sigPath = resolve(root, 'games.json.enc.sig');

if (!existsSync(pubPath) || !existsSync(aesPath)) {
    console.error('Missing key files in .keys/. Cannot verify.');
    process.exit(1);
}

const pubB64 = readFileSync(pubPath, 'utf8').trim();
const aesKey = Buffer.from(readFileSync(aesPath, 'utf8').trim(), 'base64');

// Verify signature
const rawPub = Buffer.from(pubB64, 'base64');
const spkiHeader = Buffer.from('302a300506032b6570032100', 'hex');
const pub = createPublicKey({ key: Buffer.concat([spkiHeader, rawPub]), format: 'der', type: 'spki' });
const data = readFileSync(encPath);
const sig = Buffer.from(readFileSync(sigPath, 'utf8').trim(), 'base64');

if (!verify(null, data, pub, sig)) {
    console.error('Signature INVALID.');
    process.exit(2);
}
console.log('Signature OK.');

// Decrypt
const envelope = JSON.parse(data.toString('utf8'));
const iv = Buffer.from(envelope.iv, 'base64');
const tag = Buffer.from(envelope.tag, 'base64');
const ct = Buffer.from(envelope.ct, 'base64');
const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
decipher.setAuthTag(tag);
let pt;
try {
    pt = Buffer.concat([decipher.update(ct), decipher.final()]);
} catch (e) {
    console.error('Decryption FAILED:', e.message);
    process.exit(3);
}
const parsed = JSON.parse(pt.toString('utf8'));
console.log(`Decryption OK. schemaVersion=${parsed.schemaVersion}, games=${parsed.games?.length ?? 0}`);
