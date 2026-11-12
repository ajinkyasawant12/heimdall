/**
 * Heimdall CRS - Differential Regression & Anti-Cheat Patch Gate
 * Rejects "cheat patches" that pass tests by deleting routes, stripping exports,
 * or introducing empty catch {} blocks.
 */

export interface PatchGateReport {
  accepted: boolean;
  reason?: string;
  catchingTestNeutralized: boolean;
  baselineSuitePassed: boolean;
  smtProofUnsat: boolean;
  astGuardPassed: boolean;
}

export function verifyAstPatchIntegrity(originalSource: string, patchedSource: string): {
  passed: boolean;
  violation?: string;
} {
  // 1. Reject empty catch blocks introduced by the patch
  const emptyCatchRegex = /catch\s*\([^)]*\)\s*\{\s*\}/g;
  const origEmptyCatches = (originalSource.match(emptyCatchRegex) ?? []).length;
  const patchedEmptyCatches = (patchedSource.match(emptyCatchRegex) ?? []).length;
  if (patchedEmptyCatches > origEmptyCatches) {
    return { passed: false, violation: 'Anti-Cheat Violation: Patch introduces an empty catch block that swallows errors.' };
  }

  // 2. Reject deletion of exported functions, classes, or routes
  const exportRegex = /export\s+(?:async\s+)?(?:function|const|class)\s+([a-zA-Z0-9_]+)/g;
  const origExports = [...originalSource.matchAll(exportRegex)].map((m) => m[1]);
  const patchedExports = new Set([...patchedSource.matchAll(exportRegex)].map((m) => m[1]));
  for (const exp of origExports) {
    if (!patchedExports.has(exp)) {
      return { passed: false, violation: `Anti-Cheat Violation: Patch deleted exported symbol '${exp}'.` };
    }
  }

  // 3. Reject blanket deletion of security-sensitive route handlers
  const routeRegex = /(?:app|router)\.(?:get|post|put|delete|patch)\s*\(\s*['"][^'"]+['"]/g;
  const origRoutes = [...originalSource.matchAll(routeRegex)].map((m) => m[0]);
  const patchedRoutes = new Set([...patchedSource.matchAll(routeRegex)].map((m) => m[0]));
  for (const route of origRoutes) {
    if (!patchedRoutes.has(route)) {
      return { passed: false, violation: `Anti-Cheat Violation: Patch removed route handler '${route}'.` };
    }
  }

  return { passed: true };
}

export class RegressionGate {
  public evaluatePatch(params: {
    originalSource: string;
    patchedSource: string;
    catchingTestNeutralized: boolean;
    baselineSuitePassed: boolean;
    smtProofUnsat: boolean;
  }): PatchGateReport {
    const astCheck = verifyAstPatchIntegrity(params.originalSource, params.patchedSource);

    if (!astCheck.passed) {
      return {
        accepted: false,
        reason: astCheck.violation,
        catchingTestNeutralized: params.catchingTestNeutralized,
        baselineSuitePassed: params.baselineSuitePassed,
        smtProofUnsat: params.smtProofUnsat,
        astGuardPassed: false
      };
    }

    if (!params.catchingTestNeutralized) {
      return {
        accepted: false,
        reason: 'Catching test continues to fail; flaw not neutralized.',
        catchingTestNeutralized: false,
        baselineSuitePassed: params.baselineSuitePassed,
        smtProofUnsat: params.smtProofUnsat,
        astGuardPassed: true
      };
    }

    if (!params.baselineSuitePassed) {
      return {
        accepted: false,
        reason: 'Patch caused a regression in the baseline test suite.',
        catchingTestNeutralized: true,
        baselineSuitePassed: false,
        smtProofUnsat: params.smtProofUnsat,
        astGuardPassed: true
      };
    }

    return {
      accepted: true,
      catchingTestNeutralized: true,
      baselineSuitePassed: true,
      smtProofUnsat: params.smtProofUnsat,
      astGuardPassed: true
    };
  }
}
