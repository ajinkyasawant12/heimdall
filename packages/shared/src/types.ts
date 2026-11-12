/**
 * Heimdall CRS - Master Domain Types & Contracts
 * Compliant with Big 4 Security Audit Specification (AGENTS.md)
 */

export type FindingState =
  | 'hypothesis'
  | 'reproduction_failed'
  | 'confirmed_reproducible'
  | 'patch_synthesized'
  | 'regression_failed'
  | 'verified_remediated';

export type TargetModality = 'APPSEC_SOURCE' | 'NATIVE_BINARY';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ASTSlice {
  filePath: string;
  fileSha256: string;
  functionName: string;
  startLine: number;
  endLine: number;
  sinkExpression: string;
  cweId: string;
  sourceCode: string;
}

export interface SMTProofResult {
  status: 'SAT_COUNTEREXAMPLE' | 'UNSAT_PROVED' | 'TIMEOUT';
  smtLib2Query: string;
  counterexampleModel?: Record<string, string | number>;
  durationMs: number;
}

export interface CatchingTestResult {
  testFilePath: string;
  workflow: 'DODGY_DIFF' | 'INTENT_AWARE';
  failsOnUnpatched: boolean;
  passesOnPatched: boolean;
  stderrExcerpt: string;
  durationMs: number;
  exitCode: number;
}

export interface PolicyCertificate {
  actionHash: string;
  prevLedgerHash: string;
  merkleRoot: string;
  ed25519Signature: string;
  issuedAtIso: string;
}

export interface ProposedPatch {
  id: string;
  findingId: string;
  filePath: string;
  diff: string;
  explanation: string;
  regressionTestsPassed: boolean;
  catchingTestNeutralized: boolean;
  smtProofUnsat?: boolean;
  astGuardPassed: boolean;
  createdAt: string;
}

export interface SecurityFinding {
  id: string;
  projectId: string;
  title: string;
  description: string;
  bugClass: string;
  severity: SeverityLevel;
  state: FindingState;
  cwe?: string;
  cve?: string;
  slice: ASTSlice;
  catchingTest?: CatchingTestResult;
  smtProof?: SMTProofResult;
  patch?: ProposedPatch;
  discoveredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScopeManifest {
  version: string;
  allowedRootPaths: string[];
  allowedBinaries: string[];
  maxSubprocessTimeoutMs: number;
  maxMemoryMb?: number;
  allowNetworkInSandbox?: boolean;
}
