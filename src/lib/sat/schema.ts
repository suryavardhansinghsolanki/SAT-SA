/**
 * SAT-SA Schema Validator & Data Quality Engine.
 * Provides deterministic schema validation, field alias mapping,
 * timestamp normalization, deduplication, and structured diagnostics.
 */

import { sha256 } from "./sha256.ts";
import type { Alert, AlertStatus, Asset, CaseRecord, Dataset, Disposition, Entity, Sector, Severity } from "./types.ts";

export const REQUIRED_COLUMNS: readonly string[] = [
  "alert_id",
  "entity_id",
  "entity_name",
  "sector",
  "asset_id",
  "timestamp",
  "closed_at",
  "severity",
  "category",
  "source",
  "status",
  "disposition",
  "case_id",
  "escalated",
  "analyst",
  "sla_minutes",
  "notes",
] as const;

export const SECTORS: readonly Sector[] = [
  "Power",
  "BFSI",
  "Telecom",
  "Transport",
  "Healthcare",
  "Oil & Gas",
  "Water",
  "Government",
] as const;

// Comprehensive alias map to support real CSE submission variations
const ALIAS_MAP: Record<string, string> = {
  // alert_id
  alert_id: "alert_id",
  alertid: "alert_id",
  id: "alert_id",
  alert: "alert_id",
  event_id: "alert_id",

  // entity_id
  entity_id: "entity_id",
  entityid: "entity_id",
  cse_id: "entity_id",
  cseid: "entity_id",
  entity: "entity_id",
  org_id: "entity_id",

  // entity_name
  entity_name: "entity_name",
  entityname: "entity_name",
  cse_name: "entity_name",
  csename: "entity_name",
  cse: "entity_name",
  organisation: "entity_name",
  organization: "entity_name",
  company: "entity_name",

  // sector
  sector: "sector",
  critical_sector: "sector",
  industry: "sector",
  vertical: "sector",

  // asset_id
  asset_id: "asset_id",
  assetid: "asset_id",
  host: "asset_id",
  host_id: "asset_id",
  hostname: "asset_id",
  system_id: "asset_id",
  endpoint: "asset_id",

  // timestamp
  timestamp: "timestamp",
  ts: "timestamp",
  created_at: "timestamp",
  created: "timestamp",
  event_time: "timestamp",
  start_time: "timestamp",
  time: "timestamp",
  opened_at: "timestamp",

  // closed_at
  closed_at: "closed_at",
  closedat: "closed_at",
  closed: "closed_at",
  close_time: "closed_at",
  end_time: "closed_at",
  resolved_at: "closed_at",

  // severity
  severity: "severity",
  sev: "severity",
  priority: "severity",
  prio: "severity",
  level: "severity",

  // category
  category: "category",
  cat: "category",
  alert_type: "category",
  alerttype: "category",
  threat_category: "category",
  signature: "category",
  type: "category",

  // source
  source: "source",
  tool: "source",
  sensor: "source",
  log_source: "source",
  logsource: "source",
  origin: "source",
  collector: "source",

  // status
  status: "status",
  state: "status",
  alert_status: "status",

  // disposition
  disposition: "disposition",
  disp: "disposition",
  resolution: "disposition",
  outcome: "disposition",
  closure_reason: "disposition",

  // case_id
  case_id: "case_id",
  caseid: "case_id",
  ticket_id: "case_id",
  ticket: "case_id",
  incident_id: "case_id",

  // escalated
  escalated: "escalated",
  escalation: "escalated",
  is_escalated: "escalated",
  escalated_flag: "escalated",

  // analyst
  analyst: "analyst",
  operator: "analyst",
  assignee: "analyst",
  handler: "analyst",
  owner: "analyst",

  // sla_minutes
  sla_minutes: "sla_minutes",
  slaminutes: "sla_minutes",
  sla: "sla_minutes",
  sla_mins: "sla_minutes",
  target_sla: "sla_minutes",

  // notes
  notes: "notes",
  note: "notes",
  investigation_notes: "notes",
  comments: "notes",
  summary: "notes",
  investigation_summary: "notes",
};

