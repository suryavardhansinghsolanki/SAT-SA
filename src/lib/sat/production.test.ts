import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_DATASET } from "./corpus.ts";
import { assess } from "./engine.ts";
import { REQUIRED_COLUMNS, validateAndIngestSubmission } from "./schema.ts";
import { sha256 } from "./sha256.ts";
import { clusterNotes, noteSimilarity } from "./similarity.ts";
import {
  appendAuditBlock,
  createGenesisBlock,
  verifyLedgerIntegrity,
  type AuditBlock,
} from "./vault.ts";

test("sha256 matches NIST standard test vectors", () => {
  assert.equal(sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(sha256("hello"), "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  assert.equal(sha256("NCIIPC"), "27c05d60e2b2c2a646b4855f64942a0b37f178d2a00e55978c7f9b873823f298");
});

test("note similarity clusters near-identical investigation notes", () => {
  const sim1 = noteSimilarity("False positive.", "False-positive");
  assert.ok(sim1 >= 0.85, `Expected similarity >= 0.85, got ${sim1}`);

  const sim2 = noteSimilarity("No issue found.", "No issues found");
  assert.ok(sim2 >= 0.85, `Expected similarity >= 0.85, got ${sim2}`);

  const sim3 = noteSimilarity("False positive.", "Active malware command and control traffic");
  assert.ok(sim3 < 0.35, `Expected low similarity, got ${sim3}`);

  const notes = [
    "False positive.",
    "False-positive",
    "false positive",
    "No issue found.",
    "No issues found",
    "Unusual beaconing investigated, endpoint isolated",
  ];
  const clusterRes = clusterNotes(notes, 0.70);
  assert.equal(clusterRes.totalNotes, 6);
  assert.equal(clusterRes.uniqueClusters, 3);
  assert.equal(clusterRes.largestClusterSize, 3);
  assert.ok(clusterRes.templateRate > 0.7);
});

test("schema validator rejects missing required columns gracefully without throwing", () => {
  const missingColCsv = "alert_id,entity_id,severity\nAL-1,E1,critical";
  const result = validateAndIngestSubmission(missingColCsv);

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errorType, "MISSING_REQUIRED_COLUMNS");
    assert.ok(result.summary.includes("Missing required column"));
    assert.ok(result.datasetHash.length === 64);
  }
});

test("schema validator normalizes column aliases and parses valid CSV", () => {
  const validHeader = REQUIRED_COLUMNS.join(",");
  const row1 = "AL-001,CSE-01,Entity Alpha,Power,AST-1,2026-09-01T10:00:00Z,2026-09-01T10:10:00Z,critical,malware,SIEM,closed,incident,C-01,true,Analyst1,60,Canned note";
  const row2 = "AL-002,CSE-01,Entity Alpha,Power,AST-2,2026-09-01T11:00:00Z,2026-09-01T11:12:00Z,critical,malware,SIEM,closed,incident,C-02,false,Analyst1,60,Canned note";
  const row3 = "AL-003,CSE-01,Entity Alpha,Power,AST-1,2026-09-01T12:00:00Z,2026-09-01T12:13:00Z,critical,malware,SIEM,closed,incident,C-03,false,Analyst1,60,Canned note";
  const row4 = "AL-004,CSE-01,Entity Alpha,Power,AST-1,2026-09-01T13:00:00Z,2026-09-01T13:14:00Z,critical,malware,SIEM,closed,incident,C-04,false,Analyst1,60,Canned note";
  const row5 = "AL-005,CSE-01,Entity Alpha,Power,AST-1,2026-09-01T14:00:00Z,2026-09-01T14:15:00Z,critical,malware,SIEM,closed,incident,C-05,false,Analyst1,60,Canned note";

  const csv = [validHeader, row1, row2, row3, row4, row5].join("\n");
  const result = validateAndIngestSubmission(csv);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.metrics.acceptedAlerts, 5);
    assert.equal(result.metrics.entitiesDetected, 1);
    assert.ok(result.metrics.qualityScorePct >= 90);
    assert.ok(result.datasetHash.length === 64);
  }
});

