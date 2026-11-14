/**
 * Heimdall CRS - Deterministic AST Slicer
 * Based on Graham Helton's Unprompted Harness Engineering.
 * Replaces stochastic line-guessing with byte-accurate syntactic boundary slicing.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const KNOWN_SINKS = [{
  cweId: 'CWE-78',
  sinkName: 'OS Command Injection',
  regex: /(?:exec|execSync|spawn|spawnSync|popen|system)\s*\(\s*[`'"].*?\$\{.*?\}/g,
  description: 'Direct shell execution with interpolated dynamic variables.'
}, {
  cweId: 'CWE-89',
  sinkName: 'SQL Injection',
  regex: /(?:query|execute|raw)\s*\(\s*[`'"].*?(?:SELECT|INSERT|UPDATE|DELETE).*?\$\{.*?\}/gi,
  description: 'Unescaped SQL query string concatenation or template literal.'
}, {
  cweId: 'CWE-94',
  sinkName: 'Code Injection',
  regex: /(?:eval|Function)\s*\(/g,
  description: 'Dynamic JavaScript code evaluation sink.'
}, {
  cweId: 'CWE-22',
  sinkName: 'Path Traversal',
  regex: /(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync)\s*\(\s*(?:path\.join|path\.resolve|\w+)\s*,\s*(?:\.\.|\w+)/g,
  description: 'File operation without canonicalization or scope boundary check.'
}, {
  cweId: 'CWE-502',
  sinkName: 'Insecure Deserialization',
  regex: /(?:unserialize|deserialize|yaml\.load|pickle\.loads)\s*\(/g,
  description: 'Arbitrary object instantiation via untrusted serializer.'
}];
export class DeterministicASTSlicer {
  /**
   * Slice a source file to extract syntactic function boundaries enclosing security-critical sinks.
   */
  async sliceFile(filePath) {
    const content = await readFile(filePath, 'utf8');
    const fileSha256 = createHash('sha256').update(content).digest('hex');
    const lines = content.split('\n');
    const slices = [];
    for (const sink of KNOWN_SINKS) {
      let match;
      const regex = new RegExp(sink.regex.source, sink.regex.flags);
      while ((match = regex.exec(content)) !== null) {
        const offset = match.index;
        const matchedText = match[0];

        // Find 1-indexed line number for the sink
        const prefix = content.slice(0, offset);
        const sinkLineNumber = prefix.split('\n').length;

        // Extract enclosing function/block boundaries
        const boundary = this.findEnclosingFunction(lines, sinkLineNumber);
        slices.push({
          filePath: path.resolve(filePath),
          fileSha256,
          functionName: boundary.name,
          startLine: boundary.startLine,
          endLine: boundary.endLine,
          sinkExpression: matchedText.trim(),
          cweId: sink.cweId,
          sourceCode: lines.slice(boundary.startLine - 1, boundary.endLine).join('\n')
        });
      }
    }
    return slices;
  }

  /**
   * Deterministically scans upward to find the function signature or enclosing block
   */
  findEnclosingFunction(lines, targetLine) {
    let startLine = targetLine;
    let endLine = Math.min(lines.length, targetLine + 15);
    let name = 'anonymous_scope';

    // Walk backward to find function / method declaration
    const funcRegex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{)/;
    for (let i = targetLine - 1; i >= Math.max(0, targetLine - 40); i--) {
      const match = lines[i].match(funcRegex);
      if (match) {
        name = match[1] || match[2] || match[3] || 'anonymous';
        startLine = i + 1;
        break;
      }
    }

    // Walk forward to find enclosing closing brace
    let braceCount = 0;
    let foundStart = false;
    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundStart = true;
        } else if (char === '}') {
          braceCount--;
          if (foundStart && braceCount <= 0 && i >= targetLine - 1) {
            endLine = i + 1;
            return {
              name,
              startLine,
              endLine
            };
          }
        }
      }
    }
    return {
      name,
      startLine,
      endLine
    };
  }
}
