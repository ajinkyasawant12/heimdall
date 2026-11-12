import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.argv[2] || process.cwd();
console.log(`[+] Rebranding in: ${rootDir}`);

// 1. Rename files/folders
const renames = [
  ['heimdall.scope.json', 'heimdall.scope.json'],
  ['heimdall_crs_colab_runner.ipynb', 'heimdall_colab_runner.ipynb'],
  ['.agents/heimdall-orchestrator.json', '.agents/heimdall-orchestrator.json'],
  ['binary-harness/heimdall_binary', 'binary-harness/heimdall_binary']
];

for (const [oldRel, newRel] of renames) {
  const oldPath = path.join(rootDir, oldRel);
  const newPath = path.join(rootDir, newRel);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`[+] Renamed ${oldRel} -> ${newRel}`);
  }
}

// 2. Walk directory and replace content
const textExtensions = new Set([
  '.json', '.ts', '.js', '.mjs', '.md', '.ipynb', '.py', '.toml', '.txt', '.html', '.css'
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (textExtensions.has(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;

        if (content.includes('@heimdall/')) {
          content = content.replaceAll('@heimdall/', '@heimdall/');
          changed = true;
        }
        if (content.includes('heimdall-crs')) {
          content = content.replaceAll('heimdall-crs', 'heimdall-crs');
          changed = true;
        }
        if (content.includes('heimdall_crs')) {
          content = content.replaceAll('heimdall_crs', 'heimdall_crs');
          changed = true;
        }
        if (content.includes('heimdall.scope.json')) {
          content = content.replaceAll('heimdall.scope.json', 'heimdall.scope.json');
          changed = true;
        }
        if (content.includes('Heimdall CRS')) {
          content = content.replaceAll('Heimdall CRS', 'Heimdall CRS');
          changed = true;
        }
        if (content.includes('Heimdall Security')) {
          content = content.replaceAll('Heimdall Security', 'Heimdall Security');
          changed = true;
        }
        if (content.includes('HEIMDALL_BANNER')) {
          content = content.replaceAll('HEIMDALL_BANNER', 'HEIMDALL_BANNER');
          changed = true;
        }
        if (content.includes('HEIMDALL_VERSION')) {
          content = content.replaceAll('HEIMDALL_VERSION', 'HEIMDALL_VERSION');
          changed = true;
        }
        if (content.includes('"heimdall":')) {
          content = content.replaceAll('"heimdall":', '"heimdall":');
          changed = true;
        }
        if (content.includes('Heimdall')) {
          content = content.replaceAll('Heimdall', 'Heimdall');
          changed = true;
        }
        if (content.includes('aegis')) {
          content = content.replaceAll('aegis', 'heimdall');
          changed = true;
        }

        if (changed) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`[+] Updated text in ${path.relative(rootDir, fullPath)}`);
        }
      }
    }
  }
}

walk(rootDir);
console.log('[+] Rebrand script completed successfully.');
