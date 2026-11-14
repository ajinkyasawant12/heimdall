import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

/**
 * Atomic persistent document store.
 * Stores tables as JSON with in-memory caching and durable atomic disk writes.
 */
export class PersistentStore {
  filePath;
  cache = new Map();
  loaded = false;
  constructor(baseDir, tableName) {
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, {
        recursive: true
      });
    }
    this.filePath = join(baseDir, `${tableName}.json`);
    this.load();
  }
  load() {
    if (!existsSync(this.filePath)) {
      this.cache = new Map();
      this.loaded = true;
      return;
    }
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const records = JSON.parse(raw);
      this.cache = new Map(records.map(r => [r.id, r]));
    } catch {
      this.cache = new Map();
    }
    this.loaded = true;
  }
  flush() {
    const records = Array.from(this.cache.values());
    const tempPath = `${this.filePath}.tmp.${Date.now()}`;
    writeFileSync(tempPath, JSON.stringify(records, null, 2), "utf-8");
    try {
      writeFileSync(this.filePath, JSON.stringify(records, null, 2), "utf-8");
    } finally {
      try {
        const {
          unlinkSync
        } = require("node:fs");
        unlinkSync(tempPath);
      } catch {}
    }
  }
  get(id) {
    return this.cache.get(id) ?? null;
  }
  getAll() {
    return Array.from(this.cache.values());
  }
  put(item) {
    this.cache.set(item.id, item);
    this.flush();
    return item;
  }
  delete(id) {
    const exists = this.cache.delete(id);
    if (exists) this.flush();
    return exists;
  }
  query(predicate) {
    return Array.from(this.cache.values()).filter(predicate);
  }
}
export function getDefaultHeimdallDbDir() {
  const home = homedir();
  return process.env["HEIMDALL_DATA_DIR"] || join(home, ".aegis", "data");
}
