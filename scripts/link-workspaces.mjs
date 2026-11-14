import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const scopes = ['@heimdall', '@aegis'];
const pkgs = ['shared', 'broker', 'db', 'core', 'mcp', 'cli', 'dashboard'];

for (const scope of scopes) {
  const scopeDir = path.join(rootDir, 'node_modules', scope);
  fs.mkdirSync(scopeDir, { recursive: true });

  for (const pkg of pkgs) {
    const target = path.join(rootDir, 'packages', pkg);
    const linkPath = path.join(scopeDir, pkg);
    try {
      fs.rmSync(linkPath, { recursive: true, force: true });
    } catch {}
    try {
      fs.symlinkSync(target, linkPath, 'junction');
    } catch {
      try {
        fs.cpSync(target, linkPath, { recursive: true });
      } catch {}
    }
  }
  console.log(`[+] Linked ${scope}/* workspace packages in node_modules/${scope}/`);
}
