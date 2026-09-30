# SAT-SA: Supervisory Analytics Tool for SOC Assessment
**Submission for SIH26157 (NCIIPC, NTRO, MIC)**

## Overview
SAT-SA is an air-gapped, zero-dependency supervisory analytics workbench designed exclusively for the National Critical Information Infrastructure Protection Centre (NCIIPC). It transitions SOC assessment from manual sampling to deterministic, mathematical evaluation at scale.

In strict compliance with NCIIPC requirements, SAT-SA is **not** an operational SIEM or real-time monitoring tool. It is an offline supervisory capability that detects operational weaknesses—specifically **Execution Gaps** and **Negative Space**—from periodic structured data submissions.

---

## 🚀 Quick Start Guide for Judges

To ensure a flawless evaluation experience, please follow these exact steps to run the application offline and test its capabilities.

### Prerequisites
* **Node.js** (v20 or higher recommended)
* A modern web browser (Chrome/Edge/Firefox)

### Step 1: Install Dependencies
Open your terminal, navigate to this exact folder (`SAT-SA-Submission`), and run:
```bash
npm install
```

### Step 2: Start the Application
Once dependencies are installed, start the local development server:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:8080`**.

### Step 3: Run the Pre-Configured Tests
We have provided 5 highly specific dataset scenarios located in the `test-datasets/` folder. These files demonstrate the deterministic risk engine catching execution gaps and negative space.

1. In the SAT-SA application, click **"Upload CSV Dataset"**.
2. Navigate to the `test-datasets/` folder in this repository.
3. Upload the files one by one to observe the analytics:
   * **`1_Execution_Gaps.csv`**: Demonstrates the engine catching critical alerts closed suspiciously fast with repetitive template notes.
   * **`2_Negative_Space.csv`**: Demonstrates the engine flagging an absence of expected critical infrastructure telemetry.
   * **`3_Metric_Theatre.csv`**: Shows the detection of SLA manipulation (alerts closed at the exact same minute before SLA cliffs).
   * **`4_Healthy_Baseline.csv`**: Establishes a control baseline of a high-functioning SOC.
   * **`5_Multi_Entity_Assessment.csv`**: A combined dataset demonstrating cross-entity peer comparison and the Supervisory Risk Index (SRI) ranking.

---

## Core Capabilities (Mapping to Problem Statement)

1. **Air-Gapped & Deterministic (No AI/Cloud Dependency)**
   * Operates 100% offline. Zero external APIs, zero SaaS, zero LLMs. 
   * Uses a deterministic, transparent rules engine (16 Core Detectors) to find gaps, eliminating the "black-box" explainability issues of ML models.
   
2. **Execution Gaps & Negative Space Detection**
   * Automatically flags when expected operational behavior is missing.
   * Generates an entity-level **Supervisory Risk Index (SRI)** based on formulaic weighting of Execution Gaps, Negative Space, Peer Deviation, and Operational Anomalies.

3. **Cryptographic Auditability & Non-Repudiation**
   * **Ingest Hash Anchoring:** All uploaded datasets are fingerprinted (SHA-256).
   * **Ed25519 Examiner Signatures:** Final supervisory reports are cryptographically signed offline by the examiner, guaranteeing that the findings are tamper-proof and mathematically auditable in the *Evidence Vault*.

4. **Human-in-the-Loop Review Queue**
   * Designed to *support* examiners, not replace them. The **Review Queue** explicitly requires human judgment to mark automated findings as "Corroborates", "Needs more evidence", or "Does not corroborate".
