// Sign games.json.enc -> games.json.enc.sig with Ed25519.
// Run: npm run sign
// The signature covers the ENCRYPTED blob so the launcher can verify before decrypting.

import { sign, createPrivateKey } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const signKeyPath = resolve(root, '.keys', 'sign.key');
const encPath = resolve(root, 'games.json.enc');
const sigPath = resolve(root, 'games.json.enc.sig');

if (!existsSync(signKeyPath)) {
    console.error(`Sign key not found at ${signKeyPath}. Restore it from your password manager.`);
    process.exit(1);
}
if (!existsSync(encPath)) {
    console.error(`games.json.enc not found. Run "npm run encrypt" first.`);
    process.exit(1);
}

const priv = createPrivateKey(readFileSync(signKeyPath));
const data = readFileSync(encPath);
const signature = sign(null, data, priv);
writeFileSync(sigPath, signature.toString('base64') + '\n');
console.log(`Signed games.json.enc -> games.json.enc.sig (${signature.length} bytes)`);
