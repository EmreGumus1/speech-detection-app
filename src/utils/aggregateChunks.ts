import type { InferenceResultItem } from '../api/mockInference';
import type { ChunkResult } from '../dashboard/components/ResultsPanel';

export type AggregatedRow = {
  modelId: string;
  modelName: string;
  avgSyntheticProb: number;
  prediction: 'synthetic' | 'real';
  confidence: number;
  chunkCount: number;
};

export function toSyntheticProbability(item: InferenceResultItem): number {
  // Backend returns confidence as max(p_fake, 1 - p_fake). Reverse it to recover p_fake.
  return item.prediction === 'synthetic' ? item.confidence : 1 - item.confidence;
}

export function aggregateChunks(chunks: ChunkResult[]): AggregatedRow[] {
  const byModel = new Map<string, { name: string; sum: number; count: number }>();

  for (const chunk of chunks) {
    if (!chunk.results) continue;
    for (const item of chunk.results) {
      const prob = toSyntheticProbability(item);
      const existing = byModel.get(item.model_id) ?? { name: item.model_name, sum: 0, count: 0 };
      existing.sum += prob;
      existing.count += 1;
      byModel.set(item.model_id, existing);
    }
  }

  return Array.from(byModel.entries()).map(([modelId, { name, sum, count }]) => {
    const avg = sum / count;
    const prediction: 'synthetic' | 'real' = avg >= 0.5 ? 'synthetic' : 'real';
    return {
      modelId,
      modelName: name,
      avgSyntheticProb: avg,
      prediction,
      confidence: prediction === 'synthetic' ? avg : 1 - avg,
      chunkCount: count,
    };
  });
}
