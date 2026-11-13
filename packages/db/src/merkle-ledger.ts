import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface AuditLedgerRow {
  seq: number;
  event_type: string;
  file_sha256: string;
  payload_json: string;
  prev_hash: string;
  entry_hash: string;
  ed25519_sig: string;
  created_at: string;
}

export class MerkleLedgerStore {
  private db: any = null;
  private fallbackMemoryRows: AuditLedgerRow[] = [];
  private privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'];
  public readonly publicKeyPem: string;
  public readonly dbPath: string;

  constructor(dbPath: string = '.aegis/data/merkle-ledger.db') {
    this.dbPath = dbPath;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const kp = generateKeyPairSync('ed25519');
    this.privateKey = kp.privateKey;
    this.publicKeyPem = kp.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    try {
      // Node 22.5+ native node:sqlite DatabaseSync
      const sqlite = require('node:sqlite');
      if (sqlite.DatabaseSync) {
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
      // In-memory / file fallback for environments where node:sqlite is disabled
      this.db = null;
      this.loadFallbackDisk();
    }
  }

  private loadFallbackDisk(): void {
    const candidates = [
      this.dbPath.replace(/\.db$/, '.json'),
      process.env['HEIMDALL_DATA_DIR'] ? path.join(process.env['HEIMDALL_DATA_DIR'], 'merkle-ledger.json') : null,
      'C:/Users/Ajinkya/Desktop/heimdall/.aegis/data/merkle-ledger.json',
      path.resolve(process.cwd(), '.aegis/data/merkle-ledger.json'),
      path.resolve(process.cwd(), '../../.aegis/data/merkle-ledger.json')
    ].filter(Boolean) as string[];

    for (const jsonPath of candidates) {
      if (fs.existsSync(jsonPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.fallbackMemoryRows = parsed;
            return;
          }
        } catch {
          // try next
        }
      }
    }
    this.fallbackMemoryRows = [];
  }

  private saveFallbackDisk(): void {
    const jsonPath = this.dbPath.replace(/\.db$/, '.json');
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(this.fallbackMemoryRows, null, 2), 'utf8');
    } catch {
      // Ignore fallback write errors
    }
  }

  public appendEvent(eventType: string, fileSha256: string, payload: unknown): {
    entryHash: string;
    signature: string;
    prevHash: string;
  } {
    let prevHash = '0'.repeat(64);

    if (this.db) {
      const lastRow = this.db
        .prepare('SELECT entry_hash FROM audit_ledger ORDER BY seq DESC LIMIT 1')
        .get() as { entry_hash?: string } | undefined;
      if (lastRow?.entry_hash) {
        prevHash = lastRow.entry_hash;
      }
    } else {
      if (this.fallbackMemoryRows.length > 0) {
        prevHash = this.fallbackMemoryRows[this.fallbackMemoryRows.length - 1].entry_hash;
      }
    }

    const payloadJson = JSON.stringify(payload);
    const createdAt = new Date().toISOString();

    const entryHash = createHash('sha256')
      .update(`${prevHash}|${eventType}|${fileSha256}|${payloadJson}|${createdAt}`)
      .digest('hex');

    const signature = sign(null, Buffer.from(entryHash, 'utf8'), this.privateKey).toString('base64');

    if (this.db) {
      this.db
        .prepare(
          `INSERT INTO audit_ledger
           (event_type, file_sha256, payload_json, prev_hash, entry_hash, ed25519_sig, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(eventType, fileSha256, payloadJson, prevHash, entryHash, signature, createdAt);
    } else {
      const newRow: AuditLedgerRow = {
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

    return { entryHash, signature, prevHash };
  }

  public getRows(): AuditLedgerRow[] {
    if (this.db) {
      const rows = this.db
        .prepare('SELECT * FROM audit_ledger ORDER BY seq ASC')
        .all() as AuditLedgerRow[];
      if (rows && rows.length > 0) return rows;
    }
    this.loadFallbackDisk();
    return [...this.fallbackMemoryRows];
  }

  public verifyChain(): boolean {
    const rows = this.getRows();
    let expectedPrev = '0'.repeat(64);

    for (const row of rows) {
      if (row.prev_hash !== expectedPrev) return false;
      const recomputed = createHash('sha256')
        .update(
          `${row.prev_hash}|${row.event_type}|${row.file_sha256}|${row.payload_json}|${row.created_at}`
        )
        .digest('hex');
      if (recomputed !== row.entry_hash) return false;

      const validSig = verify(
        null,
        Buffer.from(row.entry_hash, 'utf8'),
        this.publicKeyPem,
        Buffer.from(row.ed25519_sig, 'base64')
      );
      if (!validSig) return false;
      expectedPrev = row.entry_hash;
    }
    return true;
  }
}
