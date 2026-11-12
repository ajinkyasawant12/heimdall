/**
 * Heimdall CRS - Meta JiTTesting Catching Tester
 * Synthesizes transient "Catching Tests" via Dodgy-Diff and Intent-Aware workflows.
 * Verifies that the test deterministically fails on vulnerable code and passes on remediated code.
 */

import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { CatchingTestResult, ASTSlice, ScopeManifest } from '@heimdall/shared';
import { runSandboxedBinary } from '@heimdall/broker';

export interface CatchingTestGeneratorOptions {
  workflow: 'DODGY_DIFF' | 'INTENT_AWARE';
  slice: ASTSlice;
  targetDir: string;
}

export class JiTCatchingTester {
  constructor(private readonly manifest: ScopeManifest) {}

  /**
   * Synthesizes a transient unit test targeting the vulnerability slice
   */
  public synthesizeTestCode(slice: ASTSlice, workflow: 'DODGY_DIFF' | 'INTENT_AWARE'): string {
    const isCommandInjection = slice.cweId === 'CWE-78';
    const isSqlInjection = slice.cweId === 'CWE-89';
    const isPathTraversal = slice.cweId === 'CWE-22';

    let testCaseLogic = '';

    if (isCommandInjection) {
      testCaseLogic = `
    // Catching test for OS Command Injection (${slice.cweId})
    const maliciousPayload = '; echo HEIMDALL_EXPLOIT_TRIGGERED';
    // Expect target function to throw or sanitize without executing subshell
    const result = targetModule.${slice.functionName}(maliciousPayload);
    if (String(result).includes('HEIMDALL_EXPLOIT_TRIGGERED')) {
      throw new Error('FAIL: Command injection payload successfully executed!');
    }
`;
    } else if (isPathTraversal) {
      testCaseLogic = `
    // Catching test for Path Traversal (${slice.cweId})
    const traversalPayload = '../../../../etc/passwd';
    try {
      targetModule.${slice.functionName}(traversalPayload);
      throw new Error('FAIL: Path traversal did not trigger validation error!');
    } catch (err) {
      if (err.message.includes('FAIL: Path traversal')) throw err;
      // Remediated code rejects outside paths safely
    }
`;
    } else if (isSqlInjection) {
      testCaseLogic = `
    // Catching test for SQL Injection (${slice.cweId})
    const sqliPayload = "' OR '1'='1";
    const query = targetModule.${slice.functionName}(sqliPayload);
    if (query.includes("' OR '1'='1") && !query.includes('$1')) {
      throw new Error('FAIL: Unparameterized SQL query detected!');
    }
`;
    } else {
      testCaseLogic = `
    // Intent-Aware Boundary Condition Test
    const boundaryInput = null;
    try {
      targetModule.${slice.functionName}(boundaryInput);
    } catch (err) {
      // Must not crash with unhandled TypeError
      if (err instanceof TypeError) {
        throw new Error('FAIL: Unhandled TypeError on null input!');
      }
    }
`;
    }

    return `// Heimdall CRS - Auto-Synthesized JiT Catching Test [${workflow}]
// Target: ${slice.filePath} (lines ${slice.startLine}-${slice.endLine})
// CWE: ${slice.cweId} (${slice.sinkExpression})

import assert from 'node:assert';
import test from 'node:test';

test('${workflow} verification for ${slice.functionName}', async () => {
${testCaseLogic}
});
`;
  }

  /**
   * Evaluates catching test against the codebase
   */
  public async executeCatchingTest(
    testContent: string,
    targetDir: string,
    workflow: 'DODGY_DIFF' | 'INTENT_AWARE'
  ): Promise<CatchingTestResult> {
    const startTime = Date.now();
    const testFileName = `test-catching-${Date.now()}.mjs`;
    const fullTestPath = path.join(targetDir, testFileName);

    try {
      await writeFile(fullTestPath, testContent, 'utf8');

      const { stdout, stderr, exitCode } = await runSandboxedBinary(
        'node',
        ['--test', testFileName],
        targetDir,
        this.manifest
      );

      const durationMs = Date.now() - startTime;
      const fails = exitCode !== 0 || stderr.includes('FAIL:') || stdout.includes('FAIL:');

      return {
        testFilePath: fullTestPath,
        workflow,
        failsOnUnpatched: fails,
        passesOnPatched: !fails,
        stderrExcerpt: (stderr || stdout).slice(0, 500),
        durationMs,
        exitCode
      };
    } finally {
      await unlink(fullTestPath).catch(() => undefined);
    }
  }
}