test("schema validator handles duplicates and invalid timestamps", () => {
  const validHeader = REQUIRED_COLUMNS.join(",");
  const row1 = "AL-001,CSE-01,Entity Alpha,Power,AST-1,2026-09-01T10:00:00Z,2026-09-01T10:10:00Z,critical,malware,SIEM,closed,incident,C-01,true,Analyst1,60,Note";
  const duplicateRow = "AL-001,CSE-01,Entity Alpha,Power,AST-1,2026-09-01T10:00:00Z,2026-09-01T10:10:00Z,critical,malware,SIEM,closed,incident,C-01,true,Analyst1,60,Note";
  const invalidDateRow = "AL-002,CSE-01,Entity Alpha,Power,AST-1,INVALID_DATE_TIME,2026-09-01T10:10:00Z,critical,malware,SIEM,closed,incident,C-02,true,Analyst1,60,Note";
  const row3 = "AL-003,CSE-01,Entity Alpha,Power,AST-1,2026-09-01T12:00:00Z,2026-09-01T12:10:00Z,high,malware,SIEM,closed,incident,C-03,true,Analyst1,60,Note";

  const csv = [validHeader, row1, duplicateRow, invalidDateRow, row3].join("\n");
  const result = validateAndIngestSubmission(csv);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.metrics.acceptedAlerts, 2);
    assert.equal(result.metrics.duplicateAlertsDeduplicated, 1);
    assert.equal(result.metrics.invalidTimestampRowsCount, 1);
    assert.ok(result.warnings.length >= 2);
  }
});

test("tamper-evident audit chain verifies continuity and detects tampering", () => {
  let ledger: AuditBlock[] = [createGenesisBlock()];
  assert.equal(verifyLedgerIntegrity(ledger).intact, true);

  ledger = appendAuditBlock(ledger, {
    examinerId: "NCIIPC-EX-4092",
    action: "CORROBORATES",
    targetType: "finding",
    targetId: "EG-01:CSE-PWR-001",
    rationale: "Forensic evidence confirms rapid critical closure without investigation artefacts.",
  });
  assert.equal(ledger.length, 2);
  assert.equal(verifyLedgerIntegrity(ledger).intact, true);

  ledger = appendAuditBlock(ledger, {
    examinerId: "NCIIPC-EX-4092",
    action: "NEEDS_MORE_EVIDENCE",
    targetType: "review_item",
    targetId: "RQ-01",
    rationale: "Requested additional endpoint EDR telemetry for substation controller.",
  });
  assert.equal(ledger.length, 3);
  assert.equal(verifyLedgerIntegrity(ledger).intact, true);

  // Simulate tampering in block #1
  const tampered = JSON.parse(JSON.stringify(ledger)) as AuditBlock[];
  tampered[1]!.rationale = "Tampered unauthorized text";
  const tamperedCheck = verifyLedgerIntegrity(tampered);
  assert.equal(tamperedCheck.intact, false);
  assert.equal(tamperedCheck.failedIndex, 1);
});

test("engine calculates transparent SRI and component weights for all entities", () => {
  const result = assess(DEMO_DATASET);
  assert.ok(result.entities.length === 12);

  for (const ent of result.entities) {
    const c = ent.sriComponents;
    assert.ok(c.executionGap >= 0 && c.executionGap <= 100);
    assert.ok(c.negativeSpace >= 0 && c.negativeSpace <= 100);
    assert.ok(c.peerDeviation >= 0 && c.peerDeviation <= 100);
    assert.ok(c.operationalAnomaly >= 0 && c.operationalAnomaly <= 100);

    // Verify SRI matches transparent formula
    const expectedDeduction =
      0.35 * c.executionGap +
      0.25 * c.negativeSpace +
      0.20 * c.peerDeviation +
      0.20 * c.operationalAnomaly;
    const expectedSri = Math.max(5, Math.min(98, Math.round(100 - expectedDeduction)));
    assert.equal(ent.sri, expectedSri);
  }
});

