import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
export async function assertPathInScope(targetPath, manifest) {
  const resolvedTarget = await realpath(path.resolve(targetPath));
  const resolvedRoots = await Promise.all(manifest.allowedRootPaths.map(async root => {
    try {
      return await realpath(path.resolve(root));
    } catch {
      return path.resolve(root);
    }
  }));
  const targetNorm = path.normalize(resolvedTarget).toLowerCase();
  const insideScope = resolvedRoots.some(root => {
    const rootNorm = path.normalize(root).toLowerCase();
    return targetNorm === rootNorm || targetNorm.startsWith(rootNorm + path.sep);
  });
  if (!insideScope) {
    throw new Error(`SCOPE_VIOLATION: Path ${resolvedTarget} is outside allowed roots: [${resolvedRoots.join(', ')}]`);
  }
  return resolvedTarget;
}
export async function runSandboxedBinary(binary, args, cwd, manifest) {
  // Normalize binary name (strip .exe/.cmd if on Windows)
  const baseBin = path.basename(binary).replace(/\.(exe|cmd|bat)$/i, '').toLowerCase();
  const allowed = manifest.allowedBinaries.map(b => b.replace(/\.(exe|cmd|bat)$/i, '').toLowerCase());
  if (!allowed.includes(baseBin)) {
    throw new Error(`POLICY_VIOLATION: Binary '${binary}' is not permitted by ScopeManifest.`);
  }
  const safeCwd = await assertPathInScope(cwd, manifest);
  try {
    const isWindows = process.platform === 'win32';
    const cleanEnv = isWindows ? {
      SystemRoot: process.env.SystemRoot || 'C:\\Windows',
      PATH: process.env.PATH || 'C:\\Windows\\system32;C:\\Windows',
      TMP: process.env.TMP || 'C:\\Temp',
      TEMP: process.env.TEMP || 'C:\\Temp',
      NODE_ENV: 'test'
    } : {
      PATH: '/usr/local/bin:/usr/bin:/bin',
      NODE_ENV: 'test',
      HOME: '/tmp',
      TMPDIR: '/tmp'
    };
    const {
      stdout,
      stderr
    } = await execFileAsync(binary, [...args], {
      cwd: safeCwd,
      shell: false,
      timeout: manifest.maxSubprocessTimeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      env: cleanEnv
    });
    return {
      stdout: stdout.toString(),
      stderr: stderr.toString(),
      exitCode: 0
    };
  } catch (err) {
    const e = err;
    return {
      stdout: e.stdout ? e.stdout.toString() : '',
      stderr: e.stderr ? e.stderr.toString() : String(err),
      exitCode: typeof e.code === 'number' ? e.code : 1
    };
  }
}
