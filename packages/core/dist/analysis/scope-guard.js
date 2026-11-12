import { resolve, relative, isAbsolute } from "node:path";
import { realpathSync, statSync } from "node:fs";
import { DEFAULT_MAX_REVIEW_FILES, DEFAULT_MAX_FILE_SIZE_BYTES } from "@heimdall/shared";
export class ScopeViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ScopeViolationError";
  }
}
export class ScopeGuard {
  canonicalRoot;
  maxFiles;
  maxFileSizeBytes;
  constructor(scope) {
    this.scope = scope;
    try {
      this.canonicalRoot = realpathSync(scope.rootPath);
    } catch {
      this.canonicalRoot = resolve(scope.rootPath);
    }
    this.maxFiles = scope.maxFilesToReview || DEFAULT_MAX_REVIEW_FILES;
    this.maxFileSizeBytes = scope.maxFileSizeKb ? scope.maxFileSizeKb * 1024 : DEFAULT_MAX_FILE_SIZE_BYTES;
  }

  /**
   * Asserts that a file path is strictly within the target scope and not a symlink escaping root.
   */
  validatePath(targetRelativeOrAbsolute) {
    const fullPath = isAbsolute(targetRelativeOrAbsolute) ? targetRelativeOrAbsolute : resolve(this.canonicalRoot, targetRelativeOrAbsolute);
    let canonicalPath;
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
  validateFileSize(filePath) {
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
  validateNetworkHost(host) {
    if (!this.scope.allowNetworkOutbound) return false;
    if (!this.scope.allowedHosts || this.scope.allowedHosts.length === 0) return true;
    return this.scope.allowedHosts.includes(host.toLowerCase());
  }
}
