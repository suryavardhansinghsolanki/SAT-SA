# SAT-SA Architecture Document
**Maximum 2 Pages | SIH26157**

## 1. System Overview
The Supervisory Analytics Tool for SOC Assessment (SAT-SA) is designed as a standalone, zero-dependency, air-gapped application. It ingests periodic SOC metadata (CSV/JSON), applies deterministic risk modeling to identify Execution Gaps and Negative Space, and outputs cryptographic attestations of examiner reviews.

## 2. Design Constraints & Philosophy
* **Offline First:** Operates strictly within NCIIPC-controlled environments.
* **Deterministic vs Probabilistic:** Rejects LLMs/opaque ML in favor of a versioned, transparent rules engine to guarantee 100% explainability and auditability.
* **Stateless Portability:** Relies on in-memory and local browser storage anchored by cryptographic state hashes, avoiding complex database deployments (Postgres/Mongo) that complicate air-gapped installations.

## 3. Core Components

### A. Data Ingestion & Unification Layer
Accepts structured periodic submissions (alert metadata, case records, asset inventories). Data is parsed locally, schema-validated, and instantly hashed (SHA-256) to create a tamper-proof ingestion receipt.

### B. The Deterministic Risk Engine
A purely functional pipeline (16 distinct mathematical detectors) categorized into:
* **Execution Gaps (EG):** E.g., `Time-to-close < Expected Baseline` AND `Severity == Critical`.
* **Negative Space (NS):** E.g., `Expected Telemetry == NULL` where `Asset == High Value`.
* **Peer Deviation (PD):** Z-score deviation of alert volumes against similar Sector+Size cohorts.

### C. Supervisory Risk Index (SRI) Calculator
Generates the entity-level score used for prioritization:
`SRI = 100 - (0.35 * EG + 0.25 * NS + 0.20 * PD + 0.20 * Anomalies)`

### D. Cryptographic Non-Repudiation Vault
To preserve the quality of supervisory assurance:
1. **Audit Chain:** Every human-in-the-loop review decision is appended to a block. Each block hashes the examiner ID, timestamp, decision, and the previous block's hash.
2. **Ed25519 PKI:** The final assessment state is signed via a locally generated asymmetric keypair (RFC 8032), ensuring the exported JSON report cannot be altered before filing.

## 4. Hardware & Infrastructure Requirements
* **Compute:** 2 vCPU, 4GB RAM (Node.js runtime).
* **Storage:** < 50MB for the application bundle. Dataset storage dependent on ingestion size.
* **Network:** Air-gapped (0.0.0.0 bind for local network access only).
* **Dependencies:** None. Packaged as a fully self-contained Node/React artifact.
