import * as React from 'react';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FileUploadPanel from '../dashboard/components/FileUploadPanel';
import ResultsPanel, { type ChunkResult } from '../dashboard/components/ResultsPanel';
import ModelSelectorPanel from '../dashboard/components/ModelSelectorPanel';
import WhisperSelectorPanel from '../dashboard/components/WhisperSelectorPanel';
import ScamResultPanel from '../dashboard/components/ScamResultPanel';
import WaveformPanel from '../dashboard/components/WaveformPanel';
import { predictFile } from '../api/inference';
import { transcribeFile, type TranscribeResult } from '../api/whisper';
import { splitAudioFileIntoWavChunks } from '../utils/audioChunking';
import { isSilentChunk } from '../utils/silence';
import { useSession } from '../context/SessionContext';

const CHUNK_DURATION_SEC = 3;

export default function FileInferencePage() {
  const { settings } = useSession();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [chunks, setChunks] = React.useState<ChunkResult[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Whisper state
  const [whisperEnabled, setWhisperEnabled] = React.useState(true);
  const [selectedWhisperModel, setSelectedWhisperModel] = React.useState('base');
  const [selectedLanguage, setSelectedLanguage] = React.useState('auto');
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [scamResult, setScamResult] = React.useState<TranscribeResult | null>(null);
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  const isRunning = isSubmitting || isTranscribing;

  const handleRunInference = async () => {
    if (!selectedFile || selectedModels.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    setChunks([]);
    setProgress(null);
    setScamResult(null);

    // Start Whisper transcription in parallel (fire-and-forget style)
    if (whisperEnabled && selectedWhisperModel) {
      setIsTranscribing(true);
      transcribeFile(selectedFile, selectedWhisperModel, selectedLanguage)
        .then((result) => setScamResult(result))
        .catch((err: Error) => setError(`Transcription error: ${err.message}`))
        .finally(() => setIsTranscribing(false));
    }

    try {
      const wavChunks = await splitAudioFileIntoWavChunks(selectedFile, CHUNK_DURATION_SEC);
      setProgress({ done: 0, total: wavChunks.length });

      for (let i = 0; i < wavChunks.length; i++) {
        const { wav, samples, sampleRate } = wavChunks[i];
        const startSec = i * CHUNK_DURATION_SEC;
        const isSilent = isSilentChunk(samples, settings.silenceRmsThreshold);

        if (isSilent) {
          // Skip deepfake inference on silence (bogus scores); keep the chunk in
          // the timeline so the waveform stays correctly spaced.
          setChunks((prev) => [
            ...prev,
            {
              index: i,
              startSec,
              durationSec: CHUNK_DURATION_SEC,
              results: [],
              isSilent: true,
              samples,
              sampleRate,
            },
          ]);
        } else {
          const chunkFile = new File([wav], `chunk_${i}.wav`, { type: 'audio/wav' });
          const data = await predictFile(chunkFile, selectedModels, 'file');
          setChunks((prev) => [
            ...prev,
            {
              index: i,
              startSec,
              durationSec: data.duration_sec ?? CHUNK_DURATION_SEC,
              results: data.results,
              samples,
              sampleRate,
            },
          ]);
        }
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
              isSubmitting={isRunning}
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

            <WaveformPanel
              chunks={chunks}
              chunkDurationSec={CHUNK_DURATION_SEC}
              isStreaming={isSubmitting}
            />

            <ResultsPanel chunks={chunks} isStreaming={isSubmitting} />

            <ScamResultPanel
              result={scamResult}
              warmup={null}
              isActive={isTranscribing}
              showTranscript={showTranscript}
              chunks={chunks}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <ModelSelectorPanel
              selectedModels={selectedModels}
              onChange={setSelectedModels}
            />
            <WhisperSelectorPanel
              enabled={whisperEnabled}
              onEnabledChange={setWhisperEnabled}
              selectedModelId={selectedWhisperModel}
              onModelChange={setSelectedWhisperModel}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              showTranscript={showTranscript}
              onShowTranscriptChange={setShowTranscript}
              disabled={isRunning}
            />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
