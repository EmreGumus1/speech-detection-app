import type { ChunkResult } from '../dashboard/components/ResultsPanel';
import { toSyntheticProbability } from './aggregateChunks';
import { pToHsla } from './colorScale';

function avgSyntheticForChunk(chunk: ChunkResult): number | null {
  if (!chunk.results || chunk.results.length === 0) return null;
  const sum = chunk.results.reduce((acc, r) => acc + toSyntheticProbability(r), 0);
  return sum / chunk.results.length;
}

/**
 * Builds a horizontal CSS linear-gradient string from a sequence of chunks.
 * Each chunk contributes one color stop placed at its midpoint, normalized
 * to the total duration. Returns null when there's nothing to draw.
 */
export function chunksToGradient(chunks: ChunkResult[], alpha: number): string | null {
  if (chunks.length === 0) return null;

  const stops: Array<{ p: number; pct: number }> = [];
  const total = chunks.reduce((acc, c) => acc + c.durationSec, 0);
  if (total <= 0) return null;

  for (const c of chunks) {
    const p = avgSyntheticForChunk(c);
    if (p == null) continue;
    const mid = c.startSec + c.durationSec / 2;
    const pct = Math.max(0, Math.min(100, (mid / total) * 100));
    stops.push({ p, pct });
  }

  if (stops.length === 0) return null;
  if (stops.length === 1) return pToHsla(stops[0].p, alpha);

  // Anchor the curve at 0% and 100% with the first/last colors so the gradient
  // doesn't fade to transparent at the edges.
  const first = stops[0];
  const last = stops[stops.length - 1];
  const fenced = [
    { p: first.p, pct: 0 },
    ...stops,
    { p: last.p, pct: 100 },
  ];

  const parts = fenced.map((s) => `${pToHsla(s.p, alpha)} ${s.pct.toFixed(2)}%`);
  return `linear-gradient(to right, ${parts.join(', ')})`;
}
