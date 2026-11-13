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

export type RogueAgentViolationType =
  | 'SANDBOX_PATH_BREAKOUT'
  | 'FORBIDDEN_SYSCALL_OR_BINARY'
  | 'UNAUTHORIZED_NETWORK_EGRESS'
  | 'GUARDRAIL_SELF_MODIFICATION'
  | 'ROLE_PRIVILEGE_ESCALATION'
  | 'TROJAN_PATCH_BACKDOOR'
  | 'ANTI_CHEAT_TEST_TAMPERING';

export interface RogueAgentActionProposal {
  id: string;
  agentId: string;
  agentRole: 'AST_AUDITOR' | 'SMT_PROVER' | 'JIT_TESTER' | 'PATCH_SYNTHESIZER' | 'EVOLUTION_CONTROLLER';
  triggerContext: string;
  operation: 'READ_AST' | 'RUN_Z3' | 'RUN_SANDBOX_TEST' | 'APPLY_GIT_DIFF' | 'MUTATE_PARAM' | 'EXEC_COMMAND' | 'NETWORK_REQUEST';
  targetPath: string;
  binary?: string;
  commandArgs?: string[];
  networkHost?: string;
  proposedDiffOrCode?: string;
  metadata?: Record<string, unknown>;
}

export interface RogueInterceptVerdict {
  actionId: string;
  agentId: string;
  agentRole: string;
  status: 'APPROVED_SAFE' | 'QUARANTINED_ROGUE';
  blockedByLayer?: 'LAYER_1_OPENSHELL_KERNEL_FENCE' | 'LAYER_2_Z3_CEDAR_POLICY_PROVER' | 'LAYER_3_AST_BACKDOOR_GATE';
  violationType?: RogueAgentViolationType;
  formalProofPredicate: string;
  smtStatus: 'UNSAT_SAFE' | 'SAT_VIOLATION_WITNESS';
  witnessCounterexample?: string;
  quarantineAction: 'NONE' | 'PROCESS_KILLED_AND_STATE_ROLLED_BACK';
  ed25519ReceiptSig: string;
  merkleEntryHash?: string;
  evaluatedAt: string;
}
