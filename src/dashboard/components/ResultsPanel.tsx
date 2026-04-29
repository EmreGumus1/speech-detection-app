import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { InferenceResultItem } from '../../api/mockInference';

export type ChunkResult = {
  index: number;
  startSec: number;
  durationSec: number;
  results: InferenceResultItem[];
};

type ResultsPanelProps = {
  chunks: ChunkResult[];
  isStreaming?: boolean;
};

type AggregatedRow = {
  modelId: string;
  modelName: string;
  avgSyntheticProb: number;
  prediction: 'synthetic' | 'real';
  confidence: number;
  chunkCount: number;
};

function toSyntheticProb(item: InferenceResultItem): number {
  return item.prediction === 'synthetic' ? item.confidence : 1 - item.confidence;
}

function aggregate(chunks: ChunkResult[]): AggregatedRow[] {
  const byModel = new Map<string, { name: string; sum: number; count: number }>();
  for (const chunk of chunks) {
    if (!chunk.results) continue;
    for (const item of chunk.results) {
      const prob = toSyntheticProb(item);
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

export default function ResultsPanel({ chunks, isStreaming = false }: ResultsPanelProps) {
  if (chunks.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Results</Typography>
            <Typography variant="body2" color="text.secondary">
              {isStreaming ? 'Waiting for first chunk…' : 'Run inference to see results here.'}
            </Typography>
            {isStreaming && <LinearProgress sx={{ mt: 1 }} />}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const aggregated = aggregate(chunks);
  const lastChunk = chunks[chunks.length - 1];

  return (
    <Stack spacing={2}>
      {/* Live verdict */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Live Result</Typography>
              <Typography variant="caption" color="text.secondary">
                {chunks.length} chunk{chunks.length === 1 ? '' : 's'} · {isStreaming ? 'streaming' : 'stopped'}
              </Typography>
            </Stack>

            {aggregated.map((row) => (
              <Stack key={row.modelId} spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={row.prediction.toUpperCase()}
                    color={row.prediction === 'synthetic' ? 'error' : 'success'}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {row.modelName}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 'auto' }}>
                    {(row.avgSyntheticProb * 100).toFixed(1)}% synthetic
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={row.avgSyntheticProb * 100}
                  color={row.prediction === 'synthetic' ? 'error' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Stack>
            ))}

            {isStreaming && <LinearProgress sx={{ borderRadius: 4 }} />}
          </Stack>
        </CardContent>
      </Card>

      {/* Last chunk detail */}
      {lastChunk?.results?.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Latest chunk #{lastChunk.index + 1} · {lastChunk.startSec.toFixed(1)}s
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {lastChunk.results.map((r) => (
                  <Chip
                    key={r.model_id}
                    label={`${r.prediction} · ${(r.confidence * 100).toFixed(0)}%`}
                    color={r.prediction === 'synthetic' ? 'error' : 'success'}
                    size="small"
                  />
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
