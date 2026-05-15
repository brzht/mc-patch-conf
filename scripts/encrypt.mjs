// Encrypt games.json -> games.json.enc using AES-256-GCM.
// Run: npm run encrypt
// Output is JSON: { v, alg, iv, tag, ct } — all base64. IV is random per call.

import { createCipheriv, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const aesPath = resolve(root, '.keys', 'aes.key');
const jsonPath = resolve(root, 'games.json');
const encPath = resolve(root, 'games.json.enc');

if (!existsSync(aesPath)) {
    console.error(`AES key not found at ${aesPath}. Restore it from your password manager.`);
    process.exit(1);
}
if (!existsSync(jsonPath)) {
    console.error(`games.json not found at ${jsonPath}. Create it first.`);
    process.exit(1);
}

const key = Buffer.from(readFileSync(aesPath, 'utf8').trim(), 'base64');
if (key.length !== 32) {
    console.error(`AES key must be 32 bytes (got ${key.length}). Aborting.`);
    process.exit(1);
}

const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const plaintext = readFileSync(jsonPath);
const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();

const envelope = {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ct.toString('base64'),
};

writeFileSync(encPath, JSON.stringify(envelope) + '\n');
console.log(`Encrypted games.json -> games.json.enc (${plaintext.length} bytes plaintext, ${ct.length} bytes ciphertext)`);
