import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const ARBITRARY_CLASS_PATTERN = /\b(?:text|rounded|tracking|max-h|min-h|min-w|max-w|w|h|blur)-\[[^\]]+\]/g;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFile(filePath) {
  const relativePath = path.relative(ROOT, filePath);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const violations = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    ARBITRARY_CLASS_PATTERN.lastIndex = 0;
    const matches = [...line.matchAll(ARBITRARY_CLASS_PATTERN)].map((m) => m[0]);
    if (matches.length === 0) continue;

    for (const match of matches) {
      violations.push({
        file: relativePath,
        line: i + 1,
        className: match,
      });
    }
  }

  return violations;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('No se encontro el directorio src');
    process.exit(1);
  }

  const files = walk(SRC_DIR);
  const violations = files.flatMap(scanFile);

  if (violations.length === 0) {
    console.log('lint:design OK - sin clases arbitrarias bloqueadas');
    return;
  }

  console.error('lint:design ERROR - se detectaron clases arbitrarias bloqueadas:');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.className}`);
  }
  process.exit(1);
}

main();
