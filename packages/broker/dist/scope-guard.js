import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertPathInScope } from './safe-exec.js';
export class HostScopeGuard {
  manifest = null;
  constructor(manifestPath = './heimdall.scope.json') {
    this.manifestPath = manifestPath;
  }
  async load() {
    const raw = await readFile(path.resolve(this.manifestPath), 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.allowedRootPaths) || !Array.isArray(parsed.allowedBinaries)) {
      throw new Error('MALFORMED_MANIFEST: allowedRootPaths and allowedBinaries must be arrays.');
    }
    this.manifest = parsed;
    return this.manifest;
  }
  getManifest() {
    if (!this.manifest) {
      throw new Error('ScopeManifest not loaded. Call load() first.');
    }
    return this.manifest;
  }
  async validatePath(targetPath) {
    const manifest = this.getManifest();
    return assertPathInScope(targetPath, manifest);
  }
  isBinaryAllowed(binary) {
    const manifest = this.getManifest();
    const baseBin = path.basename(binary).replace(/\.(exe|cmd|bat)$/i, '').toLowerCase();
    return manifest.allowedBinaries.map(b => b.replace(/\.(exe|cmd|bat)$/i, '').toLowerCase()).includes(baseBin);
  }
}
