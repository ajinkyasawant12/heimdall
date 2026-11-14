/**
 * Heimdall CRS - Trajectory Caching & Plan Controller Schemas
 * Inspired by enterprise trajectory reuse patterns, implemented natively for
 * formal vulnerability remediation and cryptographic ledger caching.
 */

export interface TrajectoryActionStep {
  stepIndex: number;
  stepName: string;
  operation: 'EXTRACT_AST' | 'PROVE_SMT' | 'EXECUTE_CATCHING_TEST' | 'APPLY_PATCH' | 'VERIFY_ANTI_CHEAT';
  toolName: string;
  parameters: Record<string, unknown>;
  expectedOutcome: string;
  actualOutcome?: string;
  durationMs?: number;
}

export interface RemediationTrajectory {
  trajectoryId: string;
  cweId: string;
  sinkSignature: string;
  structuralPatternHash: string;
  steps: TrajectoryActionStep[];
  smtInvariantTemplate?: string;
  catchingTestTemplate?: string;
  surgicalPatchTemplate: string;
  notarizedLedgerHash: string;
  ed25519Signature: string;
  executionCount: number;
  lastExecutedIso: string;
  successRate: number;
}

export interface TrajectoryLookupResult {
  hit: boolean;
  confidence: number;
  trajectory?: RemediationTrajectory;
  variableBindings?: Record<string, string>;
  strategy: 'REPLAY_PROVEN_TRAJECTORY' | 'SYNTHESIZE_NEW_PATH';
}
