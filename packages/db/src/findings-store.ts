import { randomUUID } from "node:crypto";
import { PersistentStore, getDefaultHeimdallDbDir } from "./storage-engine.js";
import type {
  SecurityFinding,
  FindingStatus,
  FindingState,
  SeverityLevel,
  ProofOfVulnerability,
  ProposedPatch
} from "@heimdall/shared";

export class FindingsStore {
  private readonly store: PersistentStore<SecurityFinding>;

  constructor(dbDir = getDefaultHeimdallDbDir()) {
    this.store = new PersistentStore<SecurityFinding>(dbDir, "findings");
  }

  create(finding: Omit<SecurityFinding, "id" | "createdAt" | "updatedAt">): SecurityFinding {
    const now = new Date().toISOString();
    const record: SecurityFinding = {
      ...finding,
      id: randomUUID(),
      lifecycleState: 'hypothesis',
      createdAt: now,
      updatedAt: now
    };
    return this.store.put(record);
  }

  get(id: string): SecurityFinding | null {
    return this.store.get(id);
  }

  list(filters: {
    projectId?: string;
    status?: FindingStatus;
    lifecycleState?: FindingState;
    severity?: SeverityLevel;
    bugClass?: string;
  } = {}): SecurityFinding[] {
    return this.store.query(f => {
      if (filters.projectId && f.projectId !== filters.projectId) return false;
      if (filters.status && f.status !== filters.status) return false;
      if (filters.lifecycleState && f.lifecycleState !== filters.lifecycleState) return false;
      if (filters.severity && f.severity !== filters.severity) return false;
      if (filters.bugClass && f.bugClass !== filters.bugClass) return false;
      return true;
    });
  }

  transitionLifecycle(
    id: string,
    toState: FindingState,
    metadata?: { containerDigest?: string; testSeed?: string; notes?: string }
  ): SecurityFinding {
    const finding = this.store.get(id);
    if (!finding) throw new Error(`Finding ${id} not found`);

    finding.lifecycleState = toState;
    if (toState === 'confirmed_reproducible') finding.status = 'confirmed';
    if (toState === 'verified_remediated') finding.status = 'patched';
    if (toState === 'reproduction_failed') finding.status = 'invalidated';

    finding.updatedAt = new Date().toISOString();
    return this.store.put(finding);
  }

  updateStatus(id: string, status: FindingStatus): SecurityFinding {
    const finding = this.store.get(id);
    if (!finding) throw new Error(`Finding ${id} not found`);
    finding.status = status;
    finding.updatedAt = new Date().toISOString();
    return this.store.put(finding);
  }

  attachPoV(id: string, pov: ProofOfVulnerability): SecurityFinding {
    const finding = this.store.get(id);
    if (!finding) throw new Error(`Finding ${id} not found`);
    finding.pov = pov;
    if (pov.verified) {
      finding.status = "confirmed";
      finding.lifecycleState = "confirmed_reproducible";
    } else {
      finding.lifecycleState = "reproduction_failed";
    }
    finding.updatedAt = new Date().toISOString();
    return this.store.put(finding);
  }

  attachPatch(id: string, patch: ProposedPatch): SecurityFinding {
    const finding = this.store.get(id);
    if (!finding) throw new Error(`Finding ${id} not found`);
    finding.patch = patch;
    finding.lifecycleState = "patch_synthesized";
    if (patch.povNeutralized && patch.regressionTestsPassed) {
      finding.status = "patched";
      finding.lifecycleState = "verified_remediated";
    } else if (patch.regressionTestsPassed === false) {
      finding.lifecycleState = "regression_failed";
    }
    finding.updatedAt = new Date().toISOString();
    return this.store.put(finding);
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }
}
