import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { createHash } from "node:crypto";
import { KNOWN_CWE_MAPPINGS } from "@heimdall/shared";
export class PatternScanner {
  rules = [
  // Memory Safety Lenses
  {
    id: "C-UNSAFE-STRING-COPY",
    bugClass: "buffer_overflow",
    severity: "critical",
    pattern: /\b(?:strcpy|strcat|sprintf|gets)\s*\(/g,
    title: "Unbounded Buffer Memory Operation",
    description: "Use of unbounded string functions (strcpy/strcat/sprintf/gets) can result in stack-based buffer overflows.",
    applicableExtensions: [".c", ".cpp", ".cc", ".h", ".hpp"]
  }, {
    id: "C-USE-AFTER-FREE-PATTERN",
    bugClass: "use_after_free",
    severity: "high",
    pattern: /free\s*\(\s*([a-zA-Z0-9_]+)\s*\);[\s\S]{0,80}\1->/g,
    title: "Potential Use-After-Free Dereference",
    description: "Pointer dereferenced shortly after free() invocation without NULL reassignment.",
    applicableExtensions: [".c", ".cpp", ".cc"]
  },
  // Injection Lenses
  {
    id: "CMD-INJECTION-EXEC",
    bugClass: "command_injection",
    severity: "critical",
    pattern: /\b(?:exec|execSync|spawn|system|popen)\s*\(\s*(?:`[^`]*\$\{|"[^"]*"\s*\+|'[^']*'\s*\+)/g,
    title: "Direct Command Injection via Shell Execution",
    description: "Dynamic string interpolation inside shell command execution primitives allows arbitrary OS command injection.",
    applicableExtensions: [".js", ".ts", ".py", ".rb", ".php"]
  }, {
    id: "SQL-INJECTION-CONCAT",
    bugClass: "sql_injection",
    severity: "high",
    pattern: /\b(?:SELECT|INSERT|UPDATE|DELETE)\b[\s\S]{0,100}(?:\+\s*[a-zA-Z0-9_]+|\$\{[a-zA-Z0-9_]+\})/gi,
    title: "Raw SQL Query String Concatenation",
    description: "Constructing SQL queries via string concatenation allows SQL injection attacks.",
    applicableExtensions: [".js", ".ts", ".py", ".java", ".go"]
  },
  // Path Traversal
  {
    id: "PATH-TRAVERSAL-JOIN",
    bugClass: "path_traversal",
    severity: "high",
    pattern: /(?:readFile|createReadStream|open)\s*\(\s*(?:path\.join|join|resolve)\s*\([^)]*req\.(?:query|params|body)/g,
    title: "Unsanitized Path Resolution in File Operation",
    description: "Passing user request parameters directly into file access calls can allow directory traversal.",
    applicableExtensions: [".js", ".ts"]
  },
  // Crypto Misuse
  {
    id: "CRYPTO-WEAK-HASH",
    bugClass: "crypto_misuse",
    severity: "medium",
    pattern: /createHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/gi,
    title: "Cryptographically Insecure Hash Function",
    description: "MD5 and SHA-1 are cryptographically broken and vulnerable to collision attacks.",
    applicableExtensions: [".js", ".ts", ".py"]
  },
  // Insecure Deserialization
  {
    id: "DESER-UNSAFE-LOAD",
    bugClass: "deserialization",
    severity: "critical",
    pattern: /(?:pickle\.loads|yaml\.load\s*\([^,)]*\)|unserialize)\s*\(/gi,
    title: "Insecure Object Deserialization",
    description: "Deserializing untrusted data with unsafe deserializers permits arbitrary code execution.",
    applicableExtensions: [".py", ".php", ".js"]
  }];

  /**
   * Scans a target directory under the given scope guard and returns detected findings.
   */
  scanDirectory(projectRoot, projectId, scopeGuard) {
    const findings = [];
    const filesToScan = [];
    const walk = dir => {
      let entries = [];
      try {
        entries = readdirSync(dir);
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === "build") continue;
        const full = join(dir, entry);
        let stat;
        try {
          stat = statSync(full);
        } catch {
          continue;
        }
        if (stat.isDirectory()) {
          walk(full);
        } else if (stat.isFile() && scopeGuard.validateFileSize(full)) {
          filesToScan.push(full);
        }
      }
    };
    walk(projectRoot);
    for (const filePath of filesToScan) {
      try {
        const canonical = scopeGuard.validatePath(filePath);
        const relPath = relative(projectRoot, canonical);
        const content = readFileSync(canonical, "utf-8");
        const fileHash = `sha256:${createHash("sha256").update(content).digest("hex")}`;
        const ext = extname(filePath).toLowerCase();
        for (const rule of this.rules) {
          if (!rule.applicableExtensions.includes(ext)) continue;
          rule.pattern.lastIndex = 0;
          let match;
          while ((match = rule.pattern.exec(content)) !== null) {
            const index = match.index;
            const linesUpToMatch = content.slice(0, index).split("\n");
            const startLine = linesUpToMatch.length;
            const snippet = content.split("\n").slice(Math.max(0, startLine - 3), startLine + 3).join("\n");
            findings.push({
              id: `finding-${createHash("sha256").update(`${relPath}:${startLine}:${rule.id}`).digest("hex").slice(0, 12)}`,
              projectId,
              title: rule.title,
              description: rule.description,
              bugClass: rule.bugClass,
              severity: rule.severity,
              status: "hypothesis",
              cwe: KNOWN_CWE_MAPPINGS[rule.bugClass] || "CWE-699",
              primaryLocation: {
                filePath: relPath,
                startLine,
                endLine: startLine,
                snippet,
                fileHash
              },
              impactSummary: `Vulnerability of class ${rule.bugClass} identified in ${relPath} at line ${startLine}.`,
              discoveredBy: "aegis-pattern-scanner",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            if (!rule.pattern.global) {
              break;
            }
            if (match[0].length === 0) {
              rule.pattern.lastIndex++;
            }
          }
        }
      } catch {
        continue;
      }
    }
    return findings;
  }
}
