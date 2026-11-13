import { createHash, createPrivateKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export class MerkleLedgerStore {
  db = null;
  fallbackMemoryRows = [];
  privateKey;
  publicKeyPem;
  dbPath;
  constructor(dbPath = '.aegis/data/merkle-ledger.db') {
    this.dbPath = dbPath;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
    const keyFile = path.join(dir, 'ed25519-keypair.json');
    if (fs.existsSync(keyFile)) {
      const saved = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
      this.privateKey = createPrivateKey(saved.privPem);
      this.publicKeyPem = saved.pubPem;
    } else {
      const kp = generateKeyPairSync('ed25519');
      const privPem = kp.privateKey.export({
        type: 'pkcs8',
        format: 'pem'
      }).toString();
      const pubPem = kp.publicKey.export({
        type: 'spki',
        format: 'pem'
      }).toString();
      fs.writeFileSync(keyFile, JSON.stringify({
        privPem,
        pubPem
      }, null, 2), 'utf8');
      this.privateKey = kp.privateKey;
      this.publicKeyPem = pubPem;
    }
    try {
      const sqlite = require('node:sqlite');
      if (sqlite && sqlite.DatabaseSync) {
        this.db = new sqlite.DatabaseSync(dbPath);
        this.db.exec(`
          PRAGMA journal_mode = WAL;
          PRAGMA synchronous = NORMAL;
          CREATE TABLE IF NOT EXISTS audit_ledger (
            seq INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            file_sha256 TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            entry_hash TEXT NOT NULL UNIQUE,
            ed25519_sig TEXT NOT NULL,
            created_at TEXT NOT NULL
          );
        `);
      }
    } catch {
      this.db = null;
      this.loadFallbackDisk();
    }
  }
  loadFallbackDisk() {
    const candidates = [
      this.dbPath ? this.dbPath.replace(/\.db$/, '.json') : null,
      process.env['HEIMDALL_DATA_DIR'] ? path.join(process.env['HEIMDALL_DATA_DIR'], 'merkle-ledger.json') : null,
      'C:/Users/Ajinkya/Desktop/heimdall/.aegis/data/merkle-ledger.json',
      path.resolve(process.cwd(), '.aegis/data/merkle-ledger.json'),
      path.resolve(process.cwd(), '../../.aegis/data/merkle-ledger.json')
    ].filter(Boolean);

    for (const jsonPath of candidates) {
      if (fs.existsSync(jsonPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.fallbackMemoryRows = parsed;
            return;
          }
        } catch {
          // continue
        }
      }
    }
    this.fallbackMemoryRows = [];
  }
  saveFallbackDisk() {
    const jsonPath = this.dbPath.replace(/\.db$/, '.json');
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(this.fallbackMemoryRows, null, 2), 'utf8');
    } catch {
      // Ignore fallback write errors
    }
  }
  appendEvent(eventType, fileSha256, payload) {
    let prevHash = '0'.repeat(64);
    if (this.db) {
      const lastRow = this.db.prepare('SELECT entry_hash FROM audit_ledger ORDER BY seq DESC LIMIT 1').get();
      if (lastRow?.entry_hash) {
        prevHash = lastRow.entry_hash;
      }
    } else {
      this.loadFallbackDisk();
      if (this.fallbackMemoryRows.length > 0) {
        prevHash = this.fallbackMemoryRows[this.fallbackMemoryRows.length - 1].entry_hash;
      }
    }
    const payloadJson = JSON.stringify(payload);
    const createdAt = new Date().toISOString();
    const entryHash = createHash('sha256').update(`${prevHash}|${eventType}|${fileSha256}|${payloadJson}|${createdAt}`).digest('hex');
    const signature = sign(null, Buffer.from(entryHash, 'utf8'), this.privateKey).toString('base64');
    if (this.db) {
      this.db.prepare(`INSERT INTO audit_ledger
           (event_type, file_sha256, payload_json, prev_hash, entry_hash, ed25519_sig, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`).run(eventType, fileSha256, payloadJson, prevHash, entryHash, signature, createdAt);
    } else {
      const newRow = {
        seq: this.fallbackMemoryRows.length + 1,
        event_type: eventType,
        file_sha256: fileSha256,
        payload_json: payloadJson,
        prev_hash: prevHash,
        entry_hash: entryHash,
        ed25519_sig: signature,
        created_at: createdAt
      };
      this.fallbackMemoryRows.push(newRow);
      this.saveFallbackDisk();
    }
    return {
      entryHash,
      signature,
      prevHash
    };
  }
  getRows() {
    if (this.db) {
      const rows = this.db.prepare('SELECT * FROM audit_ledger ORDER BY seq ASC').all();
      if (rows && rows.length > 0) return rows;
    }
    this.loadFallbackDisk();
    return [...this.fallbackMemoryRows];
  }
  verifyChain() {
    const rows = this.getRows();
    let expectedPrev = '0'.repeat(64);
    for (const row of rows) {
      if (row.prev_hash !== expectedPrev) return false;
      const recomputed = createHash('sha256').update(`${row.prev_hash}|${row.event_type}|${row.file_sha256}|${row.payload_json}|${row.created_at}`).digest('hex');
      if (recomputed !== row.entry_hash) return false;
      const validSig = verify(null, Buffer.from(row.entry_hash, 'utf8'), this.publicKeyPem, Buffer.from(row.ed25519_sig, 'base64'));
      if (!validSig) return false;
      expectedPrev = row.entry_hash;
    }
    return true;
  }
}
