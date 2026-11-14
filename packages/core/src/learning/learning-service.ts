import { randomUUID, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LearningStore, LearningWorkItem } from "@heimdall/db";
import type { WorkflowStore } from "@heimdall/db";
import type {
  LearningEvent,
  KnowledgeEntry,
  ImprovementCandidate,
  SourceLink,
  WorkflowSelfHealingProposal
} from "@heimdall/shared";

export interface LearningServiceConfig {
  maxEventsPerTick?: number;
  enableAutoHeal?: boolean;
}

export class LearningService {
  private readonly workerId = `learning-worker-${randomUUID().slice(0, 8)}`;
  private isProcessing = false;

  constructor(
    private readonly learningStore: LearningStore,
    private readonly workflowStore?: WorkflowStore,
    private readonly config: LearningServiceConfig = {}
  ) {}

  /**
   * Process pending items from the background work queue.
   */
  async tick(): Promise<{ processed: number; retried: number }> {
    if (this.isProcessing) return { processed: 0, retried: 0 };
    this.isProcessing = true;
    let processed = 0;
    let retried = 0;
    const maxItems = this.config.maxEventsPerTick ?? 20;

    try {
      for (let i = 0; i < maxItems; i++) {
        const work = this.learningStore.claimWork(this.workerId);
        if (!work) break;

        try {
          await this.processWorkItem(work);
          this.learningStore.completeWork(work.id, work.claimToken!);
          processed++;
        } catch (error) {
          this.learningStore.retryWork(work.id, work.claimToken!, 5000);
          retried++;
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processed, retried };
  }

  private async processWorkItem(work: LearningWorkItem): Promise<void> {
    const event = this.learningStore.getEvent(work.eventId);
    if (!event) return;

    if (work.kind === "derive_knowledge") {
      // Derive structured knowledge from significant findings or verifications
      if (event.category === "verification" && event.outcome === "success") {
        this.learningStore.putKnowledge({
          projectId: event.projectId,
          summary: `Verified Vulnerability Pattern: ${event.summary}`,
          category: "vulnerability_pattern",
          sourceLinks: event.sourceLinks || [],
          evidenceEventIds: [event.id]
        });
      }

      // Check for workflow step failures that warrant self-healing
      if (event.category === "workflow_step" && event.outcome === "failure") {
        this.checkWorkflowSelfHealing(event);
      }
    }
  }

  /**
   * Evaluates whether a broken workflow step should suggest a self-healing rollback.
   */
  private checkWorkflowSelfHealing(failedEvent: LearningEvent): void {
    if (!this.workflowStore || !failedEvent.workflowId || !failedEvent.stepId) return;

    const runs = this.workflowStore.listRuns(failedEvent.workflowId);
    const recentRuns = runs.slice(-5);
    const failedRuns = recentRuns.filter(r => r.nodeResults[failedEvent.stepId!]?.status === "failed");

    if (failedRuns.length >= 3) {
      // Identify last successful revision
      const lastSuccessful = runs
        .reverse()
        .find(r => r.status === "completed" && r.nodeResults[failedEvent.stepId!]?.status === "completed");

      if (lastSuccessful && lastSuccessful.workflowRevision < (recentRuns[0]?.workflowRevision ?? 1)) {
        this.learningStore.createSelfHealingProposal({
          workflowId: failedEvent.workflowId,
          stepId: failedEvent.stepId,
          failedRevision: recentRuns[0]?.workflowRevision ?? 1,
          restoreToRevision: lastSuccessful.workflowRevision,
          consecutiveFailures: failedRuns.length,
          rationale: `Step "${failedEvent.stepId}" failed in ${failedRuns.length} consecutive runs after recent instruction modifications. Proposing rollback to stable revision ${lastSuccessful.workflowRevision}.`,
          evidenceEventIds: [failedEvent.id]
        });
      }
    }
  }

  /**
   * Refreshes knowledge freshness by checking current source files on disk.
   */
  refreshKnowledgeFreshness(projectId: string, projectRoot: string): { active: number; invalidated: number } {
    const entries = this.learningStore.listKnowledge({ projectId, status: "current" });
    let active = 0;
    let invalidated = 0;

    for (const entry of entries) {
      let stillValid = true;

      for (const link of entry.sourceLinks) {
        const fullPath = resolve(projectRoot, link.path);
        if (!existsSync(fullPath)) {
          stillValid = false;
          break;
        }

        try {
          const contents = readFileSync(fullPath);
          const currentHash = `sha256:${createHash("sha256").update(contents).digest("hex")}`;
          if (currentHash !== link.hash) {
            stillValid = false;
            break;
          }
        } catch {
          stillValid = false;
          break;
        }
      }

      if (!stillValid) {
        this.learningStore.setKnowledgeStatus(entry.id, "stale");
        invalidated++;
      } else {
        active++;
      }
    }

    return { active, invalidated };
  }

  /**
   * Record a learning event from external pipeline components.
   */
  recordEvent(input: Omit<LearningEvent, "id" | "createdAt">): LearningEvent {
    return this.learningStore.appendEvent(input);
  }
}
