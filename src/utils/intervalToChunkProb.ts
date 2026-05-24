import type { ChunkResult } from '../dashboard/components/ResultsPanel';
import { toSyntheticProbability } from './aggregateChunks';

function chunkAvgSynthetic(chunk: ChunkResult): number | null {
  if (!chunk.results || chunk.results.length === 0) return null;
  const sum = chunk.results.reduce((acc, r) => acc + toSyntheticProbability(r), 0);
  return sum / chunk.results.length;
}

/**
 * Given an absolute time interval [start, end], computes the weighted average
 * p(synthetic) of the deepfake chunks that overlap it. Weight = overlap
 * duration. Returns null when no chunk overlaps.
 */
export function intervalToChunkProb(
  startSec: number,
  endSec: number,
  chunks: ChunkResult[],
): number | null {
  if (chunks.length === 0 || endSec <= startSec) return null;

  let weightedSum = 0;
  let totalOverlap = 0;
  for (const c of chunks) {
    const cStart = c.startSec;
    const cEnd = c.startSec + c.durationSec;
    const overlap = Math.max(0, Math.min(endSec, cEnd) - Math.max(startSec, cStart));
    if (overlap <= 0) continue;
    const p = chunkAvgSynthetic(c);
    if (p == null) continue;
    weightedSum += p * overlap;
    totalOverlap += overlap;
  }

  if (totalOverlap === 0) return null;
  return weightedSum / totalOverlap;
}
