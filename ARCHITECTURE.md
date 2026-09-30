# SAT-SA — Supervisory Analytics Tool for SOC Assessment
**Architecture Document · SIH26157 · NTRO / NCIIPC · Tagline: audit the evidence, not the metrics**

## 1. Purpose and placement
SAT-SA sits **after** the Security Operations Centres of Critical Sector Entities (CSEs). CSEs submit periodic structured extracts. NCIIPC examiners load a cycle, run a local assessment and use the ranked output to decide where manual review is worth spending. It never receives packets or live feeds and never sends detections back. **Out of scope by construction:** SOC replacement, real-time monitoring, SIEM, centralised SOC, continuous collection, national monitoring. The tool **advises; the examiner decides.**

## 2. Logical architecture
```text
[Periodic CSE files] -> [Ingest and normalise] -> [Feature rates] -> [Detector pack (EG/NS/AN)] -> [Capability scores + SRI] -> [Information-gain sampler] -> [Examiner UI + verdicts]
```
*Integrity layer: SHA-256 receipts · hash-chained verdict log · Ed25519-signed report | NCIIPC network only, no outbound calls*

Analytics are a pure function of the submitted dataset (TypeScript engine, no side effects). The prototype is a TanStack Start / React web application whose analysis runs in the examiner's browser or on an internal application server; no stage needs a network path outside NCIIPC.

## 3. Data requirements
| Input (periodic) | Key fields used | Purpose |
| :--- | :--- | :--- |
| **Entity register** | sector, region, criticality, declared maturity, SOC model, declared KPIs | Peer cohort; claim-versus-evidence |
| **Asset inventory** | zone, criticality, telemetry-expected flag | Negative space (silent or blind assets) |
| **Alert metadata** | opened/closed time, severity, category, source, disposition, SLA, escalated, analyst, note fingerprint | Execution gaps, tempo, anomalies |
| **Case records** | notes, actions, root-cause flag, escalation level and acceptance | Investigation depth, escalation fit |

*Not requested:* payloads, raw logs, packet captures, customer PII. Ingest accepts CSV or JSON and maps recognised columns (aliases accepted); it requires a header plus at least five alert rows (enforced by deterministic schema validation).

## 4. Analytics methodology (deterministic, explainable)
| Family | Detectors (16) | Question answered |
| :--- | :--- | :--- |
| **Execution gaps (7)** | EG-01 rapid high-severity closure · EG-02 escalation bypass · EG-03 template investigations · EG-04 SLA-cliff gaming · EG-05 repeat alert without remediation · EG-06 shift-end closure dump · EG-07 acknowledged without investigation | Is the documented work real? |
| **Negative space (6)** | NS-01 silent critical assets · NS-02 missing alert taxonomy · NS-03 peer volume collapse · NS-04 critical-environment blind spot · NS-05 weekend monitoring collapse · NS-06 detection-source monoculture | What evidence should exist but does not? |
| **Anomalies (3)** | AN-01 disposition skew · AN-02 missing investigation trail · AN-03 analyst bottleneck | Which patterns are outliers? |

**Example (EG-01).** Flag when the share of closed critical/high alerts that were closed in under 15 minutes without escalation is at least 15% and at least 4 alerts. Severity rises at 22% and 35%; the peer median is shown beside the observed rate.
`rate = count(severity ∈ {critical, high} ∧ time-to-close < 15 min ∧ not escalated) / count(closed critical/high)`

*   **Supervisory Risk Index (SRI).** Eight capabilities (detection, investigation, escalation, response, secops, governance, discipline, resilience) each start from observable rates and are reduced by attached findings (penalty = severity weight × 22 × (0.7 + 0.3 × information gain)). **SRI is the unweighted mean of the eight scores.** Bands: Immediate <40 · Concern <55 · Watch <70 · Tolerance <85 · Exemplar.
*   **Metric-theatre index (0–100)** combines SLA-cliff closes, shift-end dumps, template notes and sub-15-minute P1 handling, and is read against the entity's declared SLA KPI. **Peer comparison** uses sector/peer medians. **Tempo heatmaps (7×24)** expose blackouts and dumps.
*   **Review sampling.** Packs are ranked by information gain × residual entity risk × severity and mix extreme and typical evidence. Negative-space packs deliberately contain no alerts: the examiner asks what should have existed.

