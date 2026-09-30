import type {
  Alert,
  Asset,
  AssetZone,
  CaseRecord,
  Dataset,
  Disposition,
  Entity,
  Escalation,
  ExpertExpectation,
  Sector,
  Severity,
} from "./types.ts";

const SEED = 20260912;
export const WINDOW_END = Date.UTC(2026, 8, 11, 18, 0, 0);
export const WINDOW_START = WINDOW_END - 90 * 24 * 3600 * 1000;
export const CYCLE = "2026-Q3";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function randInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function chance(rng: () => number, p: number) {
  return rng() < p;
}

function pad(n: number, w = 4) {
  return String(n).padStart(w, "0");
}

export const ANALYSTS = [
  "A. Mehra",
  "R. Iyer",
  "S. Banerjee",
  "K. Nair",
  "P. Sharma",
  "M. Qureshi",
  "D. Reddy",
  "N. Kulkarni",
];

export const CATEGORY_CATALOG: Record<Sector, string[]> = {
  Power: [
    "malware",
    "phishing",
    "unauthorized-access",
    "ot-anomaly",
    "ics-unauthorized",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
    "ddos",
  ],
  BFSI: [
    "malware",
    "phishing",
    "fraud",
    "unauthorized-access",
    "data-exfil",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
    "ddos",
  ],
  Telecom: [
    "malware",
    "phishing",
    "unauthorized-access",
    "signaling-anomaly",
    "ddos",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
    "bgp-hijack",
  ],
  Transport: [
    "malware",
    "phishing",
    "unauthorized-access",
    "ot-anomaly",
    "signaling-anomaly",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
    "ddos",
  ],
  Healthcare: [
    "malware",
    "phishing",
    "ransomware",
    "unauthorized-access",
    "medical-device",
    "data-exfil",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
  ],
  "Oil & Gas": [
    "malware",
    "phishing",
    "unauthorized-access",
    "ot-anomaly",
    "ics-unauthorized",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
    "ddos",
  ],
  Water: [
    "malware",
    "phishing",
    "unauthorized-access",
    "ot-anomaly",
    "ics-unauthorized",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
    "ddos",
  ],
  Government: [
    "malware",
    "phishing",
    "unauthorized-access",
    "data-exfil",
    "policy-violation",
    "misconfiguration",
    "lateral-movement",
    "insider",
    "ddos",
    "identity-abuse",
  ],
};

const SOURCES_IT = ["EDR", "SIEM", "NDR", "Email-GW", "Firewall", "IDS", "DLP", "IAM", "WAF"];
const SOURCES_OT = ["OT-sensor", "Historian", "ICS-IDS", "PLC-log"];

const NOTE_TEMPLATES = [
  "Reviewed alert against known-good baseline. No indicators of compromise observed. Closed as false positive per SOP 4.2. No further action required.",
  "User confirmed activity as authorised change window. Correlated with CAB ticket. Disposition: benign. Monitoring watchlist updated.",
  "Signature match on legacy rule. Tuned exclusion applied. Closed duplicate of earlier case. SLA met. Notified via dashboard.",
];

const GENUINE_NOTES = [
  "Memory dump from host shows rundll32 spawning encoded PowerShell. Isolated endpoint, pulled $MFT, hunting sibling hosts on same VLAN.",
  "OT historian reported out-of-band write to holding register 40021 on RTU. Vendor remote session was not ticketed. Escalated to plant operations and CISO.",
  "Phishing kit domain registered 11 hours prior, 14 users clicked, 3 submitted credentials. Forced reset, revoked sessions, blocked domain at recursive DNS.",
  "Repeated failed authentications against payment switch from a jump host that should not originate traffic. Opened incident, captured PCAPs, engaged network team.",
  "Lateral movement from finance VLAN to core using stolen service account. Disabled account, rotated secrets, reviewing 72h of DC logs.",
];

interface Persona {
  alertTarget: number;
  rapidCloseCritical: number;
  escalateCritical: number;
  templateRate: number;
  slaCliff: number;
  shiftDump: number;
  silentCriticalPct: number;
  missingCategories: string[];
  weekendRatio: number;
  repeatAsset: boolean;
  fpRate: number;
  emptyNotes: number;
  afterHours: number;
  otBlind: boolean;
  assetCount: number;
  criticalAssets: number;
  dominantAnalystPct?: number;
  forceSource?: string;
}