const SEV_MAP: Record<string, Severity> = {
  critical: "critical",
  p1: "critical",
  crit: "critical",
  sev1: "critical",
  high: "high",
  p2: "high",
  sev2: "high",
  medium: "medium",
  p3: "medium",
  med: "medium",
  sev3: "medium",
  low: "low",
  p4: "low",
  sev4: "low",
  informational: "low",
  info: "low",
};

const DISP_MAP: Record<string, Disposition> = {
  true_positive: "true_positive",
  tp: "true_positive",
  truepositive: "true_positive",
  incident: "incident",
  false_positive: "false_positive",
  fp: "false_positive",
  falsepositive: "false_positive",
  benign: "benign",
  benign_true_positive: "benign",
  duplicate: "duplicate",
  dup: "duplicate",
  undetermined: "undetermined",
  unknown: "undetermined",
};

export interface QualityMetrics {
  qualityScorePct: number; // 0 - 100
  totalRowsRead: number;
  acceptedAlerts: number;
  entitiesDetected: number;
  assetsDetected: number;
  casesSynthesized: number;
  duplicateAlertsDeduplicated: number;
  emptyEntityRowsSkipped: number;
  invalidTimestampRowsCount: number;
  missingOptionalFieldsCount: number;
}

export interface ValidationSuccess {
  success: true;
  dataset: Dataset;
  datasetHash: string;
  datasetId: string;
  metrics: QualityMetrics;
  warnings: string[];
}

export interface ValidationFailure {
  success: false;
  errorType: "EMPTY_FILE" | "MALFORMED_FORMAT" | "MISSING_REQUIRED_COLUMNS" | "FATAL_DATA_ERRORS";
  summary: string;
  details: string[];
  affectedRows?: number[];
  datasetHash: string;
}

export type IngestionResult = ValidationSuccess | ValidationFailure;

/**
 * Parses CSV lines handling quoted commas and escapes deterministically.
 */
export function splitCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Deterministically parses ISO or standard date-time into strict UTC ISO-8601 string.
 */
export function parseUtcIso(value: string | undefined | null): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Numeric epoch timestamp (seconds or milliseconds)
  if (/^\d{10,13}$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = trimmed.length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

/**
 * Normalizes boolean strings/numbers into boolean.
 */
export function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const clean = value.trim().toLowerCase();
    return clean === "true" || clean === "1" || clean === "yes" || clean === "y" || clean === "t";
  }
  return false;
}

/**
 * Canonicalizes headers against ALIAS_MAP.
 */
export function canonicalizeHeaders(rawHeaders: string[]): { canonicalMap: Map<number, string>; missing: string[] } {
  const canonicalMap = new Map<number, string>();
  const foundCanonical = new Set<string>();

  rawHeaders.forEach((h, index) => {
    const key = h.trim().toLowerCase().replace(/[\s\-_]+/g, "_");
    const canonical = ALIAS_MAP[key];
    if (canonical) {
      canonicalMap.set(index, canonical);
      foundCanonical.add(canonical);
    }
  });

  const missing = REQUIRED_COLUMNS.filter((col) => !foundCanonical.has(col));
  return { canonicalMap, missing };
}

/**
 * Validates and normalizes raw text submission (CSV or JSON).
 * Never throws JavaScript exceptions. Always returns a structured IngestionResult.
 */
export function validateAndIngestSubmission(
  rawText: string,
  fileName = "submission.csv",
  defaultSector: Sector = "Government",
): IngestionResult {
  const datasetHash = sha256(rawText);
  const datasetId = `SUB-${datasetHash.slice(0, 10).toUpperCase()}`;

  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      errorType: "EMPTY_FILE",
      summary: "Uploaded submission file is empty.",
      details: ["The file contains 0 bytes of readable data."],
      datasetHash,
    };
  }

  const trimmed = rawText.trim();

  // Route 1: Handle JSON submissions
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return ingestJsonSubmission(trimmed, datasetHash, datasetId, defaultSector);
  }

  // Route 2: Handle CSV submissions
  return ingestCsvSubmission(rawText, datasetHash, datasetId, fileName, defaultSector);
}

