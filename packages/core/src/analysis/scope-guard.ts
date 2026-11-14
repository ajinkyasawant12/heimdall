import { resolve, relative, isAbsolute } from "node:path";
import { realpathSync, statSync } from "node:fs";
import type { TargetScope } from "@heimdall/shared";
import { DEFAULT_MAX_REVIEW_FILES, DEFAULT_MAX_FILE_SIZE_BYTES } from "@heimdall/shared";

export class ScopeViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScopeViolationError";
  }
}

export class ScopeGuard {
  private readonly canonicalRoot: string;
  private readonly maxFiles: number;
  private readonly maxFileSizeBytes: number;

  constructor(private readonly scope: TargetScope) {
    try {
      this.canonicalRoot = realpathSync(scope.rootPath);
    } catch {
      this.canonicalRoot = resolve(scope.rootPath);
    }
    this.maxFiles = scope.maxFilesToReview || DEFAULT_MAX_REVIEW_FILES;
    this.maxFileSizeBytes = (scope.maxFileSizeKb ? scope.maxFileSizeKb * 1024 : DEFAULT_MAX_FILE_SIZE_BYTES);
  }

  /**
   * Asserts that a file path is strictly within the target scope and not a symlink escaping root.
   */
  validatePath(targetRelativeOrAbsolute: string): string {
    const fullPath = isAbsolute(targetRelativeOrAbsolute)
      ? targetRelativeOrAbsolute
      : resolve(this.canonicalRoot, targetRelativeOrAbsolute);

    let canonicalPath: string;
    try {
      canonicalPath = realpathSync(fullPath);
    } catch {
      canonicalPath = resolve(fullPath);
    }

    const rel = relative(this.canonicalRoot, canonicalPath);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      throw new ScopeViolationError(`Path traversal detected: "${targetRelativeOrAbsolute}" escapes root "${this.canonicalRoot}"`);
    }

    return canonicalPath;
  }

  /**
   * Validates file size against configured limit.
   */
  validateFileSize(filePath: string): boolean {
    try {
      const stats = statSync(filePath);
      return stats.size <= this.maxFileSizeBytes;
    } catch {
      return false;
    }
  }

  /**
   * Validates whether an outbound network destination is permitted.
   */
  validateNetworkHost(host: string): boolean {
    if (!this.scope.allowNetworkOutbound) return false;
    if (!this.scope.allowedHosts || this.scope.allowedHosts.length === 0) return true;
    return this.scope.allowedHosts.includes(host.toLowerCase());
  }
}