interface EntityDef {
  entity: Omit<Entity, "declaredKpis"> & { declaredKpis?: Entity["declaredKpis"] };
  persona: Persona;
}

const DEFS: EntityDef[] = [
  {
    entity: {
      id: "CSE-PWR-001",
      name: "Northern Grid Corporation",
      shortName: "Northern Grid",
      sector: "Power",
      region: "North",
      criticality: "National",
      workforce: 18420,
      submittedAt: "2026-09-01",
      declaredMaturity: "Optimised",
      socModel: "In-house 24×7",
    },
    persona: {
      alertTarget: 240,
      rapidCloseCritical: 0.44,
      escalateCritical: 0.09,
      templateRate: 0.18,
      slaCliff: 0.12,
      shiftDump: 0.16,
      silentCriticalPct: 0.36,
      missingCategories: ["ot-anomaly", "ics-unauthorized"],
      weekendRatio: 0.42,
      repeatAsset: true,
      fpRate: 0.58,
      emptyNotes: 0.22,
      afterHours: 0.18,
      otBlind: true,
      assetCount: 34,
      criticalAssets: 14,
    },
  },
  {
    entity: {
      id: "CSE-BFS-001",
      name: "Apex National Bank",
      shortName: "Apex Bank",
      sector: "BFSI",
      region: "West",
      criticality: "National",
      workforce: 41200,
      submittedAt: "2026-09-02",
      declaredMaturity: "Managed",
      socModel: "Hybrid MSSP",
    },
    persona: {
      alertTarget: 310,
      rapidCloseCritical: 0.28,
      escalateCritical: 0.07,
      templateRate: 0.71,
      slaCliff: 0.14,
      shiftDump: 0.11,
      silentCriticalPct: 0.08,
      missingCategories: [],
      weekendRatio: 0.55,
      repeatAsset: false,
      fpRate: 0.49,
      emptyNotes: 0.08,
      afterHours: 0.32,
      otBlind: false,
      assetCount: 40,
      criticalAssets: 12,
    },
  },
  {
    entity: {
      id: "CSE-TEL-001",
      name: "Veda Communications",
      shortName: "Veda Comms",
      sector: "Telecom",
      region: "National",
      criticality: "National",
      workforce: 26800,
      submittedAt: "2026-08-30",
      declaredMaturity: "Managed",
      socModel: "In-house 24×7",
    },
    persona: {
      alertTarget: 280,
      rapidCloseCritical: 0.04,
      escalateCritical: 0.62,
      templateRate: 0.08,
      slaCliff: 0.04,
      shiftDump: 0.05,
      silentCriticalPct: 0.04,
      missingCategories: [],
      weekendRatio: 0.88,
      repeatAsset: false,
      fpRate: 0.31,
      emptyNotes: 0.04,
      afterHours: 0.41,
      otBlind: false,
      assetCount: 36,
      criticalAssets: 11,
    },
  },
  {
    entity: {
      id: "CSE-TRN-001",
      name: "National Rail Systems",
      shortName: "National Rail",
      sector: "Transport",
      region: "National",
      criticality: "National",
      workforce: 52100,
      submittedAt: "2026-09-03",
      declaredMaturity: "Defined",
      socModel: "In-house 16×7",
    },
    persona: {
      alertTarget: 190,
      rapidCloseCritical: 0.16,
      escalateCritical: 0.28,
      templateRate: 0.22,
      slaCliff: 0.09,
      shiftDump: 0.14,
      silentCriticalPct: 0.18,
      missingCategories: [],
      weekendRatio: 0.12,
      repeatAsset: true,
      fpRate: 0.44,
      emptyNotes: 0.18,
      afterHours: 0.11,
      otBlind: false,
      assetCount: 32,
      criticalAssets: 12,
    },
  },
  {
    entity: {
      id: "CSE-HLT-001",
      name: "Prana Health Network",
      shortName: "Prana Health",
      sector: "Healthcare",
      region: "South",
      criticality: "Regional",
      workforce: 9600,
      submittedAt: "2026-09-01",
      declaredMaturity: "Managed",
      socModel: "MSSP",
    },
    persona: {
      alertTarget: 150,
      rapidCloseCritical: 0.21,
      escalateCritical: 0.18,
      templateRate: 0.34,
      slaCliff: 0.11,
      shiftDump: 0.13,
      silentCriticalPct: 0.42,
      missingCategories: ["ransomware", "medical-device"],
      weekendRatio: 0.36,
      repeatAsset: false,
      fpRate: 0.86,
      emptyNotes: 0.16,
      afterHours: 0.14,
      otBlind: false,
      assetCount: 28,
      criticalAssets: 10,
    },
  },
  {
    entity: {
      id: "CSE-OIL-001",
      name: "Coastal Petroleum",
      shortName: "Coastal Petro",
      sector: "Oil & Gas",
      region: "West",
      criticality: "National",
      workforce: 14300,
      submittedAt: "2026-08-29",
      declaredMaturity: "Defined",
      socModel: "In-house + plant SOC",
    },
    persona: {
      alertTarget: 170,
      rapidCloseCritical: 0.19,
      escalateCritical: 0.22,
      templateRate: 0.15,
      slaCliff: 0.41,
      shiftDump: 0.12,
      silentCriticalPct: 0.28,
      missingCategories: [],
      weekendRatio: 0.5,
      repeatAsset: true,
      fpRate: 0.4,
      emptyNotes: 0.12,
      afterHours: 0.22,
      otBlind: true,
      assetCount: 30,
      criticalAssets: 13,
    },
  },
  {
    entity: {
      id: "CSE-WTR-001",
      name: "Metro Water Authority",
      shortName: "Metro Water",
      sector: "Water",
      region: "North",
      criticality: "Regional",
      workforce: 4200,
      submittedAt: "2026-09-04",
      declaredMaturity: "Developing",
      socModel: "Shared sector SOC",
    },
    persona: {
      alertTarget: 95,
      rapidCloseCritical: 0.12,
      escalateCritical: 0.24,
      templateRate: 0.2,
      slaCliff: 0.08,
      shiftDump: 0.1,
      silentCriticalPct: 0.22,
      missingCategories: ["lateral-movement"],
      weekendRatio: 0.28,
      repeatAsset: false,
      fpRate: 0.47,
      emptyNotes: 0.2,
      afterHours: 0.09,
      otBlind: true,
      assetCount: 22,
      criticalAssets: 8,
      dominantAnalystPct: 0.7,
    },
  },
  {
    entity: {
      id: "CSE-GOV-001",
      name: "Satya Digital Services",
      shortName: "Satya Digital",
      sector: "Government",
      region: "National",
      criticality: "National",
      workforce: 7800,
      submittedAt: "2026-08-31",
      declaredMaturity: "Defined",
      socModel: "In-house 24×7",
    },
    persona: {
      alertTarget: 210,
      rapidCloseCritical: 0.08,
      escalateCritical: 0.48,
      templateRate: 0.14,
      slaCliff: 0.06,
      shiftDump: 0.07,
      silentCriticalPct: 0.1,
      missingCategories: [],
      weekendRatio: 0.7,
      repeatAsset: false,
      fpRate: 0.36,
      emptyNotes: 0.09,
      afterHours: 0.33,
      otBlind: false,
      assetCount: 28,
      criticalAssets: 9,
    },
  },
  {
    entity: {
      id: "CSE-PWR-002",
      name: "Himalayan Hydro",
      shortName: "Himalayan Hydro",
      sector: "Power",
      region: "North",
      criticality: "Regional",
      workforce: 2100,
      submittedAt: "2026-09-02",
      declaredMaturity: "Managed",
      socModel: "Plant IT desk",
    },
    persona: {
      alertTarget: 28,
      rapidCloseCritical: 0.1,
      escalateCritical: 0.15,
      templateRate: 0.25,
      slaCliff: 0.05,
      shiftDump: 0.08,
      silentCriticalPct: 0.55,
      missingCategories: ["malware", "lateral-movement", "ot-anomaly", "ics-unauthorized"],
      weekendRatio: 0.02,
      repeatAsset: false,
      fpRate: 0.62,
      emptyNotes: 0.3,
      afterHours: 0.02,
      otBlind: true,
      assetCount: 18,
      criticalAssets: 9,
      forceSource: "SIEM",
    },
  },
  {
    entity: {
      id: "CSE-TRN-002",
      name: "Eastern Ports Authority",
      shortName: "Eastern Ports",
      sector: "Transport",
      region: "East",
      criticality: "Regional",
      workforce: 6400,
      submittedAt: "2026-09-03",
      declaredMaturity: "Defined",
      socModel: "Port SOC 18×7",
    },
    persona: {
      alertTarget: 130,
      rapidCloseCritical: 0.14,
      escalateCritical: 0.26,
      templateRate: 0.19,
      slaCliff: 0.1,
      shiftDump: 0.15,
      silentCriticalPct: 0.16,
      missingCategories: [],
      weekendRatio: 0.48,
      repeatAsset: true,
      fpRate: 0.41,
      emptyNotes: 0.14,
      afterHours: 0.16,
      otBlind: false,
      assetCount: 24,
      criticalAssets: 9,
    },
  },
  {
    entity: {
      id: "CSE-BFS-002",
      name: "Indus Payment Rails",
      shortName: "Indus Rails",
      sector: "BFSI",
      region: "National",
      criticality: "National",
      workforce: 1900,
      submittedAt: "2026-08-28",
      declaredMaturity: "Optimised",
      socModel: "In-house 24×7",
    },
    persona: {
      alertTarget: 260,
      rapidCloseCritical: 0.03,
      escalateCritical: 0.71,
      templateRate: 0.05,
      slaCliff: 0.03,
      shiftDump: 0.04,
      silentCriticalPct: 0.02,
      missingCategories: [],
      weekendRatio: 0.92,
      repeatAsset: false,
      fpRate: 0.27,
      emptyNotes: 0.03,
      afterHours: 0.44,
      otBlind: false,
      assetCount: 26,
      criticalAssets: 10,
    },
  },
  {
    entity: {
      id: "CSE-PWR-003",
      name: "Southern Thermal Generation",
      shortName: "Southern Thermal",
      sector: "Power",
      region: "South",
      criticality: "Regional",
      workforce: 8700,
      submittedAt: "2026-09-01",
      declaredMaturity: "Managed",
      socModel: "In-house day / on-call night",
    },
    persona: {
      alertTarget: 175,
      rapidCloseCritical: 0.33,
      escalateCritical: 0.16,
      templateRate: 0.27,
      slaCliff: 0.18,
      shiftDump: 0.46,
      silentCriticalPct: 0.2,
      missingCategories: ["ics-unauthorized"],
      weekendRatio: 0.22,
      repeatAsset: true,
      fpRate: 0.52,
      emptyNotes: 0.44,
      afterHours: 0.07,
      otBlind: true,
      assetCount: 26,
      criticalAssets: 10,
    },
  },
];

