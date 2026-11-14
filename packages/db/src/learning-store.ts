import { randomUUID, createHash } from "node:crypto";
import { PersistentStore, getDefaultHeimdallDbDir } from "./storage-engine.js";
import type {
  LearningEvent,
  KnowledgeEntry,
  ImprovementCandidate,
  EvaluationReceipt,
  WorkflowSelfHealingProposal,
  SourceLink
} from "@heimdall/shared";

export interface LearningWorkItem {
  id: string;
  eventId: string;
  kind: "derive_knowledge" | "evaluate_candidate" | "verify_staleness";
  status: "pending" | "claimed" | "completed";
  attempts: number;
  availableAt: number;
  leaseUntil: number | null;
  claimToken: string | null;
  owner: string | null;
}

export class LearningStore {
  private readonly eventsStore: PersistentStore<LearningEvent>;
  private readonly knowledgeStore: PersistentStore<KnowledgeEntry>;
  private readonly candidatesStore: PersistentStore<ImprovementCandidate>;
  private readonly workStore: PersistentStore<LearningWorkItem>;
  private readonly proposalsStore: PersistentStore<WorkflowSelfHealingProposal>;

  constructor(dbDir = getDefaultHeimdallDbDir()) {
    this.eventsStore = new PersistentStore<LearningEvent>(dbDir, "learning_events");
    this.knowledgeStore = new PersistentStore<KnowledgeEntry>(dbDir, "learning_knowledge");
    this.candidatesStore = new PersistentStore<ImprovementCandidate>(dbDir, "learning_candidates");
    this.workStore = new PersistentStore<LearningWorkItem>(dbDir, "learning_work");
    this.proposalsStore = new PersistentStore<WorkflowSelfHealingProposal>(dbDir, "learning_proposals");
  }

  // --- Events ---
  appendEvent(input: Omit<LearningEvent, "id" | "createdAt">): LearningEvent {
    const existing = this.eventsStore.query(e => e.idempotencyKey === input.idempotencyKey)[0];
    if (existing) {
      return existing;
    }
    const event: LearningEvent = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.eventsStore.put(event);

    // Queue background derivation work
    this.workStore.put({
      id: randomUUID(),
      eventId: event.id,
      kind: "derive_knowledge",
      status: "pending",
      attempts: 0,
      availableAt: Date.now(),
      leaseUntil: null,
      claimToken: null,
      owner: null
    });

    return event;
  }

  getEvent(id: string): LearningEvent | null {
    return this.eventsStore.get(id);
  }

  listEvents(options: { projectId?: string; limit?: number } = {}): LearningEvent[] {
    let items = this.eventsStore.getAll();
    if (options.projectId) {
      items = items.filter(e => e.projectId === options.projectId);
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return options.limit ? items.slice(0, options.limit) : items;
  }

  // --- Knowledge ---
  putKnowledge(input: Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt" | "status">): KnowledgeEntry {
    const now = new Date().toISOString();
    const existing = this.knowledgeStore.query(
      k => k.projectId === input.projectId && k.summary === input.summary
    )[0];

    if (existing) {
      existing.sourceLinks = input.sourceLinks;
      existing.evidenceEventIds = Array.from(new Set([...existing.evidenceEventIds, ...input.evidenceEventIds]));
      existing.status = "current";
      existing.updatedAt = now;
      return this.knowledgeStore.put(existing);
    }

    const entry: KnowledgeEntry = {
      ...input,
      id: randomUUID(),
      status: "current",
      createdAt: now,
      updatedAt: now
    };
    return this.knowledgeStore.put(entry);
  }

  listKnowledge(options: { projectId?: string; status?: "current" | "stale" } = {}): KnowledgeEntry[] {
    return this.knowledgeStore.query(k => {
      if (options.projectId && k.projectId !== options.projectId) return false;
      if (options.status && k.status !== options.status) return false;
      return true;
    });
  }

  setKnowledgeStatus(id: string, status: "current" | "stale" | "invalidated"): void {
    const entry = this.knowledgeStore.get(id);
    if (entry) {
      entry.status = status;
      entry.updatedAt = new Date().toISOString();
      this.knowledgeStore.put(entry);
    }
  }

  // --- Improvement Candidates ---
  putCandidate(input: Omit<ImprovementCandidate, "id" | "createdAt" | "updatedAt" | "evaluations" | "revision">): ImprovementCandidate {
    const now = new Date().toISOString();
    const candidate: ImprovementCandidate = {
      ...input,
      id: randomUUID(),
      revision: 1,
      evaluations: [],
      createdAt: now,
      updatedAt: now
    };
    return this.candidatesStore.put(candidate);
  }

  getCandidate(id: string): ImprovementCandidate | null {
    return this.candidatesStore.get(id);
  }

  listCandidates(options: { projectId?: string } = {}): ImprovementCandidate[] {
    return this.candidatesStore.query(c => !options.projectId || c.projectId === options.projectId);
  }

  recordEvaluation(candidateId: string, receipt: Omit<EvaluationReceipt, "id" | "candidateId" | "createdAt">): ImprovementCandidate {
    const candidate = this.candidatesStore.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);
    const fullReceipt: EvaluationReceipt = {
      ...receipt,
      id: randomUUID(),
      candidateId,
      createdAt: new Date().toISOString()
    };
    candidate.evaluations.push(fullReceipt);
    candidate.status = receipt.passed ? "active" : "rejected";
    candidate.updatedAt = new Date().toISOString();
    return this.candidatesStore.put(candidate);
  }

  // --- Work Queue (Outbox Pattern) ---
  claimWork(workerId: string, leaseDurationMs = 60_000): LearningWorkItem | null {
    const now = Date.now();
    const available = this.workStore.query(
      w => w.status === "pending" || (w.status === "claimed" && w.leaseUntil !== null && w.leaseUntil < now)
    )[0];

    if (!available) return null;
    available.status = "claimed";
    available.owner = workerId;
    available.claimToken = randomUUID();
    available.leaseUntil = now + leaseDurationMs;
    available.attempts += 1;
    return this.workStore.put(available);
  }

  completeWork(workId: string, claimToken: string): void {
    const item = this.workStore.get(workId);
    if (item && item.claimToken === claimToken) {
      item.status = "completed";
      item.leaseUntil = null;
      this.workStore.put(item);
    }
  }

  retryWork(workId: string, claimToken: string, delayMs = 5000): void {
    const item = this.workStore.get(workId);
    if (item && item.claimToken === claimToken) {
      item.status = "pending";
      item.availableAt = Date.now() + delayMs;
      item.leaseUntil = null;
      item.claimToken = null;
      this.workStore.put(item);
    }
  }

  // --- Self Healing Proposals ---
  createSelfHealingProposal(proposal: Omit<WorkflowSelfHealingProposal, "id" | "createdAt">): WorkflowSelfHealingProposal {
    const record: WorkflowSelfHealingProposal = {
      ...proposal,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    return this.proposalsStore.put(record);
  }

  listSelfHealingProposals(workflowId?: string): WorkflowSelfHealingProposal[] {
    return this.proposalsStore.query(p => !workflowId || p.workflowId === workflowId);
  }
}
