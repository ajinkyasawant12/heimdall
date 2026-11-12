import { randomUUID } from "node:crypto";
import { PersistentStore, getDefaultHeimdallDbDir } from "./storage-engine.js";
export class FindingsStore {
  store;
  constructor(dbDir = getDefaultHeimdallDbDir()) {
    this.store = new PersistentStore(dbDir, "findings");
  }
  create(finding) {
    const now = new Date().toISOString();
    const record = {
      ...finding,
      id: finding.id ?? randomUUID(),
      lifecycleState: 'hypothesis',
      createdAt: now,
      updatedAt: now
    };
    return this.store.put(record);
  }
  get(id) {
    return this.store.get(id);
  }
  list(filters = {}) {
    return this.store.query(f => {
      if (filters.projectId && f.projectId !== filters.projectId) return false;
      if (filters.status && f.status !== filters.status) return false;
      if (filters.lifecycleState && f.lifecycleState !== filters.lifecycleState) return false;
      if (filters.severity && f.severity !== filters.severity) return false;
      if (filters.bugClass && f.bugClass !== filters.bugClass) return false;
      return true;
    });
  }
  transitionLifecycle(id, toState, metadata) {
    const finding = this.store.get(id);
    if (!finding) throw new Error(`Finding ${id} not found`);
    finding.lifecycleState = toState;
    if (toState === 'confirmed_reproducible') finding.status = 'confirmed';
    if (toState === 'verified_remediated') finding.status = 'patched';
    if (toState === 'reproduction_failed') finding.status = 'invalidated';
    finding.updatedAt = new Date().toISOString();
    return this.store.put(finding);
  }
  updateStatus(id, status) {
    const finding = this.store.get(id);
    if (!finding) throw new Error(`Finding ${id} not found`);
    finding.status = status;
    finding.updatedAt = new Date().toISOString();
    return this.store.put(finding);
  }
  attachPoV(id, pov) {
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
  attachPatch(id, patch) {
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
  delete(id) {
    return this.store.delete(id);
  }
}
