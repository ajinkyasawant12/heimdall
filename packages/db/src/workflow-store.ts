import { randomUUID } from "node:crypto";
import { PersistentStore, getDefaultHeimdallDbDir } from "./storage-engine.js";
import type {
  SecurityWorkflowDefinition,
  WorkflowRunRecord,
  StepExecutionResult
} from "@heimdall/shared";

export class WorkflowStore {
  private readonly defsStore: PersistentStore<SecurityWorkflowDefinition>;
  private readonly runsStore: PersistentStore<WorkflowRunRecord>;

  constructor(dbDir = getDefaultHeimdallDbDir()) {
    this.defsStore = new PersistentStore<SecurityWorkflowDefinition>(dbDir, "workflow_definitions");
    this.runsStore = new PersistentStore<WorkflowRunRecord>(dbDir, "workflow_runs");
  }

  saveDefinition(def: Omit<SecurityWorkflowDefinition, "id" | "createdAt" | "updatedAt">): SecurityWorkflowDefinition {
    const now = new Date().toISOString();
    const record: SecurityWorkflowDefinition = {
      ...def,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    return this.defsStore.put(record);
  }

  getDefinition(id: string): SecurityWorkflowDefinition | null {
    return this.defsStore.get(id);
  }

  listDefinitions(): SecurityWorkflowDefinition[] {
    return this.defsStore.getAll();
  }

  createRun(workflowId: string, workflowRevision: number, projectId: string): WorkflowRunRecord {
    const record: WorkflowRunRecord = {
      id: randomUUID(),
      workflowId,
      workflowRevision,
      status: "running",
      nodeResults: {},
      startedAt: new Date().toISOString(),
      projectId
    };
    return this.runsStore.put(record);
  }

  updateRunStep(runId: string, stepResult: StepExecutionResult): WorkflowRunRecord {
    const run = this.runsStore.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    run.nodeResults[stepResult.stepId] = stepResult;
    return this.runsStore.put(run);
  }

  completeRun(runId: string, status: "completed" | "failed" | "aborted"): WorkflowRunRecord {
    const run = this.runsStore.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    run.status = status;
    run.completedAt = new Date().toISOString();
    return this.runsStore.put(run);
  }

  listRuns(workflowId?: string): WorkflowRunRecord[] {
    return this.runsStore.query(r => !workflowId || r.workflowId === workflowId);
  }
}
