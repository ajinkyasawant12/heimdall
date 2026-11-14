/**
 * Heimdall CRS - Security Workflows & Execution Graph Contracts
 */

export type StepExecutionStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowNode {
  id: string;
  label: string;
  agentRole: "auditor" | "verifier" | "patcher" | "coordinator" | "evaluator";
  instructions: string;
  inputs: string[]; // IDs of preceding nodes
  timeoutSeconds: number;
}

export interface SecurityWorkflowDefinition {
  id: string;
  name: string;
  description: string;
  revision: number;
  nodes: WorkflowNode[];
  targetPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepExecutionResult {
  stepId: string;
  status: StepExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  outputSummary?: string;
  emittedFindings?: string[];
  error?: string;
}

export interface WorkflowRunRecord {
  id: string;
  workflowId: string;
  workflowRevision: number;
  status: "running" | "completed" | "failed" | "aborted";
  nodeResults: Record<string, StepExecutionResult>;
  startedAt: string;
  completedAt?: string;
  projectId: string;
}