const ASSET_TYPES: Record<Sector, { type: string; zone: AssetZone; critical: boolean }[]> = {
  Power: [
    { type: "Substation RTU", zone: "OT", critical: true },
    { type: "SCADA HMI", zone: "OT", critical: true },
    { type: "Historian", zone: "OT", critical: true },
    { type: "PLC", zone: "OT", critical: true },
    { type: "EMS server", zone: "OT", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "Corporate endpoint", zone: "IT", critical: false },
    { type: "Email gateway", zone: "IT", critical: true },
    { type: "VPN concentrator", zone: "IT", critical: true },
    { type: "Cloud jump host", zone: "Cloud", critical: false },
  ],
  BFSI: [
    { type: "Core banking", zone: "Payment", critical: true },
    { type: "Payment switch", zone: "Payment", critical: true },
    { type: "ATM controller", zone: "Payment", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "Internet banking", zone: "Cloud", critical: true },
    { type: "SWIFT gateway", zone: "Payment", critical: true },
    { type: "Endpoint", zone: "IT", critical: false },
    { type: "Email gateway", zone: "IT", critical: true },
    { type: "SOC jump host", zone: "IT", critical: false },
  ],
  Telecom: [
    { type: "HLR/HSS", zone: "OT", critical: true },
    { type: "BSS/OSS", zone: "IT", critical: true },
    { type: "Peering router", zone: "OT", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "Customer portal", zone: "Cloud", critical: false },
    { type: "Endpoint", zone: "IT", critical: false },
    { type: "Email gateway", zone: "IT", critical: true },
  ],
  Transport: [
    { type: "Signalling controller", zone: "OT", critical: true },
    { type: "Yard PLC", zone: "OT", critical: true },
    { type: "Crane control", zone: "OT", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "Booking system", zone: "IT", critical: true },
    { type: "Endpoint", zone: "IT", critical: false },
    { type: "VPN concentrator", zone: "IT", critical: true },
  ],
  Healthcare: [
    { type: "EHR cluster", zone: "Clinical", critical: true },
    { type: "PACS", zone: "Clinical", critical: true },
    { type: "Infusion pump gw", zone: "Clinical", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "Patient portal", zone: "Cloud", critical: false },
    { type: "Endpoint", zone: "IT", critical: false },
    { type: "Email gateway", zone: "IT", critical: true },
  ],
  "Oil & Gas": [
    { type: "DCS controller", zone: "OT", critical: true },
    { type: "Safety PLC", zone: "OT", critical: true },
    { type: "Pipeline RTU", zone: "OT", critical: true },
    { type: "Historian", zone: "OT", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "Endpoint", zone: "IT", critical: false },
    { type: "Vendor jump host", zone: "IT", critical: true },
  ],
  Water: [
    { type: "Plant SCADA", zone: "OT", critical: true },
    { type: "Pump PLC", zone: "OT", critical: true },
    { type: "Chemical dosing", zone: "OT", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "Endpoint", zone: "IT", critical: false },
    { type: "Remote telemetry", zone: "OT", critical: true },
  ],
  Government: [
    { type: "Identity provider", zone: "Identity", critical: true },
    { type: "Citizen portal", zone: "Cloud", critical: true },
    { type: "Domain controller", zone: "IT", critical: true },
    { type: "PKI HSM", zone: "Identity", critical: true },
    { type: "Endpoint", zone: "IT", critical: false },
    { type: "Email gateway", zone: "IT", critical: true },
  ],
};

