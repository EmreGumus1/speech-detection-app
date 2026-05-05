import * as React from 'react';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FileUploadPanel from '../dashboard/components/FileUploadPanel';
import ResultsPanel, { type ChunkResult } from '../dashboard/components/ResultsPanel';
import ModelSelectorPanel from '../dashboard/components/ModelSelectorPanel';
import { predictFile } from '../api/inference';
import { splitAudioFileIntoWavChunks } from '../utils/audioChunking';

const CHUNK_DURATION_SEC = 3;

export default function FileInferencePage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [chunks, setChunks] = React.useState<ChunkResult[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRunInference = async () => {
    if (!selectedFile || selectedModels.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setChunks([]);
      setProgress(null);

      const wavChunks = await splitAudioFileIntoWavChunks(selectedFile, CHUNK_DURATION_SEC);
      setProgress({ done: 0, total: wavChunks.length });

      for (let i = 0; i < wavChunks.length; i++) {
        const chunkFile = new File([wavChunks[i]], `chunk_${i}.wav`, { type: 'audio/wav' });
        const data = await predictFile(chunkFile, selectedModels, 'file');
        const startSec = i * CHUNK_DURATION_SEC;

        setChunks((prev) => [
          ...prev,
          {
            index: i,
            startSec,
            durationSec: data.duration_sec ?? CHUNK_DURATION_SEC,
            results: data.results,
          },
        ]);
        setProgress({ done: i + 1, total: wavChunks.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" gutterBottom>
          File Upload Inference
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload an audio file. It is split into {CHUNK_DURATION_SEC}-second chunks and predictions
          are aggregated as a moving average.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <FileUploadPanel
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onRunInference={handleRunInference}
              isSubmitting={isSubmitting}
              disabled={selectedModels.length === 0}
            />

            {progress && (
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Processing chunk {progress.done} / {progress.total}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(progress.done / progress.total) * 100}
                />
              </Stack>
            )}

            <ResultsPanel chunks={chunks} isStreaming={isSubmitting} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ModelSelectorPanel
            selectedModels={selectedModels}
            onChange={setSelectedModels}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
