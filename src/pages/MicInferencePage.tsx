import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ResultsPanel, { type ChunkResult } from '../dashboard/components/ResultsPanel';
import ModelSelectorPanel from '../dashboard/components/ModelSelectorPanel';
import { createRealtimeSession } from '../api/inference';
import { createPcmStreamRecorder, type PcmStreamRecorder } from '../utils/pcmStreamRecorder';

const CHUNK_DURATION_SEC = 3;

export default function MicInferencePage() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>(['moe_lcnn_v1']);
  const [chunks, setChunks] = React.useState<ChunkResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [durationSec, setDurationSec] = React.useState(0);

  const sessionRef = React.useRef<ReturnType<typeof createRealtimeSession> | null>(null);
  const recorderRef = React.useRef<PcmStreamRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const startTimeRef = React.useRef<number | null>(null);
  const audioUrlRef = React.useRef<string | null>(null);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleStartRecording = async () => {
    try {
      setError(null);
      setChunks([]);
      setDurationSec(0);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      sessionRef.current = createRealtimeSession(
        selectedModels[0],
        (data) => {
          const payload = data as {
            duration_sec?: number;
            results?: ChunkResult['results'];
            error?: string;
          };
          if (payload.error) {
            console.warn('Backend chunk error:', payload.error);
            setError(payload.error);
            return;
          }
          if (!payload.results) return;
          setChunks((prev) => {
            const startSec = prev.reduce((acc, c) => acc + c.durationSec, 0);
            return [
              ...prev,
              {
                index: prev.length,
                startSec,
                durationSec: payload.duration_sec ?? CHUNK_DURATION_SEC,
                results: payload.results!,
              },
            ];
          });
        },
        (err) => {
          console.error('WebSocket error:', err);
          setError('Streaming inference connection error');
        },
      );

      const recorder = createPcmStreamRecorder(stream, CHUNK_DURATION_SEC, (wavBlob) => {
        void sessionRef.current?.send(wavBlob);
      });
      recorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError('Microphone permission denied or unavailable.');
    }
  };

  const handleStopRecording = () => {
    recorderRef.current?.stop();

    if (startTimeRef.current) {
      setDurationSec(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
    }
    const combined = recorderRef.current?.getCombinedWav();
    if (combined) {
      const url = URL.createObjectURL(combined);
      audioUrlRef.current = url;
      setAudioUrl(url);
    }

    cleanupStream();
    setIsRecording(false);
    // Allow tail chunk's response to come back before closing
    setTimeout(() => sessionRef.current?.close(), 1500);
  };

  React.useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      sessionRef.current?.close();
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
          Record audio — inference runs every {CHUNK_DURATION_SEC} seconds and results aggregate live.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Microphone Capture</Typography>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      onClick={handleStartRecording}
                      disabled={isRecording || selectedModels.length === 0}
                    >
                      Start Recording
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleStopRecording}
                      disabled={!isRecording}
                    >
                      Stop Recording
                    </Button>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Duration: {durationSec.toFixed(1)} sec
                  </Typography>

                  {audioUrl && <audio controls src={audioUrl} />}
                </Stack>
              </CardContent>
            </Card>

            <ResultsPanel chunks={chunks} isStreaming={isRecording} />
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
