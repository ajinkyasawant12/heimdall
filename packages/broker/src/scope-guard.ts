import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ScopeManifest } from '@heimdall/shared';
import { assertPathInScope } from './safe-exec.js';

export class HostScopeGuard {
  private manifest: ScopeManifest | null = null;

  constructor(private manifestPath: string = './heimdall.scope.json') {}

  public async load(): Promise<ScopeManifest> {
    const raw = await readFile(path.resolve(this.manifestPath), 'utf8');
    const parsed = JSON.parse(raw) as ScopeManifest;
    
    if (!Array.isArray(parsed.allowedRootPaths) || !Array.isArray(parsed.allowedBinaries)) {
      throw new Error('MALFORMED_MANIFEST: allowedRootPaths and allowedBinaries must be arrays.');
    }
    
    this.manifest = parsed;
    return this.manifest;
  }

  public getManifest(): ScopeManifest {
    if (!this.manifest) {
      throw new Error('ScopeManifest not loaded. Call load() first.');
    }
    return this.manifest;
  }

  public async validatePath(targetPath: string): Promise<string> {
    const manifest = this.getManifest();
    return assertPathInScope(targetPath, manifest);
  }

  public isBinaryAllowed(binary: string): boolean {
    const manifest = this.getManifest();
    const baseBin = path.basename(binary).replace(/\.(exe|cmd|bat)$/i, '').toLowerCase();
    return manifest.allowedBinaries
      .map((b) => b.replace(/\.(exe|cmd|bat)$/i, '').toLowerCase())
      .includes(baseBin);
  }
}
