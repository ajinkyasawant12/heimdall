export interface MerkleLedgerEntry {
  seq: number;
  eventType: string;
  fileSha256: string;
  payloadJson: string;
  prevHash: string;
  entryHash: string;
  ed25519Sig: string;
  createdAt: string;
}

export interface MerkleVerificationReport {
  valid: boolean;
  totalEntries: number;
  merkleRoot: string;
  lastSequence: number;
  invalidSequence?: number;
}
