import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ResultsPanel, { type ChunkResult } from '../dashboard/components/ResultsPanel';
import ModelSelectorPanel from '../dashboard/components/ModelSelectorPanel';
import WhisperSelectorPanel from '../dashboard/components/WhisperSelectorPanel';
import ScamResultPanel from '../dashboard/components/ScamResultPanel';
import WaveformPanel from '../dashboard/components/WaveformPanel';
import { createRealtimeSession } from '../api/inference';
import { createTranscribeSession, type TranscribeResult, type WarmupProgress } from '../api/whisper';
import { createPcmStreamRecorder, type PcmStreamRecorder } from '../utils/pcmStreamRecorder';
import { mergeScamResult } from '../utils/mergeScamResult';

const CHUNK_DURATION_SEC = 1;

export default function MicInferencePage() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [chunks, setChunks] = React.useState<ChunkResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [elapsedSec, setElapsedSec] = React.useState(0);

  // Whisper state
  const [whisperEnabled, setWhisperEnabled] = React.useState(true);
  const [selectedWhisperModel, setSelectedWhisperModel] = React.useState('base');
  const [selectedLanguage, setSelectedLanguage] = React.useState('auto');
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [scamResult, setScamResult] = React.useState<TranscribeResult | null>(null);
  const [warmupProgress, setWarmupProgress] = React.useState<WarmupProgress | null>(null);

  const sessionRef = React.useRef<ReturnType<typeof createRealtimeSession> | null>(null);
  const transcribeSessionRef = React.useRef<ReturnType<typeof createTranscribeSession> | null>(null);
  const recorderRef = React.useRef<PcmStreamRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSamplesRef = React.useRef<Array<{ samples: Float32Array; sampleRate: number }>>([]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleStart = async () => {
    try {
      setError(null);
      setChunks([]);
      setElapsedSec(0);
      setScamResult(null);
      setWarmupProgress(null);
      pendingSamplesRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Deepfake detection WebSocket
      sessionRef.current = createRealtimeSession(
        selectedModels,
        (data) => {
          const payload = data as {
            duration_sec?: number;
            results?: ChunkResult['results'];
            error?: string;
          };
          if (payload.error) {
            pendingSamplesRef.current.shift();
            setError(payload.error);
            return;
          }
          if (!payload.results) return;
          const pending = pendingSamplesRef.current.shift();
          setChunks((prev) => {
            const startSec = prev.reduce((acc, c) => acc + c.durationSec, 0);
            return [
              ...prev,
              {
                index: prev.length,
                startSec,
                durationSec: payload.duration_sec ?? CHUNK_DURATION_SEC,
                results: payload.results!,
                samples: pending?.samples,
                sampleRate: pending?.sampleRate,
              },
            ];
          });
        },
        (err) => {
          console.error('WebSocket error:', err);
          setError('WebSocket connection error');
        },
      );

      // Whisper transcription WebSocket
      if (whisperEnabled && selectedWhisperModel) {
        transcribeSessionRef.current = createTranscribeSession(
          selectedWhisperModel,
          selectedLanguage,
          (msg) => {
            if (msg.warmup) {
              setWarmupProgress(msg as WarmupProgress);
            } else {
              setWarmupProgress(null);
              setScamResult((prev) => mergeScamResult(prev, msg as TranscribeResult));
            }
          },
          (err) => console.error('Transcribe WS error:', err),
        );
      }

      const recorder = createPcmStreamRecorder(
        stream,
        CHUNK_DURATION_SEC,
        (wavBlob, _dur, samples, sampleRate) => {
          pendingSamplesRef.current.push({ samples, sampleRate });
          void sessionRef.current?.send(wavBlob);
          void transcribeSessionRef.current?.send(wavBlob);
        },
      );
      recorderRef.current = recorder;
      recorder.start();

      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);

      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError('Microphone permission denied or unavailable.');
    }
  };

  const handleStop = () => {
    stopTimer();
    recorderRef.current?.stop();
    cleanupStream();
    setIsRecording(false);
    setTimeout(() => {
      sessionRef.current?.close();
      transcribeSessionRef.current?.close();
      transcribeSessionRef.current = null;
    }, 1500);
  };

  React.useEffect(() => {
    return () => {
      stopTimer();
      sessionRef.current?.close();
      transcribeSessionRef.current?.close();
      recorderRef.current?.stop();
      cleanupStream();
    };
  }, []);

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" gutterBottom>
          Microphone Input
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Inference running and results update live.
        </Typography>
      </div>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">Microphone Capture</Typography>
                    {isRecording && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FiberManualRecordIcon color="error" sx={{ fontSize: 12, animation: 'pulse 1s infinite' }} />
                        <Typography variant="body2" color="error">
                          {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      onClick={handleStart}
                      disabled={isRecording || selectedModels.length === 0}
                    >
                      Start Recording
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleStop}
                      disabled={!isRecording}
                    >
                      Stop
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <WaveformPanel
              chunks={chunks}
              chunkDurationSec={CHUNK_DURATION_SEC}
              isStreaming={isRecording}
            />

            <ResultsPanel chunks={chunks} isStreaming={isRecording} />

            <ScamResultPanel
              result={scamResult}
              warmup={warmupProgress}
              isActive={isRecording && whisperEnabled && !!selectedWhisperModel}
              showTranscript={showTranscript}
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
              disabled={isRecording}
            />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
