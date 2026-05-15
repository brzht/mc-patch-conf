// One-time key generation.
// Run: npm run keygen
// Generates:
//   - Ed25519 keypair (private signs, public verifies)
//   - AES-256 symmetric key (encrypts AND decrypts the config blob)
// Private keys saved to .keys/ (gitignored). Public values printed for baking into the launcher.

import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const keysDir = resolve(root, '.keys');
const signPath = resolve(keysDir, 'sign.key');
const aesPath = resolve(keysDir, 'aes.key');
const pubPath = resolve(keysDir, 'sign.pub.b64');

if (existsSync(signPath) || existsSync(aesPath)) {
    console.error(`Refusing to overwrite existing keys in ${keysDir}`);
    console.error('Delete them manually if you really want to regenerate.');
    process.exit(1);
}

mkdirSync(keysDir, { recursive: true });

// Ed25519 signing keypair
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
writeFileSync(signPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
const pubDer = publicKey.export({ type: 'spki', format: 'der' });
const pubB64 = pubDer.subarray(pubDer.length - 32).toString('base64');
writeFileSync(pubPath, pubB64 + '\n');

// AES-256 symmetric key
const aesKey = randomBytes(32);
const aesB64 = aesKey.toString('base64');
writeFileSync(aesPath, aesB64 + '\n', { mode: 0o600 });

console.log('\nKeys generated in .keys/');
console.log('Back them up to your password manager and delete the local copies when done.\n');
console.log('=== PASTE INTO LAUNCHER SOURCE ===');
console.log(`ConfigSignPublicKey (base64, 32 bytes): ${pubB64}`);
console.log(`ConfigEncryptionKey  (base64, 32 bytes): ${aesB64}`);
console.log('==================================\n');
