import type { TranscribeResult, ScamMatch, WhisperSegment } from '../api/whisper';

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

// Converts incoming segment timestamps from window-relative to absolute.
function toAbsoluteSegments(
  segments: WhisperSegment[] | undefined,
  windowStartSec: number,
): WhisperSegment[] {
  if (!segments) return [];
  return segments.map((s) => ({
    ...s,
    start: s.start + windowStartSec,
    end: s.end + windowStartSec,
  }));
}

/**
 * Merges a new Whisper result into the accumulated one.
 * - Transcript and language come from the latest result.
 * - Scam patterns are accumulated: once a category is matched it stays visible
 *   even if it leaves the sliding window.
 * - Segments are stored in absolute time. On each new emission we drop the
 *   accumulated tail that overlaps the new window (because the same segment
 *   can appear in successive 30s sliding-window emissions with refined
 *   timestamps) and replace it with the incoming segments.
 */
export function mergeScamResult(
  accumulated: TranscribeResult | null,
  incoming: TranscribeResult,
): TranscribeResult {
  const incomingWindowStart = incoming.window_start_sec ?? 0;
  const incomingAbsSegments = toAbsoluteSegments(incoming.segments, incomingWindowStart);

  if (!accumulated) {
    return { ...incoming, segments: incomingAbsSegments };
  }

  const english = mergeMatches(accumulated.scam_detection.english, incoming.scam_detection.english);
  const italian = mergeMatches(accumulated.scam_detection.italian, incoming.scam_detection.italian);

  const keptSegments = (accumulated.segments ?? []).filter(
    (s) => s.end <= incomingWindowStart,
  );
  const mergedSegments = [...keptSegments, ...incomingAbsSegments];

  return {
    ...incoming,
    scam_detection: {
      is_scam: accumulated.scam_detection.is_scam || incoming.scam_detection.is_scam,
      english,
      italian,
    },
    segments: mergedSegments,
  };
}
