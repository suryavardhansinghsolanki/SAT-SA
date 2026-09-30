import type { Dataset } from "./types.ts";
import {
  splitCsvRow,
  validateAndIngestSubmission,
  type IngestionResult,
} from "./schema.ts";

export { splitCsvRow };

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const headers = splitCsvRow(lines[0]!).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cells = splitCsvRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

export function datasetFromAlertRows(rows: Record<string, string>[]): Dataset {
  if (rows.length === 0) {
    throw new Error("Dataset contains zero alert records.");
  }
  const headers = Object.keys(rows[0]!);
  const csvContent = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const result: IngestionResult = validateAndIngestSubmission(csvContent);
  if (!result.success) {
    throw new Error(result.summary);
  }
  return result.dataset;
}

export function parseMaybeJsonDataset(text: string): Dataset | null {
  try {
    const result = validateAndIngestSubmission(text);
    if (result.success) {
      return result.dataset;
    }
  } catch {
    return null;
  }
  return null;
}