function iso(ms: number) {
  return new Date(ms).toISOString();
}

function hourOf(ms: number) {
  return new Date(ms).getUTCHours();
}

function dow(ms: number) {
  return new Date(ms).getUTCDay();
}

function makeAssets(def: EntityDef, rng: () => number): Asset[] {
  const catalog = ASSET_TYPES[def.entity.sector];
  const assets: Asset[] = [];
  const criticalBudget = def.persona.criticalAssets;
  const silentBudget = Math.round(criticalBudget * def.persona.silentCriticalPct);
  let criticalMade = 0;
  let silentMade = 0;

  for (let i = 0; i < def.persona.assetCount; i++) {
    const proto = catalog[i % catalog.length]!;
    const wantCritical = criticalMade < criticalBudget && (proto.critical || chance(rng, 0.25));
    const crit: Severity = wantCritical ? (chance(rng, 0.45) ? "critical" : "high") : chance(rng, 0.4) ? "medium" : "low";
    if (wantCritical) criticalMade += 1;
    const isCrit = crit === "critical" || crit === "high";
    const silent =
      isCrit &&
      proto.zone === "OT" &&
      def.persona.otBlind &&
      silentMade < silentBudget
        ? true
        : isCrit && silentMade < silentBudget && chance(rng, 0.7);
    if (silent) silentMade += 1;
    const zone = proto.zone;
    assets.push({
      id: `${def.entity.id}-A${pad(i + 1, 3)}`,
      entityId: def.entity.id,
      name: `${proto.type} ${String.fromCharCode(65 + (i % 26))}${1 + Math.floor(i / 26)}`,
      type: proto.type,
      zone,
      criticality: crit,
      telemetryExpected: true,
      silent,
    });
  }
  while (silentMade < silentBudget) {
    const c = assets.find((a) => (a.criticality === "critical" || a.criticality === "high") && !a.silent);
    if (!c) break;
    c.silent = true;
    silentMade += 1;
  }
  return assets;
}

