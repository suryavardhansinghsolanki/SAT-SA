import { create } from "zustand";
import { DEMO_DATASET } from "./corpus.ts";
import { assess } from "./engine.ts";
import { sha256 } from "./sha256.ts";
import type { QualityMetrics } from "./schema.ts";
import type { Assessment, Dataset, ExaminerNote } from "./types.ts";
import {
  appendAuditBlock,
  createGenesisBlock,
  loadStoredLedger,
  loadStoredReceipts,
  saveStoredLedger,
  saveStoredReceipts,
  verifyLedgerIntegrity,
  type AuditBlock,
  type EvidenceReceipt,
  type VerificationReport,
} from "./vault.ts";

export type CorpusSource = "demo" | "upload";

const EXAMINER_KEY = "sat-sa-examiner-v2";
const DEFAULT_EXAMINER_ID = "NCIIPC-EX-4092";

function emptyExaminer(): {
  notes: ExaminerNote[];
  reviewDone: Record<string, ExaminerNote["stance"]>;
  examinerId: string;
} {
  return { notes: [], reviewDone: {}, examinerId: DEFAULT_EXAMINER_ID };
}

function readExaminer() {
  if (typeof window === "undefined") return emptyExaminer();
  try {
    const raw = window.localStorage.getItem(EXAMINER_KEY);
    if (!raw) return emptyExaminer();
    const parsed = JSON.parse(raw) as {
      notes?: ExaminerNote[];
      reviewDone?: Record<string, ExaminerNote["stance"]>;
      examinerId?: string;
    };
    return {
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      reviewDone: parsed.reviewDone ?? {},
      examinerId: parsed.examinerId || DEFAULT_EXAMINER_ID,
    };
  } catch {
    return emptyExaminer();
  }
}

function writeExaminer(
  notes: ExaminerNote[],
  reviewDone: Record<string, ExaminerNote["stance"]>,
  examinerId: string,
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXAMINER_KEY, JSON.stringify({ notes, reviewDone, examinerId }));
  } catch {
    /* ignore storage quota */
  }
}

const ACTIVE_DATASET_KEY = "sat-sa-active-dataset-v2";

function writeActiveDataset(data: {
  dataset: Dataset;
  source: CorpusSource;
  receipt?: EvidenceReceipt;
  qualityMetrics?: QualityMetrics;
} | null) {
  if (typeof window === "undefined") return;
  try {
    if (!data || data.source === "demo") {
      window.localStorage.removeItem(ACTIVE_DATASET_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_DATASET_KEY, JSON.stringify(data));
    }
  } catch {
    /* ignore storage quota */
  }
}

