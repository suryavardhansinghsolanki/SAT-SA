export type Sector =
  | "Power"
  | "BFSI"
  | "Telecom"
  | "Transport"
  | "Healthcare"
  | "Oil & Gas"
  | "Water"
  | "Government";

export type Severity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "acknowledged" | "investigating" | "escalated" | "closed";
export type Disposition =
  | "true_positive"
  | "false_positive"
  | "benign"
  | "duplicate"
  | "undetermined"
  | "incident";

export type CapabilityKey =
  | "detection"
  | "investigation"
  | "escalation"
  | "response"
  | "secops"
  | "governance"
  | "discipline"
  | "resilience";

export type RiskBand = "immediate" | "concern" | "watch" | "tolerance" | "exemplar";
export type FindingFamily = "execution-gap" | "negative-space" | "anomaly";
export type AssetZone = "IT" | "OT" | "Clinical" | "Payment" | "Identity" | "Cloud";
export type DeclaredMaturity = "Initial" | "Developing" | "Defined" | "Managed" | "Optimised";

export const CAPABILITY_META: Record<
  CapabilityKey,
  { label: string; short: string; question: string }
> = {
  detection: {
    label: "Threat Detection",
    short: "Detection",
    question: "Are expected threats actually being seen?",
  },
  investigation: {
    label: "Investigation",
    short: "Investigate",
    question: "Are alerts meaningfully examined, or merely processed?",
  },
  escalation: {
    label: "Escalation",
    short: "Escalate",
    question: "Do serious events reach the right authority in time?",
  },
  response: {
    label: "Incident Response",
    short: "Response",
    question: "Is there evidence of containment and remediation?",
  },
  secops: {
    label: "Security Operations",
    short: "SecOps",
    question: "Does the SOC operate as a 24×7 control, not a business-hours desk?",
  },
  governance: {
    label: "Governance & Oversight",
    short: "Governance",
    question: "Do claimed controls and reported KPIs match operational evidence?",
  },
  discipline: {
    label: "Operational Discipline",
    short: "Discipline",
    question: "Is work genuine, or shaped to satisfy metrics?",
  },
  resilience: {
    label: "Cyber Resilience",
    short: "Resilience",
    question: "Are root causes closed, or do the same assets keep burning?",
  },
};

export const SECTORS: Sector[] = [
  "Power",
  "BFSI",
  "Telecom",
  "Transport",
  "Healthcare",
  "Oil & Gas",
  "Water",
  "Government",
];

export interface Entity {
  id: string;
  name: string;
  shortName: string;
  sector: Sector;
  region: string;
  criticality: "National" | "Regional" | "Sectoral";
  workforce: number;
  submittedAt: string;
  declaredMaturity: DeclaredMaturity;
  socModel: string;
  declaredKpis: {
    meanTimeToCloseMin: number;
    slaMetPct: number;
    coveragePct: number;
    falsePositivePct: number;
    escalationSlaPct: number;
  };
}

export interface Asset {
  id: string;
  entityId: string;
  name: string;
  type: string;
  zone: AssetZone;
  criticality: Severity;
  telemetryExpected: boolean;
  silent: boolean;
}

export interface Alert {
  id: string;
  entityId: string;
  assetId: string;
  ts: string;
  closedAt: string | null;
  severity: Severity;
  category: string;
  source: string;
  status: AlertStatus;
  disposition: Disposition | null;
  caseId: string | null;
  escalated: boolean;
  ackAt: string | null;
  investigateAt: string | null;
  analyst: string;
  noteFingerprint: string | null;
  slaMinutes: number;
}

export interface CaseRecord {
  id: string;
  entityId: string;
  alertId: string;
  openedAt: string;
  closedAt: string | null;
  analyst: string;
  notes: string;
  actions: number;
  rootCauseFix: boolean;
  escalatedTo: string | null;
  template: boolean;
}

export interface Escalation {
  id: string;
  entityId: string;
  caseId: string;
  alertId: string;
  ts: string;
  fromLevel: string;
  toLevel: string;
  accepted: boolean;
}

export interface Dataset {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  cycle: string;
  entities: Entity[];
  assets: Asset[];
  alerts: Alert[];
  cases: CaseRecord[];
  escalations: Escalation[];
}

export interface EvidenceRow {
  label: string;
  value: string;
  alertId?: string;
  assetId?: string;
  caseId?: string;
}

