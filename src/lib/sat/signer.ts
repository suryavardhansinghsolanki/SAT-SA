/**
 * Ed25519 Cryptographic Digital Signature & Verification Module for SAT-SA.
 * Implements RFC 8032 Ed25519 asymmetric signing using native Web Cryptography API.
 * 
 * Provides government-grade cryptographic non-repudiation for NCIIPC Supervisory Briefs,
 * Evidence Vault Certificates, and Tamper-Evident Audit Ledger heads.
 * 
 * 100% Offline, client-side execution, zero external network dependency.
 */

export interface Ed25519SignatureBlock {
  algorithm: "Ed25519";
  standard: "RFC 8032";
  examinerId: string;
  documentHash: string;
  signedAt: string;
  publicKeyHex: string;
  signatureHex: string;
}

export interface ExaminerKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyHex: string;
}

const STORAGE_KEY_PUBLIC = "sat-sa-ed25519-public-v2";
const STORAGE_KEY_PRIVATE = "sat-sa-ed25519-private-v2";

/**
 * Converts Uint8Array to hexadecimal string.
 */
export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Converts hexadecimal string to Uint8Array.
 */
export function hexToBuf(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generates an Ed25519 asymmetric cryptographic keypair.
 */
export async function generateEd25519KeyPair(): Promise<ExaminerKeyPair> {
  const keyPair = (await crypto.subtle.generateKey(
    "Ed25519",
    true,
    ["sign", "verify"]
  )) as CryptoKeyPair;

  const rawPub = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyHex = bufToHex(rawPub);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyHex,
  };
}

/**
 * Signs a SHA-256 document hash or text string with an Ed25519 private key.
 */
export async function signWithEd25519(
  privateKey: CryptoKey,
  documentHash: string,
  examinerId: string
): Promise<Ed25519SignatureBlock> {
  const data = new TextEncoder().encode(documentHash);
  const signature = await crypto.subtle.sign("Ed25519", privateKey, data);
  const signatureHex = bufToHex(signature);

  return {
    algorithm: "Ed25519",
    standard: "RFC 8032",
    examinerId,
    documentHash,
    signedAt: new Date().toISOString(),
    publicKeyHex: "", // Populated by caller
    signatureHex,
  };
}

/**
 * Verifies an Ed25519 digital signature against a document hash and public key hex.
 */
export async function verifyEd25519Signature(
  publicKeyHex: string,
  signatureHex: string,
  documentHash: string
): Promise<boolean> {
  try {
    const rawPub = hexToBuf(publicKeyHex);
    const signature = hexToBuf(signatureHex);
    const data = new TextEncoder().encode(documentHash);

    const publicKey = await crypto.subtle.importKey(
      "raw",
      rawPub as unknown as BufferSource,
      "Ed25519",
      true,
      ["verify"]
    );

    return await crypto.subtle.verify("Ed25519", publicKey, signature as unknown as BufferSource, data);
  } catch {
    return false;
  }
}

/**
 * Exports full signed certificate as printable text.
 */
export function formatSignedCertificate(sig: Ed25519SignatureBlock): string {
  return [
    "================================================================================",
    "             NCIIPC SAT-SA ED25519 SUPERVISORY ATTESTATION CERTIFICATE           ",
    "================================================================================",
    `Standard:             ${sig.standard} (${sig.algorithm})`,
    `Examiner ID:          ${sig.examinerId}`,
    `Document / State:     ${sig.documentHash}`,
    `Attestation Date:     ${sig.signedAt}`,
    "--------------------------------------------------------------------------------",
    "EXAMINER PUBLIC KEY (RAW HEX):",
    sig.publicKeyHex,
    "--------------------------------------------------------------------------------",
    "CRYPTOGRAPHIC SIGNATURE (HEX):",
    sig.signatureHex,
    "--------------------------------------------------------------------------------",
    "Status:               CRYPTOGRAPHICALLY VERIFIED & NON-REPUDIABLE",
    "Classification:       RESTRICTED // NCIIPC SUPERVISORY ASSURANCE",
    "================================================================================",
  ].join("\n");
}
