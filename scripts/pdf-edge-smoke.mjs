import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const lines = fs.readFileSync(filepath, 'utf8').split(/\r?\n/);
  const out = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    out[key] = value;
  }
  return out;
}

const root = process.cwd();
const localEnv = parseEnvFile(path.join(root, '.env.local'));
const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/generate-pdf`;
const payload = {
  html: `<html><body><h1>PDF smoke OK</h1><p>${new Date().toISOString()}</p></body></html>`,
  options: { filename: 'pdf-smoke.pdf', format: 'a4', orientation: 'portrait' },
};

const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  },
  body: JSON.stringify(payload),
});

console.log(`status=${res.status}`);
console.log(`content-type=${res.headers.get('content-type') || ''}`);
console.log(`content-disposition=${res.headers.get('content-disposition') || ''}`);

if (!res.ok) {
  const txt = await res.text();
  console.error(txt.slice(0, 1000));
  process.exit(1);
}

const arr = new Uint8Array(await res.arrayBuffer());
const signature = Buffer.from(arr.slice(0, 5)).toString('ascii');
if (signature !== '%PDF-') {
  console.error(`Invalid PDF signature: ${signature}`);
  process.exit(1);
}

const outDir = path.join(root, 'playwright', 'lighthouse');
fs.mkdirSync(outDir, { recursive: true });
const outputPath = path.join(outDir, 'pdf-smoke.pdf');
fs.writeFileSync(outputPath, arr);
console.log(`bytes=${arr.length}`);
console.log(`saved=${path.relative(root, outputPath)}`);
