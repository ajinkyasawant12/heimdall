import { randomUUID } from "node:crypto";
import { PersistentStore, getDefaultHeimdallDbDir } from "./storage-engine.js";
export class LearningStore {
  eventsStore;
  knowledgeStore;
  candidatesStore;
  workStore;
  proposalsStore;
  constructor(dbDir = getDefaultHeimdallDbDir()) {
    this.eventsStore = new PersistentStore(dbDir, "learning_events");
    this.knowledgeStore = new PersistentStore(dbDir, "learning_knowledge");
    this.candidatesStore = new PersistentStore(dbDir, "learning_candidates");
    this.workStore = new PersistentStore(dbDir, "learning_work");
    this.proposalsStore = new PersistentStore(dbDir, "learning_proposals");
  }

  // --- Events ---
  appendEvent(input) {
    const existing = this.eventsStore.query(e => e.idempotencyKey === input.idempotencyKey)[0];
    if (existing) {
      return existing;
    }
    const event = {
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
  getEvent(id) {
    return this.eventsStore.get(id);
  }
  listEvents(options = {}) {
    let items = this.eventsStore.getAll();
    if (options.projectId) {
      items = items.filter(e => e.projectId === options.projectId);
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return options.limit ? items.slice(0, options.limit) : items;
  }

  // --- Knowledge ---
  putKnowledge(input) {
    const now = new Date().toISOString();
    const existing = this.knowledgeStore.query(k => k.projectId === input.projectId && k.summary === input.summary)[0];
    if (existing) {
      existing.sourceLinks = input.sourceLinks;
      existing.evidenceEventIds = Array.from(new Set([...existing.evidenceEventIds, ...input.evidenceEventIds]));
      existing.status = "current";
      existing.updatedAt = now;
      return this.knowledgeStore.put(existing);
    }
    const entry = {
      ...input,
      id: randomUUID(),
      status: "current",
      createdAt: now,
      updatedAt: now
    };
    return this.knowledgeStore.put(entry);
  }
  listKnowledge(options = {}) {
    return this.knowledgeStore.query(k => {
      if (options.projectId && k.projectId !== options.projectId) return false;
      if (options.status && k.status !== options.status) return false;
      return true;
    });
  }
  setKnowledgeStatus(id, status) {
    const entry = this.knowledgeStore.get(id);
    if (entry) {
      entry.status = status;
      entry.updatedAt = new Date().toISOString();
      this.knowledgeStore.put(entry);
    }
  }

  // --- Improvement Candidates ---
  putCandidate(input) {
    const now = new Date().toISOString();
    const candidate = {
      ...input,
      id: randomUUID(),
      revision: 1,
      evaluations: [],
      createdAt: now,
      updatedAt: now
    };
    return this.candidatesStore.put(candidate);
  }
  getCandidate(id) {
    return this.candidatesStore.get(id);
  }
  listCandidates(options = {}) {
    return this.candidatesStore.query(c => !options.projectId || c.projectId === options.projectId);
  }
  recordEvaluation(candidateId, receipt) {
    const candidate = this.candidatesStore.get(candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);
    const fullReceipt = {
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
  claimWork(workerId, leaseDurationMs = 60_000) {
    const now = Date.now();
    const available = this.workStore.query(w => w.status === "pending" || w.status === "claimed" && w.leaseUntil !== null && w.leaseUntil < now)[0];
    if (!available) return null;
    available.status = "claimed";
    available.owner = workerId;
    available.claimToken = randomUUID();
    available.leaseUntil = now + leaseDurationMs;
    available.attempts += 1;
    return this.workStore.put(available);
  }
  completeWork(workId, claimToken) {
    const item = this.workStore.get(workId);
    if (item && item.claimToken === claimToken) {
      item.status = "completed";
      item.leaseUntil = null;
      this.workStore.put(item);
    }
  }
  retryWork(workId, claimToken, delayMs = 5000) {
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
  createSelfHealingProposal(proposal) {
    const record = {
      ...proposal,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    return this.proposalsStore.put(record);
  }
  listSelfHealingProposals(workflowId) {
    return this.proposalsStore.query(p => !workflowId || p.workflowId === workflowId);
  }
}
