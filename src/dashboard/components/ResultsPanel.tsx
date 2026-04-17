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

function toSyntheticProbability(item: InferenceResultItem): number {
  // Backend returns confidence as max(p_fake, 1 - p_fake). Reverse it to get p_fake.
  return item.prediction === 'synthetic' ? item.confidence : 1 - item.confidence;
}

type AggregatedRow = {
  modelId: string;
  modelName: string;
  avgSyntheticProb: number;
  prediction: 'synthetic' | 'real';
  confidence: number;
  chunkCount: number;
};

function aggregate(chunks: ChunkResult[]): AggregatedRow[] {
  const byModel = new Map<string, { name: string; sum: number; count: number }>();

  for (const chunk of chunks) {
    if (!chunk.results) continue;
    for (const item of chunk.results) {
      const probFake = toSyntheticProbability(item);
      const existing = byModel.get(item.model_id) ?? { name: item.model_name, sum: 0, count: 0 };
      existing.sum += probFake;
      existing.count += 1;
      byModel.set(item.model_id, existing);
    }
  }

  return Array.from(byModel.entries()).map(([modelId, { name, sum, count }]) => {
    const avg = sum / count;
    const prediction: 'synthetic' | 'real' = avg >= 0.5 ? 'synthetic' : 'real';
    const confidence = prediction === 'synthetic' ? avg : 1 - avg;
    return {
      modelId,
      modelName: name,
      avgSyntheticProb: avg,
      prediction,
      confidence,
      chunkCount: count,
    };
  });
}

export default function ResultsPanel({ chunks, isStreaming = false }: ResultsPanelProps) {
  if (chunks.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Results</Typography>
          <Typography variant="body2" color="text.secondary">
            {isStreaming ? 'Waiting for first chunk…' : 'Run inference to see results here.'}
          </Typography>
          {isStreaming && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>
    );
  }

  const aggregated = aggregate(chunks);

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <div>
              <Typography variant="h6">Moving Average</Typography>
              <Typography variant="body2" color="text.secondary">
                Aggregated across {chunks.length} chunk{chunks.length === 1 ? '' : 's'}
                {isStreaming ? ' · streaming' : ''}
              </Typography>
            </div>

            {aggregated.map((row) => (
              <Stack key={row.modelId} spacing={1}>
                <Typography variant="subtitle1">{row.modelName}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={row.prediction}
                    color={row.prediction === 'synthetic' ? 'error' : 'success'}
                  />
                  <Chip label={`Avg confidence: ${(row.confidence * 100).toFixed(1)}%`} />
                  <Chip label={`p(synthetic): ${(row.avgSyntheticProb * 100).toFixed(1)}%`} />
                  <Chip label={`${row.chunkCount} chunk${row.chunkCount === 1 ? '' : 's'}`} />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={row.avgSyntheticProb * 100}
                  color={row.prediction === 'synthetic' ? 'error' : 'success'}
                />
              </Stack>
            ))}

            {isStreaming && <LinearProgress />}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Chunk Timeline</Typography>
            {chunks.map((chunk) => (
              <Stack
                key={chunk.index}
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                  #{chunk.index + 1} · {chunk.startSec.toFixed(1)}s
                </Typography>
                {(chunk.results ?? []).map((r) => (
                  <Chip
                    key={r.model_id}
                    label={`${r.prediction} ${(r.confidence * 100).toFixed(0)}%`}
                    color={r.prediction === 'synthetic' ? 'error' : 'success'}
                    size="small"
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