function ingestCsvSubmission(
  rawText: string,
  datasetHash: string,
  datasetId: string,
  _fileName: string,
  defaultSector: Sector,
): IngestionResult {
  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      errorType: "MALFORMED_FORMAT",
      summary: "CSV submission requires a header row and at least one alert record.",
      details: [`Found ${lines.length} non-empty lines in file.`],
      datasetHash,
    };
  }

  const rawHeaders = splitCsvRow(lines[0]!);
  const { canonicalMap, missing } = canonicalizeHeaders(rawHeaders);

  // If critical columns are missing, reject gracefully with structured message
  if (missing.length > 0) {
    return {
      success: false,
      errorType: "MISSING_REQUIRED_COLUMNS",
      summary: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
      details: [
        `Expected schema requires: ${REQUIRED_COLUMNS.join(", ")}`,
        `Columns present in submission: ${rawHeaders.join(", ")}`,
        `Missing: ${missing.join(", ")}`,
      ],
      datasetHash,
    };
  }

  const rawRows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvRow(lines[i]!);
    const row: Record<string, string> = {};
    canonicalMap.forEach((colName, colIdx) => {
      row[colName] = cells[colIdx] ?? "";
    });
    rawRows.push(row);
  }

  return processNormalizedRows(rawRows, datasetHash, datasetId, defaultSector);
}

