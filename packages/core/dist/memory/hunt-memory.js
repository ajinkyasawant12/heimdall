import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
export class HuntMemoryStore {
  memories = new Map();
  recordMemory(input) {
    const record = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };
    this.memories.set(record.id, record);
    return record;
  }
  get(id) {
    return this.memories.get(id) ?? null;
  }
  all() {
    return Array.from(this.memories.values());
  }

  /**
   * Recalls memories for a project, verifying that referenced source files match their recorded hashes.
   */
  recallCodebaseMemories(projectId, projectRoot) {
    const validMemories = [];
    for (const record of this.memories.values()) {
      if (record.projectId !== projectId) continue;
      let isCurrent = true;
      for (const link of record.sourceLinks) {
        const fullPath = resolve(projectRoot, link.path);
        if (!existsSync(fullPath)) {
          isCurrent = false;
          break;
        }
        try {
          const contents = readFileSync(fullPath);
          const currentHash = `sha256:${createHash("sha256").update(contents).digest("hex")}`;
          if (currentHash !== link.hash) {
            isCurrent = false;
            break;
          }
        } catch {
          isCurrent = false;
          break;
        }
      }
      if (isCurrent) {
        validMemories.push(record);
      }
    }
    return validMemories;
  }
}
