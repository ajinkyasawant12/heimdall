/**
 * Heimdall CRS - Learning & Memory Ledger Contracts
 * Durable, source-grounded memory and evolutionary improvement contracts.
 */

export type EvidenceStrength = "operational" | "hypothesis" | "verified" | "human_feedback";
export type KnowledgeFreshness = "current" | "stale" | "invalidated";
export type CandidateStatus = "proposed" | "evaluating" | "active" | "rejected" | "retired";

export interface SourceLink {
  path: string;
  hash: string; // sha256 of file contents at recording time
}

export interface LearningEvent {
  id: string;
  idempotencyKey: string;
  projectId: string;
  category: "finding" | "verification" | "workflow_run" | "workflow_step" | "evolution" | "source_context";
  outcome: "success" | "failure" | "inconclusive" | "recorded";
  summary: string;
  strength: EvidenceStrength;
  sourceLinks?: SourceLink[];
  evidenceIds?: string[];
  workflowId?: string;
  stepId?: string;
  executionId?: string;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  projectId: string;
  summary: string;
  category: string;
  sourceLinks: SourceLink[];
  evidenceEventIds: string[];
  status: KnowledgeFreshness;
  createdAt: string;
  updatedAt: string;
}

export interface ImprovementCandidate {
  id: string;
  projectId: string;
  kind: "prompt_refinement" | "heuristic_rule" | "workflow_instruction";
  targetId: string;
  baseVersion: string;
  proposal: string;
  status: CandidateStatus;
  revision: number;
  evidenceEventIds: string[];
  evaluations: EvaluationReceipt[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationReceipt {
  id: string;
  candidateId: string;
  baselineDigest: string;
  candidateDigest: string;
  evaluatorIdentity: string;
  suiteDigest: string;
  passed: boolean;
  metrics: {
    baselineAccuracy: number;
    candidateAccuracy: number;
    baselinePrecision: number;
    candidatePrecision: number;
  };
  createdAt: string;
}

export interface WorkflowSelfHealingProposal {
  id: string;
  workflowId: string;
  stepId: string;
  failedRevision: number;
  restoreToRevision: number;
  consecutiveFailures: number;
  rationale: string;
  evidenceEventIds: string[];
  createdAt: string;
}
