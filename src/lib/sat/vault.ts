/**
 * Cryptographic Evidence Vault & Tamper-Evident Audit Chain for SAT-SA.
 * Implements FIPS 180-4 SHA-256 chained hashing for all examiner decisions,
 * dataset ingestions, and supervisory records.
 */

import { sha256 } from "./sha256.ts";

export interface EvidenceReceipt {
  datasetId: string;
  datasetHash: string;
  fileName: string;
  ingestedAt: string;
  examinerId: string;
  recordCount: number;
  entityCount: number;
  qualityScore: number;
  sourceType: "demo" | "csv" | "json";
}

export type AuditAction =
  | "GENESIS"
  | "INGESTION"
  | "CORROBORATES"
  | "DOES_NOT_CORROBORATE"
  | "NEEDS_MORE_EVIDENCE"
  | "EXAMINER_NOTE";

export type AuditTargetType = "system" | "dataset" | "review_item" | "review" | "finding" | "entity" | "alert";

export interface AuditBlock {
  index: number;
  timestamp: string;
  examinerId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  rationale: string;
  prevHash: string;
  hash: string;
}

export interface VerificationReport {
  intact: boolean;
  blockCount: number;
  genesisHash: string;
  latestHash: string;
  verifiedAt: string;
  failedIndex?: number;
  error?: string;
}

const STORAGE_LEDGER_KEY = "sat-sa-audit-ledger-v2";
const STORAGE_RECEIPTS_KEY = "sat-sa-evidence-receipts-v2";

export function computeBlockHash(
  index: number,
  timestamp: string,
  examinerId: string,
  action: AuditAction,
  targetType: AuditTargetType,
  targetId: string,
  rationale: string,
  prevHash: string,
): string {
  const payload = `${index}|${timestamp}|${examinerId}|${action}|${targetType}|${targetId}|${rationale}|${prevHash}`;
  return sha256(payload);
}

export function createGenesisBlock(): AuditBlock {
  const index = 0;
  const timestamp = "2026-09-01T00:00:00.000Z";
  const examinerId = "NCIIPC-SUPERVISORY-ROOT";
  const action: AuditAction = "GENESIS";
  const targetType: AuditTargetType = "system";
  const targetId = "SAT-SA-FIPS-ROOT";
  const rationale = "SAT-SA deterministic tamper-evident audit ledger initialized under NCIIPC supervisory mandate.";
  const prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  const hash = computeBlockHash(index, timestamp, examinerId, action, targetType, targetId, rationale, prevHash);

  return {
    index,
    timestamp,
    examinerId,
    action,
    targetType,
    targetId,
    rationale,
    prevHash,
    hash,
  };
}

export function appendAuditBlock(
  ledger: AuditBlock[],
  entry: {
    examinerId: string;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    rationale: string;
    timestamp?: string;
  },
): AuditBlock[] {
  const currentLedger = ledger.length > 0 ? ledger : [createGenesisBlock()];
  const prevBlock = currentLedger[currentLedger.length - 1]!;

  const index = prevBlock.index + 1;
  const timestamp = entry.timestamp || new Date().toISOString();
  const prevHash = prevBlock.hash;
  const hash = computeBlockHash(
    index,
    timestamp,
    entry.examinerId,
    entry.action,
    entry.targetType,
    entry.targetId,
    entry.rationale,
    prevHash,
  );

  const newBlock: AuditBlock = {
    index,
    timestamp,
    examinerId: entry.examinerId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    rationale: entry.rationale,
    prevHash,
    hash,
  };

  return [...currentLedger, newBlock];
}

export function verifyLedgerIntegrity(ledger: AuditBlock[]): VerificationReport {
  const verifiedAt = new Date().toISOString();
  if (!ledger || ledger.length === 0) {
    return {
      intact: false,
      blockCount: 0,
      genesisHash: "",
      latestHash: "",
      verifiedAt,
      error: "Ledger is empty.",
    };
  }

  // Verify genesis block
  const genesis = ledger[0]!;
  if (genesis.index !== 0 || genesis.prevHash !== "0000000000000000000000000000000000000000000000000000000000000000") {
    return {
      intact: false,
      blockCount: ledger.length,
      genesisHash: genesis.hash,
      latestHash: ledger[ledger.length - 1]!.hash,
      verifiedAt,
      failedIndex: 0,
      error: "Genesis block has invalid index or previous hash link.",
    };
  }

  const expectedGenesisHash = computeBlockHash(
    genesis.index,
    genesis.timestamp,
    genesis.examinerId,
    genesis.action,
    genesis.targetType,
    genesis.targetId,
    genesis.rationale,
    genesis.prevHash,
  );

  if (genesis.hash !== expectedGenesisHash) {
    return {
      intact: false,
      blockCount: ledger.length,
      genesisHash: genesis.hash,
      latestHash: ledger[ledger.length - 1]!.hash,
      verifiedAt,
      failedIndex: 0,
      error: "Genesis block content hash mismatch.",
    };
  }

  // Verify consecutive blocks
  for (let i = 1; i < ledger.length; i++) {
    const prev = ledger[i - 1]!;
    const curr = ledger[i]!;

    if (curr.index !== prev.index + 1) {
      return {
        intact: false,
        blockCount: ledger.length,
        genesisHash: genesis.hash,
        latestHash: ledger[ledger.length - 1]!.hash,
        verifiedAt,
        failedIndex: i,
        error: `Sequence break at block ${i}: expected index ${prev.index + 1}, found ${curr.index}.`,
      };
    }

    if (curr.prevHash !== prev.hash) {
      return {
        intact: false,
        blockCount: ledger.length,
        genesisHash: genesis.hash,
        latestHash: ledger[ledger.length - 1]!.hash,
        verifiedAt,
        failedIndex: i,
        error: `Hash pointer broken at block ${i}: prevHash does not match predecessor hash.`,
      };
    }

    const expectedHash = computeBlockHash(
      curr.index,
      curr.timestamp,
      curr.examinerId,
      curr.action,
      curr.targetType,
      curr.targetId,
      curr.rationale,
      curr.prevHash,
    );

    if (curr.hash !== expectedHash) {
      return {
        intact: false,
        blockCount: ledger.length,
        genesisHash: genesis.hash,
        latestHash: ledger[ledger.length - 1]!.hash,
        verifiedAt,
        failedIndex: i,
        error: `Content tampering detected at block ${i}: stored hash differs from recomputed digest.`,
      };
    }
  }

  return {
    intact: true,
    blockCount: ledger.length,
    genesisHash: genesis.hash,
    latestHash: ledger[ledger.length - 1]!.hash,
    verifiedAt,
  };
}

export function loadStoredLedger(): AuditBlock[] {
  if (typeof window === "undefined") return [createGenesisBlock()];
  try {
    const raw = window.localStorage.getItem(STORAGE_LEDGER_KEY);
    if (!raw) return [createGenesisBlock()];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as AuditBlock[];
    }
    return [createGenesisBlock()];
  } catch {
    return [createGenesisBlock()];
  }
}

export function saveStoredLedger(ledger: AuditBlock[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // Quota fallback
  }
}

export function loadStoredReceipts(): EvidenceReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_RECEIPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EvidenceReceipt[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredReceipts(receipts: EvidenceReceipt[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_RECEIPTS_KEY, JSON.stringify(receipts));
  } catch {
    // Quota fallback
  }
}