function readActiveDataset(): {
  dataset: Dataset;
  source: CorpusSource;
  receipt?: EvidenceReceipt;
  qualityMetrics?: QualityMetrics;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_DATASET_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface SatState {
  dataset: Dataset;
  assessment: Assessment;
  source: CorpusSource;
  notes: ExaminerNote[];
  reviewDone: Record<string, ExaminerNote["stance"]>;
  examinerId: string;
  auditLedger: AuditBlock[];
  receipts: EvidenceReceipt[];
  qualityMetrics: QualityMetrics | null;
  loadDataset: (
    dataset: Dataset,
    source: CorpusSource,
    receipt?: EvidenceReceipt,
    qualityMetrics?: QualityMetrics,
  ) => void;
  resetDemo: () => void;
  addNote: (note: Omit<ExaminerNote, "id" | "at">) => void;
  markReview: (reviewId: string, stance: ExaminerNote["stance"], comments?: string) => void;
  setExaminerId: (id: string) => void;
  verifyAuditLedger: () => VerificationReport;
  hydrateExaminer: () => void;
}

const demoAssessment = assess(DEMO_DATASET);

// Create demo initial receipt
const demoRawText = `CYCLE:2026-Q3|ENTITIES:${DEMO_DATASET.entities.length}|ALERTS:${DEMO_DATASET.alerts.length}`;
const demoReceipt: EvidenceReceipt = {
  datasetId: "DEMO-GOLD-SET-2026",
  datasetHash: sha256(demoRawText),
  fileName: "nciipc-demonstration-gold-set.csv",
  ingestedAt: "2026-09-01T00:00:00.000Z",
  examinerId: "NCIIPC-SYSTEM-INIT",
  recordCount: DEMO_DATASET.alerts.length,
  entityCount: DEMO_DATASET.entities.length,
  qualityScore: 100,
  sourceType: "demo",
};

export const useSatStore = create<SatState>()((set, get) => ({
  dataset: DEMO_DATASET,
  assessment: demoAssessment,
  source: "demo",
  notes: [],
  reviewDone: {},
  examinerId: DEFAULT_EXAMINER_ID,
  auditLedger: [createGenesisBlock()],
  receipts: [demoReceipt],
  qualityMetrics: {
    qualityScorePct: 100,
    totalRowsRead: DEMO_DATASET.alerts.length,
    acceptedAlerts: DEMO_DATASET.alerts.length,
    entitiesDetected: DEMO_DATASET.entities.length,
    assetsDetected: DEMO_DATASET.assets.length,
    casesSynthesized: DEMO_DATASET.cases.length,
    duplicateAlertsDeduplicated: 0,
    emptyEntityRowsSkipped: 0,
    invalidTimestampRowsCount: 0,
    missingOptionalFieldsCount: 0,
  },

  loadDataset: (dataset, source, receipt, qualityMetrics) => {
    writeActiveDataset(source === "upload" ? { dataset, source, receipt, qualityMetrics } : null);
    set((s) => {
      const assessment = assess(dataset);
      const newReceipts = receipt ? [receipt, ...s.receipts.filter((r) => r.datasetId !== receipt.datasetId)] : s.receipts;
      saveStoredReceipts(newReceipts);

      // Append ingestion block to audit ledger
      const actionDetails = receipt
        ? `Ingested submission ${receipt.fileName} (SHA-256: ${receipt.datasetHash.slice(0, 16)}..., ${receipt.recordCount} alerts, ${receipt.entityCount} entities, quality score: ${receipt.qualityScore}%)`
        : `Loaded dataset with ${dataset.alerts.length} alerts across ${dataset.entities.length} entities.`;

      const newLedger = appendAuditBlock(s.auditLedger, {
        examinerId: s.examinerId,
        action: "INGESTION",
        targetType: "dataset",
        targetId: receipt?.datasetId ?? dataset.cycle,
        rationale: actionDetails,
      });
      saveStoredLedger(newLedger);

      return {
        dataset,
        assessment,
        source,
        receipts: newReceipts,
        auditLedger: newLedger,
        qualityMetrics: qualityMetrics ?? null,
      };
    });
  },

  resetDemo: () => {
    writeActiveDataset(null);
    set((s) => {
      const newLedger = appendAuditBlock(s.auditLedger, {
        examinerId: s.examinerId,
        action: "INGESTION",
        targetType: "dataset",
        targetId: "DEMO-GOLD-SET-2026",
        rationale: "Examiner restored baseline demonstration gold set corpus.",
      });
      saveStoredLedger(newLedger);

      return {
        dataset: DEMO_DATASET,
        assessment: demoAssessment,
        source: "demo",
        auditLedger: newLedger,
        qualityMetrics: {
          qualityScorePct: 100,
          totalRowsRead: DEMO_DATASET.alerts.length,
          acceptedAlerts: DEMO_DATASET.alerts.length,
          entitiesDetected: DEMO_DATASET.entities.length,
          assetsDetected: DEMO_DATASET.assets.length,
          casesSynthesized: DEMO_DATASET.cases.length,
          duplicateAlertsDeduplicated: 0,
          emptyEntityRowsSkipped: 0,
          invalidTimestampRowsCount: 0,
          missingOptionalFieldsCount: 0,
        },
      };
    });
  },

  addNote: (note) => {
    set((s) => {
      const newNote: ExaminerNote = {
        ...note,
        id: `N-${Date.now().toString(36)}`,
        at: new Date().toISOString(),
      };
      const notes = [newNote, ...s.notes];
      writeExaminer(notes, s.reviewDone, s.examinerId);

      const newLedger = appendAuditBlock(s.auditLedger, {
        examinerId: s.examinerId,
        action: "EXAMINER_NOTE",
        targetType: note.targetType,
        targetId: note.targetId,
        rationale: note.body,
      });
      saveStoredLedger(newLedger);

      return { notes, auditLedger: newLedger };
    });
  },

  markReview: (reviewId, stance, comments) => {
    set((s) => {
      const reviewDone = { ...s.reviewDone, [reviewId]: stance };
      writeExaminer(s.notes, reviewDone, s.examinerId);

      const action =
        stance === "corroborates"
          ? "CORROBORATES"
          : stance === "does-not-corroborate"
            ? "DOES_NOT_CORROBORATE"
            : "NEEDS_MORE_EVIDENCE";

      const rationaleText = comments || `Examiner recorded supervisory decision: ${stance} for queue pack ${reviewId}.`;

      const newLedger = appendAuditBlock(s.auditLedger, {
        examinerId: s.examinerId,
        action,
        targetType: "review_item",
        targetId: reviewId,
        rationale: rationaleText,
      });
      saveStoredLedger(newLedger);

      return { reviewDone, auditLedger: newLedger };
    });
  },

  setExaminerId: (examinerId) => {
    set((s) => {
      writeExaminer(s.notes, s.reviewDone, examinerId);
      return { examinerId };
    });
  },

  verifyAuditLedger: () => {
    return verifyLedgerIntegrity(get().auditLedger);
  },

  hydrateExaminer: () => {
    const loaded = readExaminer();
    const storedLedger = loadStoredLedger();
    const storedReceipts = loadStoredReceipts();
    const storedActive = readActiveDataset();

    const receipts = storedReceipts.length > 0 ? storedReceipts : [demoReceipt];

    if (storedActive?.dataset && storedActive.source === "upload") {
      const assessment = assess(storedActive.dataset);
      set({
        dataset: storedActive.dataset,
        assessment,
        source: "upload",
        qualityMetrics: storedActive.qualityMetrics ?? null,
        notes: loaded.notes,
        reviewDone: loaded.reviewDone,
        examinerId: loaded.examinerId,
        auditLedger: storedLedger,
        receipts,
      });
      return;
    }

    set({
      notes: loaded.notes,
      reviewDone: loaded.reviewDone,
      examinerId: loaded.examinerId,
      auditLedger: storedLedger,
      receipts,
    });
  },
}));

export function useEntity(id: string) {
  const dataset = useSatStore((s) => s.dataset);
  const assessmentRoot = useSatStore((s) => s.assessment);
  const entity = dataset.entities.find((e) => e.id === id) ?? dataset.entities[0];
  const assessment =
    assessmentRoot.entities.find((e) => e.entityId === id) ?? assessmentRoot.entities[0];
  const entityId = entity?.id ?? id;
  const findings = assessmentRoot.findings.filter((f) => f.entityId === entityId);
  const assets = dataset.assets.filter((a) => a.entityId === entityId);
  const alerts = dataset.alerts.filter((a) => a.entityId === entityId);
  const cases = dataset.cases.filter((c) => c.entityId === entityId);
  return { entity, assessment, findings, assets, alerts, cases, dataset };
}