function ingestJsonSubmission(
  jsonText: string,
  datasetHash: string,
  datasetId: string,
  defaultSector: Sector,
): IngestionResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      success: false,
      errorType: "MALFORMED_FORMAT",
      summary: "Invalid JSON syntax. Ensure the payload is valid JSON.",
      details: ["Unable to parse JSON input. Check for trailing commas or malformed characters."],
      datasetHash,
    };
  }

  let rawRows: Record<string, string>[] = [];

  if (Array.isArray(parsed)) {
    // Array of alert objects
    rawRows = parsed.map((item) => normalizeObjectKeys(item as Record<string, unknown>));
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.alerts)) {
      rawRows = obj.alerts.map((item) => normalizeObjectKeys(item as Record<string, unknown>));
    } else {
      return {
        success: false,
        errorType: "MALFORMED_FORMAT",
        summary: "JSON object must contain an 'alerts' array or be an array of alert records.",
        details: ["Root object structure does not contain an alerts list."],
        datasetHash,
      };
    }
  }

  if (rawRows.length === 0) {
    return {
      success: false,
      errorType: "EMPTY_FILE",
      summary: "JSON submission contains zero alert records.",
      details: ["The alerts array was empty."],
      datasetHash,
    };
  }

  // Check required fields across the first record
  const first = rawRows[0]!;
  const missing = REQUIRED_COLUMNS.filter((col) => !(col in first));
  if (missing.length > 0) {
    return {
      success: false,
      errorType: "MISSING_REQUIRED_COLUMNS",
      summary: `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
      details: [
        `Expected fields: ${REQUIRED_COLUMNS.join(", ")}`,
        `Missing in JSON alert records: ${missing.join(", ")}`,
      ],
      datasetHash,
    };
  }

  return processNormalizedRows(rawRows, datasetHash, datasetId, defaultSector);
}

function normalizeObjectKeys(obj: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const cleanKey = k.trim().toLowerCase().replace(/[\s\-_]+/g, "_");
    const canonical = ALIAS_MAP[cleanKey] ?? cleanKey;
    result[canonical] = v === null || v === undefined ? "" : String(v).trim();
  }
  return result;
}

function processNormalizedRows(
  rows: Record<string, string>[],
  datasetHash: string,
  datasetId: string,
  defaultSector: Sector,
): IngestionResult {
  const invalidTimestampRows: number[] = [];
  const emptyEntityRows: number[] = [];
  const warnings: string[] = [];

  const entities = new Map<string, Entity>();
  const assets = new Map<string, Asset>();
  const alerts: Alert[] = [];
  const seenAlertKeys = new Set<string>();
  let duplicateCount = 0;
  let missingOptionalCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // 1-indexed including header
    const r = rows[i]!;

    const entityId = (r.entity_id || "").trim();
    if (!entityId) {
      emptyEntityRows.push(rowNum);
      continue;
    }

    const alertId = (r.alert_id || `AL-${String(i + 1).padStart(5, "0")}`).trim();
    const dedupKey = `${entityId}::${alertId}`;
    if (seenAlertKeys.has(dedupKey)) {
      duplicateCount++;
      continue; // Deduplicate identical alert IDs per entity
    }
    seenAlertKeys.add(dedupKey);

    const ts = parseUtcIso(r.timestamp);
    if (!ts) {
      invalidTimestampRows.push(rowNum);
      continue; // Skip invalid timestamp row
    }

    const closedAt = parseUtcIso(r.closed_at);
    const entityName = (r.entity_name || entityId).trim();

    let sector: Sector = defaultSector;
    const rawSector = (r.sector || "").trim();
    const matchedSector = SECTORS.find((s) => s.toLowerCase() === rawSector.toLowerCase());
    if (matchedSector) {
      sector = matchedSector;
    }

    if (!entities.has(entityId)) {
      entities.set(entityId, {
        id: entityId,
        name: entityName,
        shortName: entityName.length > 28 ? `${entityName.slice(0, 26)}…` : entityName,
        sector,
        region: "National",
        criticality: "National",
        workforce: 500,
        submittedAt: ts.slice(0, 10),
        declaredMaturity: "Defined",
        socModel: "24x7 CSE Hybrid SOC",
        declaredKpis: {
          meanTimeToCloseMin: 30,
          slaMetPct: 0.95,
          coveragePct: 0.95,
          falsePositivePct: 0.28,
          escalationSlaPct: 0.90,
        },
      });
    }

    const assetId = (r.asset_id || `${entityId}-AST-${String(i + 1).padStart(3, "0")}`).trim();
    const sevKey = (r.severity || "medium").trim().toLowerCase();
    const severity: Severity = SEV_MAP[sevKey] ?? "medium";

    if (!assets.has(assetId)) {
      const isCritical = severity === "critical" || severity === "high";
      assets.set(assetId, {
        id: assetId,
        entityId,
        name: assetId,
        type: "Critical Asset Host",
        zone: /scada|plc|rtu|dcs|ot/i.test(assetId) ? "OT" : /ehr|his|pacs/i.test(assetId) ? "Clinical" : "IT",
        criticality: isCritical ? "critical" : "medium",
        telemetryExpected: true,
        silent: false,
      });
    }

    const dispKey = (r.disposition || "").trim().toLowerCase();
    const disposition: Disposition | null = DISP_MAP[dispKey] ?? null;

    const caseId = (r.case_id || "").trim() || null;
    const escalated = parseBoolean(r.escalated);
    const analyst = (r.analyst || "CSE Analyst").trim();
    const notes = (r.notes || "").trim();
    const category = (r.category || "security-event").trim().toLowerCase();
    const source = (r.source || "SIEM").trim();
    const status: AlertStatus = closedAt ? "closed" : (r.status as AlertStatus) || "open";
    const slaMinutes = Number(r.sla_minutes) || (severity === "critical" ? 60 : 240);

    if (!r.disposition) missingOptionalCount++;
    if (!r.case_id) missingOptionalCount++;
    if (!r.notes) missingOptionalCount++;

    alerts.push({
      id: alertId,
      entityId,
      assetId,
      ts,
      closedAt,
      severity,
      category,
      source,
      status,
      disposition,
      caseId,
      escalated,
      ackAt: ts,
      investigateAt: closedAt,
      analyst,
      noteFingerprint: notes || null,
      slaMinutes,
    });
  }

  // Fatal validation check
  if (invalidTimestampRows.length > 0 && alerts.length === 0) {
    return {
      success: false,
      errorType: "FATAL_DATA_ERRORS",
      summary: "Dataset validation failed: all rows contain invalid timestamps.",
      details: [`Affected rows: ${invalidTimestampRows.slice(0, 10).join(", ")}`],
      affectedRows: invalidTimestampRows,
      datasetHash,
    };
  }

  if (invalidTimestampRows.length > 0) {
    warnings.push(
      `${invalidTimestampRows.length} row(s) contained invalid timestamps and were excluded. Affected rows: ${invalidTimestampRows.slice(0, 8).join(", ")}${invalidTimestampRows.length > 8 ? "..." : ""}`,
    );
  }

  if (emptyEntityRows.length > 0) {
    warnings.push(
      `${emptyEntityRows.length} row(s) had missing or blank entity_id values and were excluded.`,
    );
  }

  if (duplicateCount > 0) {
    warnings.push(
      `${duplicateCount} duplicate alert record(s) detected and deduplicated by (entity_id + alert_id).`,
    );
  }

  // Synthesize cases from linked alert records
  const cases: CaseRecord[] = alerts
    .filter((a) => a.caseId)
    .map((a) => ({
      id: a.caseId!,
      entityId: a.entityId,
      alertId: a.id,
      openedAt: a.ts,
      closedAt: a.closedAt,
      analyst: a.analyst,
      notes: a.noteFingerprint ?? "Case opened for supervisory investigation",
      actions: (a.noteFingerprint?.length ?? 0) > 40 ? 3 : 1,
      rootCauseFix: a.disposition === "incident" || a.escalated,
      escalatedTo: a.escalated ? "CSIRT-L2" : null,
      template: Boolean(a.noteFingerprint && a.noteFingerprint.length < 35),
    }));

  // Window bounds
  const timestamps = alerts.map((a) => new Date(a.ts).getTime()).filter((t) => !Number.isNaN(t));
  const windowStart = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : new Date().toISOString();
  const windowEnd = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString();

  // Data Quality Score formula
  // Base 100 minus deductions for data issues
  const penalty =
    invalidTimestampRows.length * 1.5 +
    emptyEntityRows.length * 2.0 +
    duplicateCount * 0.5 +
    Math.min(15, (missingOptionalCount / Math.max(1, rows.length * 3)) * 20);

  const qualityScorePct = Math.max(20, Math.min(100, Math.round(100 - penalty)));

  const metrics: QualityMetrics = {
    qualityScorePct,
    totalRowsRead: rows.length,
    acceptedAlerts: alerts.length,
    entitiesDetected: entities.size,
    assetsDetected: assets.size,
    casesSynthesized: cases.length,
    duplicateAlertsDeduplicated: duplicateCount,
    emptyEntityRowsSkipped: emptyEntityRows.length,
    invalidTimestampRowsCount: invalidTimestampRows.length,
    missingOptionalFieldsCount: missingOptionalCount,
  };

  const dataset: Dataset = {
    generatedAt: new Date().toISOString(),
    windowStart,
    windowEnd,
    cycle: "SUBMISSION",
    entities: [...entities.values()],
    assets: [...assets.values()],
    alerts,
    cases,
    escalations: alerts
      .filter((a) => a.escalated)
      .map((a, idx) => ({
        id: `ESC-${String(idx + 1).padStart(4, "0")}`,
        entityId: a.entityId,
        caseId: a.caseId ?? `CS-${a.id}`,
        alertId: a.id,
        ts: a.ts,
        fromLevel: "L1-Operations",
        toLevel: "L2-CSIRT",
        accepted: true,
      })),
  };

  return {
    success: true,
    dataset,
    datasetHash,
    datasetId,
    metrics,
    warnings,
  };
}
