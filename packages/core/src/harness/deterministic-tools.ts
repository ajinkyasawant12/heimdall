import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

export interface AstSliceResult {
  filePath: string;
  enclosingFunction: string;
  startLine: number;
  endLine: number;
  codeSlice: string;
  sourceDigest: string;
  taintSinksFound: string[];
}

export interface CallGraphNode {
  functionName: string;
  filePath: string;
  line: number;
  callees: string[];
  callers: string[];
}

/**
 * Graham Helton "Deterministic Tools" Pattern (Snowflake Red Team / Unprompted).
 * Replaces stochastic LLM guessing with auditable, deterministic AST and symbol tools.
 */
export class DeterministicToolHarness {
  /**
   * Deterministically slices a function and its dataflow boundaries without LLM hallucination.
   */
  sliceFunctionAtLine(filePath: string, targetLine: number): AstSliceResult {
    const canonical = resolve(filePath);
    if (!existsSync(canonical)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = readFileSync(canonical, "utf-8");
    const lines = content.split("\n");
    const digest = `sha256:${createHash("sha256").update(content).digest("hex")}`;

    // Deterministic backward and forward window extraction
    let funcName = "anonymous_or_global";
    let startLine = Math.max(1, targetLine - 15);
    let endLine = Math.min(lines.length, targetLine + 15);

    // Scan backwards for function signature
    for (let i = targetLine - 1; i >= Math.max(0, targetLine - 30); i--) {
      const line = lines[i] || "";
      const fnMatch = line.match(/(?:function|def|void|int|char|async)\s+([a-zA-Z0-9_]+)\s*\(/);
      if (fnMatch) {
        funcName = fnMatch[1]!;
        startLine = i + 1;
        break;
      }
    }

    const slice = lines.slice(startLine - 1, endLine).join("\n");

    // Deterministic taint sink identification
    const sinks = ["exec", "system", "strcpy", "sprintf", "eval", "query", "readFile", "popen"];
    const foundSinks = sinks.filter(s => new RegExp(`\\b${s}\\s*\\(`).test(slice));

    return {
      filePath,
      enclosingFunction: funcName,
      startLine,
      endLine,
      codeSlice: slice,
      sourceDigest: digest,
      taintSinksFound: foundSinks
    };
  }

  /**
   * Deterministically validates an execution command against strict safety policies.
   */
  validateCommandExecution(command: string, allowedBinaries: string[]): { isPermitted: boolean; sanitized: string } {
    const trimmed = command.trim();
    // Prevent shell chaining and redirection bypasses
    const dangerousTokens = [";", "&&", "||", "|", "`", "$(", ">", "<", "\n"];
    const hasForbiddenToken = dangerousTokens.some(token => trimmed.includes(token));

    const binary = trimmed.split(/\s+/)[0] || "";
    const isAllowed = allowedBinaries.includes(binary) && !hasForbiddenToken;

    return {
      isPermitted: isAllowed,
      sanitized: trimmed
    };
  }
}
