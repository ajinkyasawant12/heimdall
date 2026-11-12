import { randomUUID } from "node:crypto";
import { PersistentStore, getDefaultHeimdallDbDir } from "./storage-engine.js";
export class WorkflowStore {
  defsStore;
  runsStore;
  constructor(dbDir = getDefaultHeimdallDbDir()) {
    this.defsStore = new PersistentStore(dbDir, "workflow_definitions");
    this.runsStore = new PersistentStore(dbDir, "workflow_runs");
  }
  saveDefinition(def) {
    const now = new Date().toISOString();
    const record = {
      ...def,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    return this.defsStore.put(record);
  }
  getDefinition(id) {
    return this.defsStore.get(id);
  }
  listDefinitions() {
    return this.defsStore.getAll();
  }
  createRun(workflowId, workflowRevision, projectId) {
    const record = {
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
  updateRunStep(runId, stepResult) {
    const run = this.runsStore.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    run.nodeResults[stepResult.stepId] = stepResult;
    return this.runsStore.put(run);
  }
  completeRun(runId, status) {
    const run = this.runsStore.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    run.status = status;
    run.completedAt = new Date().toISOString();
    return this.runsStore.put(run);
  }
  listRuns(workflowId) {
    return this.runsStore.query(r => !workflowId || r.workflowId === workflowId);
  }
}