export interface Finding {
  id: string;
  detectorId: string;
  detectorName: string;
  detectorVersion: string;
  ruleUpdated: string;
  confidence: number;
  evidenceCount: number;
  family: FindingFamily;
  entityId: string;
  severity: Severity;
  title: string;
  summary: string;
  rationale: string[];
  formula: string;
  threshold: string;
  observed: string;
  peerContext: string;
  metricValue: number;
  peerMedian: number | null;
  capability: CapabilityKey;
  recommendedAction: string;
  evidence: EvidenceRow[];
  sampleAlertIds: string[];
  sampleAssetIds: string[];
  informationGain: number;
}

export interface CapabilityScore {
  key: CapabilityKey;
  score: number;
  drivers: string[];
}

export interface SriComponents {
  executionGap: number;
  negativeSpace: number;
  peerDeviation: number;
  operationalAnomaly: number;
  weights: {
    executionGap: number;
    negativeSpace: number;
    peerDeviation: number;
    operationalAnomaly: number;
  };
  formula: string;
}

export interface EntityAssessment {
  entityId: string;
  sri: number;
  band: RiskBand;
  capabilities: CapabilityScore[];
  sriComponents: SriComponents;
  findingIds: string[];
  executionGapCount: number;
  negativeSpaceCount: number;
  anomalyCount: number;
  stats: EntityStats;
  kpiContradiction: { claimed: string; observed: string; gap: string }[];
  reviewPriority: number;
  metricTheatre: number;
}

export interface EntityStats {
  alertCount: number;
  criticalCount: number;
  closedCount: number;
  meanCloseMin: number;
  medianCloseMin: number;
  closureP90Min: number;
  p1CloseUnder15Pct: number;
  criticalEscalationPct: number;
  templateNotePct: number;
  silentCriticalAssets: number;
  criticalAssets: number;
  taxonomyCoveragePct: number;
  weekendVolumeRatio: number;
  falsePositivePct: number;
  repeatAssetFamilies: number;
  shiftDumpPct: number;
  slaCliffPct: number;
  caseLinkPct: number;
  uniqueNoteRatio: number;
  afterHoursPct: number;
  volumeVsPeer: number;
  ackWithoutInvestPct: number;
  analystMaxShare: number;
  topSourceShare: number;
  topAnalyst: string;
  topSource: string;
  // Normalized peer benchmarking rates
  alertsPer100Assets: number;
  p1Ratio: number;
  telemetryAssetCoveragePct: number;
  alertsPer100AssetsResidual: number;
  escalationRateResidual: number;
  p1RatioResidual: number;
  closureMedianResidual: number;
  templateRatioResidual: number;
  telemetryCoverageResidual: number;
}

export interface ReviewItem {
  id: string;
  entityId: string;
  findingId: string;
  rank: number;
  whySampled: string;
  alertIds: string[];
  expectedQuestion: string;
}

export interface NationalSummary {
  entityCount: number;
  alertCount: number;
  findingCount: number;
  immediateCount: number;
  concernCount: number;
  watchCount: number;
  executionGaps: number;
  negativeSpace: number;
  anomalies: number;
  reviewReady: number;
  meanSri: number;
  meanMetricTheatre: number;
  capabilityMeans: Record<CapabilityKey, number>;
  sectorRisk: { sector: Sector; meanSri: number; worstId: string }[];
}

export interface ExpertExpectation {
  entityId: string;
  detectorId: string;
  note: string;
}

export interface ValidationBenchmark {
  corpusType: string;
  statement: string;
  goldSetSize: number;
  recoveredSignals: number;
  recallPct: number;
  precisionPct: number;
  falsePositiveSignals: number;
}

export interface Assessment {
  datasetId: string;
  datasetHash: string;
  ranAt: string;
  qualityScore?: number;
  national: NationalSummary;
  entities: EntityAssessment[];
  findings: Finding[];
  reviewQueue: ReviewItem[];
  validationBenchmark: ValidationBenchmark;
  expectations: {
    total: number;
    hit: number;
    missed: ExpertExpectation[];
    extra: number;
    byDetector: { id: string; total: number; hit: number }[];
  };
}

export interface ExaminerNote {
  id: string;
  targetType: "finding" | "entity" | "alert" | "review";
  targetId: string;
  body: string;
  stance: "corroborates" | "does-not-corroborate" | "needs-more" | "note";
  at: string;
}
