import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SourceLink } from "@heimdall/shared";

export interface MemoryRecord {
  id: string;
  projectId: string;
  summary: string;
  category: "attack_surface" | "sanitization_bypass" | "auth_pattern" | "taint_sink";
  sourceLinks: SourceLink[];
  notes: string;
  createdAt: string;
  lastVerifiedAt: string;
}

export class HuntMemoryStore {
  private memories: Map<string, MemoryRecord> = new Map();

  recordMemory(input: {
    projectId: string;
    summary: string;
    category: MemoryRecord["category"];
    sourceLinks: SourceLink[];
    notes: string;
  }): MemoryRecord {
    const record: MemoryRecord = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString()
    };
    this.memories.set(record.id, record);
    return record;
  }

  get(id: string): MemoryRecord | null {
    return this.memories.get(id) ?? null;
  }

  all(): MemoryRecord[] {
    return Array.from(this.memories.values());
  }

  /**
   * Recalls memories for a project, verifying that referenced source files match their recorded hashes.
   */
  recallCodebaseMemories(projectId: string, projectRoot: string): MemoryRecord[] {
    const validMemories: MemoryRecord[] = [];

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
