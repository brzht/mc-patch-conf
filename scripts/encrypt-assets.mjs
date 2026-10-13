// Encrypt every PNG/JPG under assets/ to <name>.enc using AES-256-GCM.
// Raw binary format (more compact than JSON+base64 for binary data):
//   [12 bytes IV][16 bytes auth tag][N bytes ciphertext]
// Skips files whose .enc is newer than the source so unchanged assets don't
// produce noisy git diffs on every publish — but only when that .enc opens with
// the current key: after `npm run keygen` every asset is encrypted again, or
// launchers with the new key would show no banners or icons.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const aesPath = resolve(root, '.keys', 'aes.key');
const assetsDir = resolve(root, 'assets');

if (!existsSync(aesPath)) {
    console.error(`AES key not found at ${aesPath}. Restore from your password manager.`);
    process.exit(1);
}
if (!existsSync(assetsDir)) {
    console.log('No assets/ directory; nothing to encrypt.');
    process.exit(0);
}

const key = Buffer.from(readFileSync(aesPath, 'utf8').trim(), 'base64');
if (key.length !== 32) {
    console.error(`AES key must be 32 bytes (got ${key.length}). Aborting.`);
    process.exit(1);
}

const SOURCE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function* walk(dir) {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, name.name);
        if (name.isDirectory()) yield* walk(full);
        else yield full;
    }
}

// Whether an envelope opens with the current key (GCM checks the tag).
function opensWithKey(encFile) {
    const blob = readFileSync(encFile);
    if (blob.length < 28) return false;
    try {
        const decipher = createDecipheriv('aes-256-gcm', key, blob.subarray(0, 12));
        decipher.setAuthTag(blob.subarray(12, 28));
        decipher.update(blob.subarray(28));
        decipher.final();
        return true;
    } catch {
        return false;
    }
}

let encrypted = 0, skipped = 0, rekeyed = 0;
for (const file of walk(assetsDir)) {
    const lower = file.toLowerCase();
    if (lower.endsWith('.enc')) continue;
    const ext = lower.slice(lower.lastIndexOf('.'));
    if (!SOURCE_EXTS.has(ext)) continue;

    const encFile = file + '.enc';
    if (existsSync(encFile) && statSync(encFile).mtimeMs >= statSync(file).mtimeMs) {
        if (opensWithKey(encFile)) {
            skipped++;
            continue;
        }
        rekeyed++;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([cipher.update(readFileSync(file)), cipher.final()]);
    const tag = cipher.getAuthTag();
    writeFileSync(encFile, Buffer.concat([iv, tag, ct]));
    encrypted++;
}

console.log(`Encrypted ${encrypted} asset(s) (${rekeyed} for a new key), ${skipped} up-to-date.`);
