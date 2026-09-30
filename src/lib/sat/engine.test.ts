import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_DATASET, EXPERT_EXPECTATIONS } from "./corpus.ts";
import { assess, detectorCatalog, metricTheatreScore } from "./engine.ts";

test("demo corpus is sized for multi-entity assessment", () => {
  assert.equal(DEMO_DATASET.entities.length, 12);
  assert.ok(DEMO_DATASET.alerts.length > 1500);
  assert.ok(DEMO_DATASET.cases.length > 400);
});

test("gold-set recall recovers expert-expected supervisory signals", () => {
  const result = assess(DEMO_DATASET);
  const recall = result.expectations.hit / result.expectations.total;
  assert.equal(result.expectations.total, EXPERT_EXPECTATIONS.length);
  assert.ok(
    recall >= 0.85,
    `recall ${recall.toFixed(2)} (${result.expectations.hit}/${result.expectations.total}); missed ${result.expectations.missed.map((m) => `${m.detectorId}@${m.entityId}`).join(", ")}`,
  );
});

test("detector catalogue is complete and stable", () => {
  const ids = detectorCatalog().map((d) => d.id);
  for (const id of ["EG-01", "EG-07", "NS-01", "NS-06", "AN-03"]) {
    assert.ok(ids.includes(id), `missing ${id}`);
  }
  assert.equal(new Set(ids).size, ids.length);
});

test("Northern Grid is flagged for rapid P1 closure and OT negative space", () => {
  const result = assess(DEMO_DATASET);
  const ids = result.findings.filter((f) => f.entityId === "CSE-PWR-001").map((f) => f.detectorId);
  assert.ok(ids.includes("EG-01"));
  assert.ok(ids.includes("NS-02") || ids.includes("NS-04"));
});

test("every entity has an SRI band and a metric-theatre score", () => {
  const result = assess(DEMO_DATASET);
  assert.equal(result.entities.length, 12);
  for (const e of result.entities) {
    assert.ok(e.sri >= 0 && e.sri <= 100);
    assert.ok(["immediate", "concern", "watch", "tolerance", "exemplar"].includes(e.band));
    assert.ok(e.metricTheatre >= 0 && e.metricTheatre <= 100);
    assert.equal(e.capabilities.length, 8);
  }
  const sample = result.entities[0]!;
  assert.equal(metricTheatreScore(sample.stats), sample.metricTheatre);
});

test("findings always carry formula, threshold and evidence", () => {
  const result = assess(DEMO_DATASET);
  assert.ok(result.findings.length > 10);
  for (const f of result.findings) {
    assert.ok(f.formula.length > 8);
    assert.ok(f.threshold.length > 8);
    assert.ok(f.rationale.length >= 2);
    assert.ok(f.evidence.length >= 1);
    assert.ok(f.recommendedAction.length > 8);
  }
});