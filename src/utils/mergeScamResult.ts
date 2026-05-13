import type { TranscribeResult, ScamMatch } from '../api/whisper';

function mergeMatches(existing: ScamMatch[], incoming: ScamMatch[]): ScamMatch[] {
  const map = new Map<string, Set<string>>();
  for (const m of existing) {
    map.set(m.category, new Set(m.matched_keywords));
  }
  for (const m of incoming) {
    const entry = map.get(m.category);
    if (entry) {
      for (const kw of m.matched_keywords) entry.add(kw);
    } else {
      map.set(m.category, new Set(m.matched_keywords));
    }
  }
  return Array.from(map.entries()).map(([category, kws]) => ({
    category,
    matched_keywords: Array.from(kws),
  }));
}

/**
 * Merges a new Whisper result into the accumulated one.
 * - Transcript and language come from the latest result.
 * - Scam patterns are accumulated: once a category is matched it stays visible
 *   even if it leaves the sliding window.
 */
export function mergeScamResult(
  accumulated: TranscribeResult | null,
  incoming: TranscribeResult,
): TranscribeResult {
  if (!accumulated) return incoming;

  const english = mergeMatches(accumulated.scam_detection.english, incoming.scam_detection.english);
  const italian = mergeMatches(accumulated.scam_detection.italian, incoming.scam_detection.italian);

  return {
    ...incoming,
    scam_detection: {
      is_scam: accumulated.scam_detection.is_scam || incoming.scam_detection.is_scam,
      english,
      italian,
    },
  };
}