## 5. Explainability, auditability and integrity
*   **Every finding carries** its formula, threshold, observed value, peer context, rationale lines, evidence rows and a recommended action; a unit test fails the build if any finding lacks them. Detector IDs are stable across cycles.
*   **Reproducible:** the same dataset and rule set always produce identical findings (verified by re-run). Examiners record a stance per review item (corroborates / does not / needs more evidence).
*   **Integrity layer (built into the demonstration).** SHA-256 receipt per submission; examiner verdicts appended to a hash-chained log; final report signed with Ed25519 (RFC 8032). The private key is held securely, **never exposed to the application state**. This provides cryptographic non-repudiation and tamper-evidence after sealing.

## 6. Offline AI specification (as required by the brief)
| Item | SAT-SA answer |
| :--- | :--- |
| **Model architecture** | None learned. Deterministic rules, robust peer statistics (medians, ratios, residuals) and a scoring index. No LLM, no neural network, no hosted API. |
| **Hardware** | No GPU. Analysis is CPU-only; see measured sizing in section 7. |
| **Offline training / inference** | No training step. Thresholds derive from the brief's use cases and are checked on a labelled synthetic set; inference is a batch run per submission cycle. |
| **Update mechanism** | Detectors and thresholds ship inside a versioned release bundle. Applied manually. No automatic updates. |
| **Explainability / auditability**| Formula, threshold, observed, peer context and evidence rows on every finding; deterministic re-run; verdict log (hash-chained). |

## 7. Infrastructure and measured performance
| Dataset (synthetic, cloned) | Entities | Alerts | Full assessment | Peak process memory |
| :--- | :--- | :--- | :--- | :--- |
| Demonstration corpus | 12 | 2,238 | 23 ms | ~90 MB |
| Scaled ×20 | 240 | 44,760 | 1.8 s | ~170 MB |
| Scaled ×60 | 720 | 134,280 | 27 s | ~230 MB |

*Measured on the prototype in a Linux sandbox. Runtime grows slightly faster than linearly at high entity counts; this is a batch tool, so seconds are acceptable.*
*   **Sizing:** examiner workstation with a current Chromium or Firefox and 8 GB RAM. Optional internal application server of 2 vCPU and 4 GB RAM (CPU only, no GPU).
*   **Deployment:** built on a connected build host, transferred as a signed release archive, installed inside the air-gapped network. Serve on an internal interface (`127.0.0.1`). There are **no runtime calls** to cloud, SaaS or hosted AI.

## 8. Traceability to the brief's performance criteria
| Criterion | Where addressed |
| :--- | :--- |
| **Ability to support supervisory assessment** | Sections 1 & 4: entity SRI with peer comparison, ranked review queue, examiner stance |
| **Detection of execution gaps** | Section 4: EG-01 to EG-07 plus the metric-theatre index |
| **Detection of negative space** | Section 4: NS-01 to NS-06, sector expectation rules, no-alert review packs |
| **Explainability and auditability** | Section 5: formula, threshold, evidence on every finding; deterministic re-run; integrity layer |
| **Scalability and performance** | Section 7: measured runtimes from 12 to 720 entities; batch design |
| **Innovation and additional insights** | Claim-versus-evidence dossier, 7×24 tempo heatmaps, information-gain sampling |

## 9. Validation methodology (against expert manual review)
*   **Prototype gate.** A 12-entity synthetic corpus encodes 21 expert-expected findings drawn from the brief's use cases. The engine recovers **21 of 21**, enforced by a regression test (threshold 85%). Four control entities with no injected weaknesses received 8 findings in total and none reached Concern or Immediate. *Limit:* the corpus and gold set were authored together, so this proves the pipeline recovers known weaknesses; it is not evidence of field accuracy.
*   **Production plan.** Replace the seed with a labelled archive of NCIIPC's prior examination conclusions, blind to the tool. Report per-detector precision and recall, precision at top-k, examiner agreement, and the headline result: **weaknesses confirmed per examiner-hour compared with the current random sampling.**
*   **Known limitations.** Heuristic thresholds need calibration on real data; sector expectations are curated rules; ingest does not yet reject payload-shaped columns automatically.
