import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = 'C:/Users/Ajinkya/Desktop/heimdall';
const targets = [
  'C:/Users/Ajinkya/.gemini/antigravity/builtin/plugins/heimdall',
  'C:/Users/Ajinkya/.gemini/config/plugins/heimdall'
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

for (const targetDir of targets) {
  console.log(`Packaging Heimdall CRS plugin to: ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });

  // 1. plugin.json
  copyRecursive(path.join(sourceRoot, 'plugin.json'), path.join(targetDir, 'plugin.json'));

  // 2. README.md
  copyRecursive(path.join(sourceRoot, 'README.md'), path.join(targetDir, 'README.md'));

  // 3. LICENSE
  copyRecursive(path.join(sourceRoot, 'LICENSE'), path.join(targetDir, 'LICENSE'));

  // 4. assets
  copyRecursive(path.join(sourceRoot, 'assets'), path.join(targetDir, 'assets'));

  // 5. skills
  copyRecursive(path.join(sourceRoot, 'skills'), path.join(targetDir, 'skills'));

  // 6. agents
  copyRecursive(path.join(sourceRoot, 'agents'), path.join(targetDir, 'agents'));

  // Also include .agents/*.json in agents/ for full harness interoperability
  const dotAgents = path.join(sourceRoot, '.agents');
  if (fs.existsSync(dotAgents)) {
    for (const file of fs.readdirSync(dotAgents)) {
      if (file.endsWith('.json')) {
        copyRecursive(path.join(dotAgents, file), path.join(targetDir, 'agents', file));
      }
    }
  }

  // 7. sidecars
  copyRecursive(path.join(sourceRoot, 'sidecars'), path.join(targetDir, 'sidecars'));

  console.log(`[+] Successfully packaged plugin to: ${targetDir}`);
}
