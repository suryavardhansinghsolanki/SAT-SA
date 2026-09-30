/**
 * Deterministic string similarity and note clustering module.
 * Used by detector EG-03 (Repetitive Investigation) to cluster near-identical
 * case notes without relying on exact string equality or black-box models.
 */

export function normalizeNoteText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): Set<string> {
  const normalized = normalizeNoteText(text);
  if (!normalized) return new Set();
  return new Set(normalized.split(" ").filter((t) => t.length > 1));
}

export function charNgrams(text: string, n = 3): Set<string> {
  const norm = normalizeNoteText(text).replace(/\s/g, "");
  const set = new Set<string>();
  if (norm.length < n) {
    if (norm.length > 0) set.add(norm);
    return set;
  }
  for (let i = 0; i <= norm.length - n; i++) {
    set.add(norm.slice(i, i + n));
  }
  return set;
}

export function jaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[n]!;
}

export function noteSimilarity(a: string, b: string): number {
  const normA = normalizeNoteText(a);
  const normB = normalizeNoteText(b);
  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const maxLen = Math.max(normA.length, normB.length);
  const levRatio = 1 - levenshteinDistance(normA, normB) / maxLen;
  if (levRatio >= 0.85) return levRatio;

  const tokenJaccard = jaccardSimilarity(tokenize(a), tokenize(b));
  const ngramJaccard = jaccardSimilarity(charNgrams(a, 3), charNgrams(b, 3));

  return Math.max(levRatio, tokenJaccard, ngramJaccard);
}

export interface NoteCluster {
  representativeNote: string;
  count: number;
  sampleNotes: string[];
}

export interface ClusteringResult {
  totalNotes: number;
  uniqueClusters: number;
  largestClusterSize: number;
  templateRate: number;
  uniqueRatio: number;
  dominantClusters: NoteCluster[];
}

/**
 * Deterministically clusters case notes based on similarity threshold.
 * Avoids false negatives when notes differ only by punctuation, casing, or minor synonyms.
 */
export function clusterNotes(notes: string[], threshold = 0.70): ClusteringResult {
  const validNotes = notes.map((n) => n.trim()).filter((n) => n.length > 0);
  if (validNotes.length === 0) {
    return {
      totalNotes: 0,
      uniqueClusters: 0,
      largestClusterSize: 0,
      templateRate: 0,
      uniqueRatio: 0,
      dominantClusters: [],
    };
  }

  const clusters: { representative: string; count: number; samples: string[] }[] = [];

  for (const note of validNotes) {
    let matched = false;
    for (const cluster of clusters) {
      if (noteSimilarity(note, cluster.representative) >= threshold) {
        cluster.count++;
        if (cluster.samples.length < 3 && !cluster.samples.includes(note)) {
          cluster.samples.push(note);
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({
        representative: note,
        count: 1,
        samples: [note],
      });
    }
  }

  clusters.sort((a, b) => b.count - a.count);

  const largestClusterSize = clusters[0]?.count ?? 0;
  // Notes in clusters of size >= 2 are considered templated/repetitive
  const templatedNotesCount = clusters
    .filter((c) => c.count >= 2)
    .reduce((acc, c) => acc + c.count, 0);

  const templateRate = templatedNotesCount / validNotes.length;
  const uniqueRatio = clusters.length / validNotes.length;

  return {
    totalNotes: validNotes.length,
    uniqueClusters: clusters.length,
    largestClusterSize,
    templateRate,
    uniqueRatio,
    dominantClusters: clusters.slice(0, 5).map((c) => ({
      representativeNote: c.representative,
      count: c.count,
      sampleNotes: c.samples,
    })),
  };
}
