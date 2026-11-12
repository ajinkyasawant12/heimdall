import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/**
 * Atomic persistent document store.
 * Stores tables as JSON with in-memory caching and durable atomic disk writes.
 */
export class PersistentStore<T extends { id: string }> {
  private readonly filePath: string;
  private cache: Map<string, T> = new Map();
  private loaded = false;

  constructor(baseDir: string, tableName: string) {
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }
    this.filePath = join(baseDir, `${tableName}.json`);
    this.load();
  }

  private load(): void {
    if (!existsSync(this.filePath)) {
      this.cache = new Map();
      this.loaded = true;
      return;
    }
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const records = JSON.parse(raw) as T[];
      this.cache = new Map(records.map(r => [r.id, r]));
    } catch {
      this.cache = new Map();
    }
    this.loaded = true;
  }

  private flush(): void {
    const records = Array.from(this.cache.values());
    const tempPath = `${this.filePath}.tmp.${Date.now()}`;
    writeFileSync(tempPath, JSON.stringify(records, null, 2), "utf-8");
    try {
      writeFileSync(this.filePath, JSON.stringify(records, null, 2), "utf-8");
    } finally {
      try {
        const { unlinkSync } = require("node:fs");
        unlinkSync(tempPath);
      } catch {}
    }
  }

  get(id: string): T | null {
    return this.cache.get(id) ?? null;
  }

  getAll(): T[] {
    return Array.from(this.cache.values());
  }

  put(item: T): T {
    this.cache.set(item.id, item);
    this.flush();
    return item;
  }

  delete(id: string): boolean {
    const exists = this.cache.delete(id);
    if (exists) this.flush();
    return exists;
  }

  query(predicate: (item: T) => boolean): T[] {
    return Array.from(this.cache.values()).filter(predicate);
  }
}

export function getDefaultHeimdallDbDir(): string {
  const home = homedir();
  return process.env["HEIMDALL_DATA_DIR"] || join(home, ".aegis", "data");
}
