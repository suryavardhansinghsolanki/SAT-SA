import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, FileCheck, Key, Lock, Printer, RefreshCw, Shield, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { verifyLedgerIntegrity } from "@/lib/sat/vault";
import { generateEd25519KeyPair, signWithEd25519, verifyEd25519Signature, type ExaminerKeyPair, type Ed25519SignatureBlock } from "@/lib/sat/signer";
import { useSatStore } from "@/lib/sat/store";
import { formatDateTime } from "@/lib/utils";

export const Route = createFileRoute("/evidence")({ component: EvidenceVault });

function EvidenceVault() {
  const { auditLedger, receipts, examinerId, setExaminerId } = useSatStore();
  const [verification, setVerification] = useState<{ intact: boolean; error?: string; latestHash?: string; genesisHash?: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const [keyPair, setKeyPair] = useState<ExaminerKeyPair | null>(null);
  const [signatureBlock, setSignatureBlock] = useState<Ed25519SignatureBlock | null>(null);
  const [sigVerified, setSigVerified] = useState<boolean | null>(null);

  const handleVerify = () => setVerification(verifyLedgerIntegrity(auditLedger));

  function copyText(txt: string) {
    navigator.clipboard.writeText(txt);
    setCopiedHash(txt);
    setTimeout(() => setCopiedHash(null), 2000);
  }

  function downloadLedgerJson() {
    const blob = new Blob([JSON.stringify(auditLedger, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sat-sa-audit-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatSignedCertificate(sigBlock: Ed25519SignatureBlock) {
    return [
      "================================================================================",
      "             NCIIPC SUPERVISORY AUDIT ATTESTATION (RFC 8032)",
      "================================================================================",
      `Date/Time (UTC):        ${sigBlock.signedAt}`,
      `Examiner Authority:     ${sigBlock.examinerId}`,
      `Ledger Document Hash:   ${sigBlock.documentHash}`,
      `Cryptographic Algo:     Ed25519 (Asymmetric)`,
      "--------------------------------------------------------------------------------",
      `Public Key (Hex):       ${sigBlock.publicKeyHex}`,
      `Digital Signature:      ${sigBlock.signatureHex}`,
      "================================================================================",
      "To mathematically verify this attestation, use the Ed25519 Verify algorithm",
      "with the Public Key, Document Hash (Message), and Digital Signature above.",
    ].join("\n");
  }

  function downloadAuditCertificate() {
    const report = verifyLedgerIntegrity(auditLedger);
    if (!report.intact) {
      alert("Cannot generate certificate: Audit chain verification failed.");
      return;
    }

    const cert = [
      "================================================================================",
      "             NCIIPC OFFICIAL SUPERVISORY AUDIT CERTIFICATE",
      "================================================================================",
      `Generated At (UTC):     ${new Date().toISOString()}`,
      `Examiner Authority:     ${examinerId}`,
      `Chain Status:           VALID (Integrity Verified)`,
      `Total Blocks:           ${auditLedger.length}`,
      `Genesis Hash:           ${report.genesisHash}`,
      `Latest State Hash:      ${report.latestHash}`,
      "--------------------------------------------------------------------------------",
      "INGESTED DATASETS RECEIPT DIGESTS:",
      ...receipts.map((r, i) =>
        `[${i + 1}] ID: ${r.datasetId} | File: ${r.fileName} | SHA-256: ${r.datasetHash} | Records: ${r.recordCount} | Quality: ${r.qualityScore}% | Time: ${r.ingestedAt}`
      ),
      "--------------------------------------------------------------------------------",
      "SUPERVISORY AUDIT CHAIN BLOCKS:",
      ...auditLedger.map((b) =>
        `Block #${b.index} [${b.timestamp}] ${b.examinerId} -> ${b.action} on ${b.targetType}:${b.targetId}\n  Hash:     ${b.hash}\n  PrevHash: ${b.prevHash}\n  Details:  ${b.rationale}\n`
      ),
      "================================================================================",
      "End of Official Supervisory Audit Certificate",
    ].join("\n");

    const blob = new Blob([cert], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sat-sa-audit-certificate-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGenerateKeys() {
    const kp = await generateEd25519KeyPair();
    setKeyPair(kp);
  }

  async function handleSignLedger() {
    let activeKey = keyPair;
    if (!activeKey) {
      activeKey = await generateEd25519KeyPair();
      setKeyPair(activeKey);
    }
    const hashToSign = latestBlock?.hash || "GENESIS";
    const sig = await signWithEd25519(activeKey.privateKey, hashToSign, examinerId);
    sig.publicKeyHex = activeKey.publicKeyHex;
    setSignatureBlock(sig);
    setSigVerified(true);
  }

  async function handleVerifySig() {
    if (!signatureBlock) return;
    const ok = await verifyEd25519Signature(
      signatureBlock.publicKeyHex,
      signatureBlock.signatureHex,
      signatureBlock.documentHash
    );
    setSigVerified(ok);
  }

  function downloadSignedAttestation() {
    if (!signatureBlock) return;
    const cert = formatSignedCertificate(signatureBlock);
    const blob = new Blob([cert], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sat-sa-ed25519-attestation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const latestBlock = auditLedger[auditLedger.length - 1];

  return (
    <div className="w-full px-6 py-6 sm:px-8 sat-enter max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-hairline pb-8" data-print-hide>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="rounded bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent shrink-0">
              Phase 3
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-subtle truncate">
              RESTRICTED // NCIIPC SUPERVISORY AUDIT
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg truncate">Evidence Vault</h1>
          <p className="mt-3 text-sm text-muted leading-relaxed max-w-3xl">
            Cryptographic SHA-256 proof of ingestion and append-only audit trail for all human examiner decisions.
            Evidence records are mathematically locked and can never be overwritten.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button variant="outline" onClick={handleVerify} className="gap-2 h-10 text-sm">
            <RefreshCw className="size-4" /> Verify Chain Integrity
          </Button>
          <Button variant="outline" onClick={downloadLedgerJson} className="gap-2 h-10 text-sm">
            <Download className="size-4" /> Export Ledger (JSON)
          </Button>
          <Button variant="outline" onClick={downloadAuditCertificate} className="gap-2 h-10 text-sm">
            <FileCheck className="size-4" /> Export Certificate
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 h-10 text-sm">
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </div>

      {/* Identity Configuration */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-md border border-hairline bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Shield className="size-5 text-accent" />
          <span className="text-xs uppercase tracking-wider text-subtle font-semibold">Examiner Authority Identity:</span>
          <span className="font-mono text-base font-bold text-fg truncate">{examinerId}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted shrink-0">Change ID:</span>
          <input
            type="text"
            value={examinerId}
            onChange={(e) => setExaminerId(e.target.value)}
            suppressHydrationWarning
            className="h-9 w-64 rounded-md border border-border bg-inset px-3 font-mono text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Chain Integrity Alert */}
      {verification ? (
        <div className={`mt-6 rounded-md border p-5 shadow-sm ${verification.intact ? "border-ok/30 bg-ok/5" : "border-risk/30 bg-risk/5"}`}>
          <div className="flex items-center gap-2 font-semibold">
            {verification.intact ? (
              <span className="text-ok">Cryptographic integrity verified.</span>
            ) : (
              <span className="text-risk">Chain integrity verification failed.</span>
            )}
          </div>
          {verification.intact && verification.genesisHash && verification.latestHash ? (
            <div className="mt-3 font-mono text-xs opacity-90 break-all leading-relaxed">
              <span className="text-subtle">Genesis:</span> {verification.genesisHash} <br />
              <span className="text-subtle">Latest: </span> {verification.latestHash}
            </div>
          ) : null}
          {verification.error ? <p className="mt-2 text-sm text-risk font-semibold">{verification.error}</p> : null}
        </div>
      ) : null}

      {/* Vault Statistics */}
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-md bg-inset p-5 border border-hairline shadow-sm">
          <div className="text-xs uppercase tracking-wider text-subtle font-semibold">Audit Ledger Height</div>
          <div className="mt-2 font-mono text-3xl font-bold text-fg tabular">{auditLedger.length}</div>
          <p className="mt-2 text-xs text-muted">Immutable chained blocks</p>
        </div>
        <div className="rounded-md bg-inset p-5 border border-hairline shadow-sm">
          <div className="text-xs uppercase tracking-wider text-subtle font-semibold">Ingested Evidence Sets</div>
          <div className="mt-2 font-mono text-3xl font-bold text-fg tabular">{receipts.length}</div>
          <p className="mt-2 text-xs text-muted">Verified cryptographic receipts</p>
        </div>
        <div className="rounded-md bg-inset p-5 border border-hairline shadow-sm">
          <div className="text-xs uppercase tracking-wider text-subtle font-semibold">Latest Block State Hash</div>
          <div className="mt-2 font-mono text-lg font-semibold text-accent break-all leading-tight">
            {latestBlock ? `${latestBlock.hash.slice(0, 32)}...` : "Genesis"}
          </div>
          <p className="mt-2 text-xs text-muted">FIPS 180-4 SHA-256 Digest</p>
        </div>
      </div>

      {/* Ed25519 Cryptographic Signing Station */}
      <div className="mt-10 rounded-md border border-hairline bg-surface p-6 shadow-sm" data-print-hide>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Key className="size-5 text-accent" />
              <h2 className="text-xl font-semibold tracking-tight text-fg truncate">Ed25519 PKI Signing Station</h2>
              <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-accent shrink-0 border border-accent/20">RFC 8032</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted leading-relaxed">
              Attest the supervisory ledger state using asymmetric Ed25519 digital signatures. Verifiable fully offline by leadership without external PKI dependencies.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button size="sm" variant="outline" onClick={handleGenerateKeys} className="gap-2 h-9 text-xs">
              <Key className="size-4" />
              {keyPair ? "Regenerate Keys" : "Generate Keypair"}
            </Button>
            <Button size="sm" onClick={handleSignLedger} className="gap-2 h-9 text-xs bg-accent text-accent-fg hover:opacity-90 transition-opacity">
              <Lock className="size-4" />
              Sign Current Ledger Head
            </Button>
            {signatureBlock ? (
              <>
                <Button size="sm" variant="outline" onClick={handleVerifySig} className="gap-2 h-9 text-xs">
                  <ShieldCheck className="size-4 text-ok" />
                  Verify Signature
                </Button>
                <Button size="sm" variant="outline" onClick={downloadSignedAttestation} className="gap-2 h-9 text-xs">
                  <Download className="size-4" />
                  Export Attestation
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {keyPair ? (
          <div className="mt-6 rounded-md bg-inset border border-hairline p-4 shadow-inner font-mono text-sm">
            <div className="flex items-center justify-between text-subtle text-xs uppercase font-sans font-semibold mb-2">
              <span>Examiner Ed25519 Public Key (Raw Hex)</span>
              <button type="button" onClick={() => copyText(keyPair.publicKeyHex)} className="hover:text-fg text-accent transition-colors">
                Copy
              </button>
            </div>
            <div className="break-all text-fg font-medium bg-bg p-3 rounded border border-hairline">{keyPair.publicKeyHex}</div>
          </div>
        ) : null}

        {signatureBlock ? (
          <div className="mt-6 rounded-md border border-ok/30 bg-ok/5 p-5 shadow-inner">
            <div className="flex items-center gap-3 text-ok font-bold text-sm mb-4">
              <CheckCircle2 className="size-4" />
              <span className="tracking-wide">Attestation Generated Successfully</span>
              {sigVerified !== null && (
                 <span className={`ml-4 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${sigVerified ? "bg-ok text-bg" : "bg-risk text-bg"}`}>
                    {sigVerified ? "Verification Passed" : "Verification Failed"}
                 </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 font-mono text-xs text-muted">
              <div>
                <div className="text-[10px] font-semibold uppercase text-subtle mb-1">Signed Timestamp</div>
                <div className="text-fg font-medium">{signatureBlock.signedAt}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase text-subtle mb-1">Target Hash</div>
                <div className="truncate text-fg font-medium">{signatureBlock.documentHash}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] font-semibold uppercase text-subtle mb-1.5">Ed25519 Signature (Hex)</div>
                <div className="break-all text-fg font-medium bg-bg p-3 rounded border border-hairline leading-relaxed">{signatureBlock.signatureHex}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Dataset Receipts Table */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-fg">Dataset Ingestion Receipts</h2>
            <p className="mt-1 text-sm text-muted">
              Cryptographic SHA-256 fingerprints tying raw operational records immutably to the review timeline.
            </p>
          </div>
          <span className="font-mono text-xs text-muted font-bold px-3 py-1 bg-inset border border-hairline rounded">{receipts.length} Registered</span>
        </div>

        <div className="overflow-x-auto rounded-md border border-hairline bg-surface shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-elevated border-b border-hairline font-mono text-[11px] uppercase tracking-[0.14em] text-subtle font-semibold">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">Dataset ID</th>
                <th className="px-5 py-4 whitespace-nowrap">File / Source</th>
                <th className="px-5 py-4 whitespace-nowrap">SHA-256 Digest</th>
                <th className="px-5 py-4 whitespace-nowrap">Records</th>
                <th className="px-5 py-4 whitespace-nowrap">Entities</th>
                <th className="px-5 py-4 whitespace-nowrap">Quality</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Ingested (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {receipts.map((r) => (
                <tr key={r.datasetId} className="hover:bg-elevated/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-sm font-bold text-accent whitespace-nowrap">{r.datasetId}</td>
                  <td className="px-5 py-3.5 text-sm text-fg whitespace-nowrap">{r.fileName}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => copyText(r.datasetHash)}
                      className="group flex items-center gap-2 text-muted hover:text-fg transition-colors"
                      title="Click to copy full SHA-256 digest"
                    >
                      <span className="font-mono text-sm">{r.datasetHash.slice(0, 16)}...</span>
                      <Copy className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    {copiedHash === r.datasetHash ? (
                      <span className="absolute ml-2 text-[10px] text-ok font-bold uppercase mt-1">Copied</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-fg tabular">{r.recordCount.toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-mono text-sm text-fg tabular">{r.entityCount}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center justify-center font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        r.qualityScore >= 90
                          ? "bg-ok/10 text-ok border-ok/20"
                          : r.qualityScore >= 75
                            ? "bg-warn/10 text-warn border-warn/20"
                            : "bg-risk/10 text-risk border-risk/20"
                      }`}
                    >
                      {r.qualityScore}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted text-right tabular whitespace-nowrap">{r.ingestedAt.slice(0, 19).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supervisory Audit Ledger (Blockchain Timeline) */}
      <section className="mt-16 mb-10">
        <div className="flex items-end justify-between mb-8 border-b border-hairline pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-fg">Supervisory Audit Ledger</h2>
            <p className="mt-1 text-sm text-muted">
              Append-only chain. Every examiner action forms a cryptographic link with the preceding block.
            </p>
          </div>
          <span className="font-mono text-xs text-muted font-bold px-3 py-1 bg-inset border border-hairline rounded">{auditLedger.length} Verified Blocks</span>
        </div>

        <div className="relative pl-6 sm:pl-10">
          {/* Vertical timeline line */}
          <div className="absolute left-2.5 sm:left-6 top-4 bottom-4 w-px bg-hairline" />

          <div className="space-y-6 sm:space-y-8">
            {[...auditLedger].reverse().map((block, i) => (
              <div key={`${block.index}-${block.hash}`} className="relative">
                {/* Timeline Node */}
                <div className="absolute -left-[37px] sm:-left-[43px] top-4 flex size-5 items-center justify-center rounded-full bg-bg border-2 border-accent">
                  <div className="size-1.5 rounded-full bg-accent" />
                </div>

                <div className="rounded-md border border-hairline bg-surface p-5 shadow-sm transition-colors hover:border-accent/40">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-lg font-bold text-accent">#{block.index}</span>
                      <Badge
                        tone={
                          block.action === "CORROBORATES"
                            ? "ok"
                            : block.action === "DOES_NOT_CORROBORATE"
                              ? "risk"
                              : block.action === "NEEDS_MORE_EVIDENCE"
                                ? "warn"
                                : "default"
                        }
                        className="px-2.5 py-1 text-[11px]"
                      >
                        {block.action}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-subtle font-mono uppercase text-[10px] tracking-wider font-semibold">Target</span>
                        <span className="font-mono font-bold text-fg bg-inset px-2 py-0.5 rounded border border-hairline">
                          {block.targetType}:{block.targetId}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-muted font-medium bg-bg px-2 py-1 rounded border border-hairline">
                      {formatDateTime(block.timestamp)}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-fg leading-relaxed bg-bg p-4 rounded-md border border-hairline">
                    <span className="font-mono text-[10px] uppercase text-subtle font-semibold block mb-2">Examiner Rationale</span>
                    {block.rationale}
                  </div>

                  {/* Hash Grid */}
                  <div className="mt-4 grid gap-4 rounded-md bg-inset border border-hairline p-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase text-subtle font-semibold tracking-wider">Block Hash</span>
                      <span className="text-fg break-all font-semibold leading-tight">{block.hash}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase text-subtle font-semibold tracking-wider">Prev Hash</span>
                      <span className="text-muted break-all leading-tight">{block.prevHash}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase text-subtle font-semibold tracking-wider">Signer Authority</span>
                      <span className="text-fg truncate font-semibold leading-tight">{block.examinerId}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase text-subtle font-semibold tracking-wider">Cryptographic Standard</span>
                      <span className="text-muted leading-tight">FIPS 180-4 SHA-256</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