test("findings expose provenance, version, confidence and evidence count", () => {
  const result = assess(DEMO_DATASET);
  for (const f of result.findings) {
    assert.equal(f.detectorVersion, "v1.2");
    assert.equal(f.ruleUpdated, "2026-08-12");
    assert.ok(f.confidence >= 0.70 && f.confidence <= 1.0);
    assert.ok(f.evidenceCount >= 0);
  }
});

test("local anomaly detection runs deterministic statistical ML models", async () => {
  const { runLocalAnomalyDetection, calculateQuartiles, calculateNoteEntropy } = await import("./anomaly.ts");
  
  // Test Quartiles & IQR
  const q = calculateQuartiles([10, 12, 14, 15, 16, 18, 20, 22, 100]);
  assert.equal(q.median, 16);
  assert.ok(q.iqr > 0);
  assert.ok(q.upperFence < 100);

  // Test Shannon Entropy
  const highEntropy = calculateNoteEntropy("Investigated host isolation on 192.168.1.42 with memory dump inspection");
  const lowEntropy = calculateNoteEntropy("False positive. False positive. False positive.");
  assert.ok(highEntropy > 3.0, `Expected high entropy, got ${highEntropy}`);
  assert.ok(lowEntropy < 2.5, `Expected low entropy, got ${lowEntropy}`);

  // Test full local anomaly run
  const report = runLocalAnomalyDetection(DEMO_DATASET);
  assert.ok(report.totalAnomaliesDetected > 0);
  assert.ok(report.allAnomalies.length > 0);

  for (const a of report.allAnomalies) {
    assert.ok(["triage_velocity", "note_entropy", "diurnal_collapse", "multivariate_outlier"].includes(a.anomalyType));
    assert.ok(a.formula.length > 0);
    assert.ok(a.threshold.length > 0);
    assert.ok(a.observedValue.length > 0);
    assert.ok(a.confidencePct >= 80);
  }
});

test("ed25519 cryptographic signing generates verifiable digital signatures", async () => {
  const {
    generateEd25519KeyPair,
    signWithEd25519,
    verifyEd25519Signature,
    formatSignedCertificate,
  } = await import("./signer.ts");

  const keyPair = await generateEd25519KeyPair();
  assert.ok(keyPair.publicKey);
  assert.ok(keyPair.privateKey);
  assert.ok(keyPair.publicKeyHex.length === 64); // 32 bytes raw public key = 64 hex chars

  const testHash = "d2b802b52adff33615e4671ca0a0c721d32df3d495e7d4266718f30f3712252";
  const sigBlock = await signWithEd25519(keyPair.privateKey, testHash, "NCIIPC-EX-4092");
  sigBlock.publicKeyHex = keyPair.publicKeyHex;

  assert.equal(sigBlock.algorithm, "Ed25519");
  assert.equal(sigBlock.standard, "RFC 8032");
  assert.equal(sigBlock.signatureHex.length, 128); // 64 bytes Ed25519 sig = 128 hex chars

  // Verify valid signature
  const valid = await verifyEd25519Signature(
    sigBlock.publicKeyHex,
    sigBlock.signatureHex,
    testHash
  );
  assert.equal(valid, true);

  // Reject tampered document
  const invalidDoc = await verifyEd25519Signature(
    sigBlock.publicKeyHex,
    sigBlock.signatureHex,
    "tampered-document-hash"
  );
  assert.equal(invalidDoc, false);

  // Format certificate check
  const certText = formatSignedCertificate(sigBlock);
  assert.ok(certText.includes("NCIIPC SAT-SA ED25519 SUPERVISORY ATTESTATION CERTIFICATE"));
  assert.ok(certText.includes(sigBlock.signatureHex));
});