function pickTimestamp(rng: () => number, weekendRatio: number, afterHours: number, shiftDump: boolean): number {
  for (let attempt = 0; attempt < 12; attempt++) {
    const t = WINDOW_START + rng() * (WINDOW_END - WINDOW_START);
    const day = dow(t);
    const isWeekend = day === 0 || day === 6;
    const weekdayShare = 1 / (5 + 2 * weekendRatio);
    const pWeekend = (2 * weekendRatio * weekdayShare) / 2;
    if (isWeekend && rng() > pWeekend * 3.2) continue;
    const h = hourOf(t);
    if (shiftDump && h >= 12 && h < 18 && chance(rng, 0.35)) {
      const dump = new Date(t);
      dump.setUTCHours(17, randInt(rng, 35, 58), randInt(rng, 0, 59), 0);
      return dump.getTime();
    }
    const business = h >= 8 && h < 18;
    if (!business && rng() > afterHours) continue;
    return t;
  }
  return WINDOW_START + rng() * (WINDOW_END - WINDOW_START);
}

function slaFor(sev: Severity) {
  if (sev === "critical") return 60;
  if (sev === "high") return 240;
  if (sev === "medium") return 1440;
  return 4320;
}

function fingerprintNote(notes: string) {
  return notes
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/[^a-z# ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function declaredFromPersona(p: Persona): Entity["declaredKpis"] {
  const optimisticClose = p.rapidCloseCritical > 0.2 ? 12 + p.rapidCloseCritical * 8 : 38;
  return {
    meanTimeToCloseMin: Math.round(optimisticClose),
    slaMetPct: p.slaCliff > 0.3 ? 0.99 : 0.92 + (1 - p.rapidCloseCritical) * 0.05,
    coveragePct: p.silentCriticalPct > 0.2 ? 0.98 : 0.94,
    falsePositivePct: Math.max(0.12, p.fpRate - 0.25),
    escalationSlaPct: p.escalateCritical < 0.2 ? 0.97 : 0.91,
  };
}

export function buildDataset(seed = SEED): Dataset {
  const rng = mulberry32(seed);
  const entities: Entity[] = [];
  const assets: Asset[] = [];
  const alerts: Alert[] = [];
  const cases: CaseRecord[] = [];
  const escalations: Escalation[] = [];
  let alertSeq = 0;
  let caseSeq = 0;
  let escSeq = 0;

  for (const def of DEFS) {
    const e: Entity = {
      ...def.entity,
      declaredKpis: declaredFromPersona(def.persona),
    };
    entities.push(e);
    const entAssets = makeAssets(def, rng);
    assets.push(...entAssets);
    const liveAssets = entAssets.filter((a) => !a.silent);
    const silentAssets = entAssets.filter((a) => a.silent);
    const cats = CATEGORY_CATALOG[e.sector].filter((c) => !def.persona.missingCategories.includes(c));
    const repeatTarget = def.persona.repeatAsset
      ? liveAssets.find((a) => a.criticality === "critical" || a.criticality === "high") ?? liveAssets[0]
      : null;

    const n = def.persona.alertTarget;
    for (let i = 0; i < n; i++) {
      alertSeq += 1;
      const isRepeat = Boolean(repeatTarget) && i < Math.round(n * 0.12);
      const asset = isRepeat ? repeatTarget! : pick(rng, liveAssets.length ? liveAssets : entAssets);
      const severityRoll = rng();
      const severity: Severity =
        severityRoll < 0.07 ? "critical" : severityRoll < 0.22 ? "high" : severityRoll < 0.62 ? "medium" : "low";
      const category = pick(rng, cats.length ? cats : CATEGORY_CATALOG[e.sector]);
      const otAsset = asset.zone === "OT";
      const source =
        def.persona.forceSource && chance(rng, 0.82)
          ? def.persona.forceSource
          : otAsset && !def.persona.otBlind
            ? pick(rng, SOURCES_OT)
            : pick(rng, SOURCES_IT);
      const ts = pickTimestamp(
        rng,
        def.persona.weekendRatio,
        def.persona.afterHours,
        def.persona.shiftDump > 0.3 && chance(rng, def.persona.shiftDump),
      );
      const sla = slaFor(severity);
      const isCrit = severity === "critical" || severity === "high";
      const rapid = isCrit && chance(rng, def.persona.rapidCloseCritical);
      const dump = chance(rng, def.persona.shiftDump);
      const cliff = chance(rng, def.persona.slaCliff);
      let closeMin: number;
      if (rapid) closeMin = 3 + rng() * 11;
      else if (cliff) closeMin = sla * (0.9 + rng() * 0.09);
      else closeMin = sla * (0.25 + rng() * 0.7);
      if (dump && !rapid) {
        const d = new Date(ts);
        const close = new Date(d);
        close.setUTCHours(17, randInt(rng, 38, 59), randInt(rng, 0, 59), 0);
        if (close.getTime() <= ts) close.setTime(ts + closeMin * 60000);
        closeMin = (close.getTime() - ts) / 60000;
      }
      const closedAt = ts + closeMin * 60000;
      const stillOpen = chance(rng, 0.06);
      const escalate = isCrit && chance(rng, def.persona.escalateCritical);
      const useTemplate = chance(rng, def.persona.templateRate);
      const empty = chance(rng, def.persona.emptyNotes);
      const notes = empty
        ? "Closed."
        : useTemplate
          ? pick(rng, NOTE_TEMPLATES)
          : pick(rng, GENUINE_NOTES);
      const analyst =
        def.persona.dominantAnalystPct && chance(rng, def.persona.dominantAnalystPct)
          ? ANALYSTS[0]!
          : pick(rng, ANALYSTS);
      const fp = chance(rng, def.persona.fpRate);
      const disposition: Disposition = stillOpen
        ? "undetermined"
        : escalate && !fp
          ? "incident"
          : fp
            ? chance(rng, 0.25)
              ? "benign"
              : "false_positive"
            : chance(rng, 0.2)
              ? "true_positive"
              : chance(rng, 0.5)
                ? "duplicate"
                : "true_positive";
      const makeCase = !empty && (isCrit || chance(rng, 0.55));
      let caseId: string | null = null;
      let noteFp: string | null = empty ? "closed" : fingerprintNote(notes);

      if (makeCase) {
        caseSeq += 1;
        caseId = `C-${pad(caseSeq, 5)}`;
        const actions = empty ? 0 : useTemplate ? randInt(rng, 0, 1) : randInt(rng, 3, 8);
        cases.push({
          id: caseId,
          entityId: e.id,
          alertId: `AL-${pad(alertSeq, 5)}`,
          openedAt: iso(ts + (2 + rng() * 18) * 60000),
          closedAt: stillOpen ? null : iso(closedAt),
          analyst,
          notes,
          actions,
          rootCauseFix: Boolean(isRepeat) ? false : !useTemplate && chance(rng, 0.35),
          escalatedTo: escalate ? pick(rng, ["CSIRT", "CISO-office", "Plant-ops", "Sector-CERT"]) : null,
          template: useTemplate || empty,
        });
        if (escalate) {
          escSeq += 1;
          escalations.push({
            id: `ES-${pad(escSeq, 4)}`,
            entityId: e.id,
            caseId,
            alertId: `AL-${pad(alertSeq, 5)}`,
            ts: iso(ts + (20 + rng() * 90) * 60000),
            fromLevel: "L1",
            toLevel: "L2",
            accepted: chance(rng, 0.85),
          });
        }
      }

      const status: Alert["status"] = stillOpen
        ? chance(rng, 0.4)
          ? "investigating"
          : "acknowledged"
        : escalate
          ? "escalated"
          : "closed";

      alerts.push({
        id: `AL-${pad(alertSeq, 5)}`,
        entityId: e.id,
        assetId: asset.id,
        ts: iso(ts),
        closedAt: stillOpen ? null : iso(Math.min(closedAt, WINDOW_END + 2 * 86400000)),
        severity,
        category,
        source,
        status: stillOpen ? status : escalate ? "closed" : "closed",
        disposition: stillOpen ? null : disposition,
        caseId,
        escalated: escalate,
        ackAt: iso(ts + (1 + rng() * 12) * 60000),
        investigateAt: empty ? null : iso(ts + (8 + rng() * 40) * 60000),
        analyst,
        noteFingerprint: noteFp,
        slaMinutes: sla,
      });
    }

    void silentAssets;
  }

  return {
    generatedAt: iso(WINDOW_END),
    windowStart: iso(WINDOW_START),
    windowEnd: iso(WINDOW_END),
    cycle: CYCLE,
    entities,
    assets,
    alerts,
    cases,
    escalations,
  };
}

export const DEMO_DATASET: Dataset = buildDataset();

export const EXPERT_EXPECTATIONS: ExpertExpectation[] = [
  { entityId: "CSE-PWR-001", detectorId: "EG-01", note: "Rapid closure of high-severity alerts without investigation depth." },
  { entityId: "CSE-PWR-001", detectorId: "EG-02", note: "Critical alerts closed without escalation to plant ops / CSIRT." },
  { entityId: "CSE-PWR-001", detectorId: "NS-02", note: "OT anomaly and ICS unauthorised categories entirely absent." },
  { entityId: "CSE-PWR-001", detectorId: "NS-04", note: "SCADA / RTU estate generating no OT telemetry." },
  { entityId: "CSE-PWR-001", detectorId: "EG-05", note: "Repeat alerts on the same critical substation without root-cause fix." },
  { entityId: "CSE-BFS-001", detectorId: "EG-03", note: "Template-driven investigations dominating case notes." },
  { entityId: "CSE-BFS-001", detectorId: "EG-02", note: "P1 escalation rate far below sector peers despite high volume." },
  { entityId: "CSE-HLT-001", detectorId: "NS-02", note: "No ransomware or medical-device alert classes in 90 days." },
  { entityId: "CSE-HLT-001", detectorId: "NS-01", note: "EHR / clinical assets silent despite being marked critical." },
  { entityId: "CSE-HLT-001", detectorId: "AN-01", note: "False-positive rate inconsistent with a clinical threat landscape." },
  { entityId: "CSE-OIL-001", detectorId: "EG-04", note: "Closures clustered at the SLA cliff — metric satisfaction without risk reduction." },
  { entityId: "CSE-OIL-001", detectorId: "NS-04", note: "OT/DCS coverage blind spot on safety-critical controllers." },
  { entityId: "CSE-PWR-002", detectorId: "NS-03", note: "Alert volume an order of magnitude below hydro generation peers." },
  { entityId: "CSE-PWR-002", detectorId: "NS-05", note: "Weekend monitoring effectively absent." },
  { entityId: "CSE-PWR-002", detectorId: "NS-02", note: "Core threat classes missing for a generation operator." },
  { entityId: "CSE-PWR-003", detectorId: "EG-06", note: "Mass closures in the last 20 minutes of the day shift." },
  { entityId: "CSE-TRN-001", detectorId: "NS-05", note: "Weekend blackout inconsistent with 24×7 rail operations." },
  { entityId: "CSE-WTR-001", detectorId: "NS-02", note: "No lateral-movement detections across the plant network." },
  { entityId: "CSE-PWR-003", detectorId: "EG-07", note: "Alerts acknowledged and closed without an investigation timestamp." },
  { entityId: "CSE-WTR-001", detectorId: "AN-03", note: "A single analyst accounts for the majority of closures." },
  { entityId: "CSE-PWR-002", detectorId: "NS-06", note: "Nearly all detections originate from a single SIEM source." },
];

export function datasetToAlertsCsv(ds: Dataset) {
  const header = [
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
  ];
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = ds.alerts.map((a) => {
    const ent = ds.entities.find((e) => e.id === a.entityId);
    const notes = ds.cases.find((c) => c.alertId === a.id)?.notes ?? a.noteFingerprint ?? "";
    return [
      a.id,
      a.entityId,
      cell(ent?.name ?? ""),
      cell(ent?.sector ?? ""),
      a.assetId,
      a.ts,
      a.closedAt ?? "",
      a.severity,
      a.category,
      a.source,
      a.status,
      a.disposition ?? "",
      a.caseId ?? "",
      a.escalated ? "true" : "false",
      cell(a.analyst),
      String(a.slaMinutes),
      cell(notes),
    ].join(",");
  });
  return [header.join(","), ...rows].join("\n");
}
