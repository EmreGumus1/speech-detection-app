import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ResultsPanel from '../dashboard/components/ResultsPanel';
import ModelSelectorPanel from '../dashboard/components/ModelSelectorPanel';
import { mockPredictAudio } from '../api/mockInference';

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';

  const preferredMimeTypes = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
  ];

  return (
    preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ''
  );
}

function getFileExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('webm')) return 'webm';
  return 'bin';
}

export default function SystemAudioInferencePage() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([
    'rawnet2_telco_v3',
  ]);
  const [results, setResults] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [durationSec, setDurationSec] = React.useState(0);
  const [recordingMimeType, setRecordingMimeType] = React.useState('');

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const startTimeRef = React.useRef<number | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const clearPreviousCapture = () => {
    setAudioBlob(null);
    setDurationSec(0);
    setResults(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartCapture = async () => {
    try {
      setError(null);
      clearPreviousCapture();

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      const supportedMimeType = getSupportedMimeType();
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      setRecordingMimeType(supportedMimeType || recorder.mimeType || '');
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMimeType =
          supportedMimeType || recorder.mimeType || 'audio/mp4';

        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        if (startTimeRef.current) {
          const seconds = (Date.now() - startTimeRef.current) / 1000;
          setDurationSec(Number(seconds.toFixed(1)));
        }

        cleanupStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsCapturing(true);
    } catch {
      setError('System or browser audio capture was denied or unavailable.');
      cleanupStream();
    }
  };

  const handleStopCapture = () => {
    mediaRecorderRef.current?.stop();
    setIsCapturing(false);
  };

  const handleRunInference = async () => {
    if (!audioBlob || selectedModels.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const extension = getFileExtensionFromMimeType(recordingMimeType);

      const data = await mockPredictAudio({
        inputType: 'system_audio',
        fileName: `system_audio_capture.${extension}`,
        durationSec,
        modelIds: selectedModels,
      });

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      cleanupStream();
    };
  }, [audioUrl]);

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" gutterBottom>
          System Audio Capture
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Capture browser, tab, or system audio and run inference.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Audio Source Capture</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start capture, choose a tab/window/screen, then stop and run inference.
                  </Typography>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      onClick={handleStartCapture}
                      disabled={isCapturing}
                    >
                      Start Capture
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleStopCapture}
                      disabled={!isCapturing}
                    >
                      Stop Capture
                    </Button>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Duration: {durationSec.toFixed(1)} sec
                  </Typography>

                  {recordingMimeType && (
                    <Typography variant="body2" color="text.secondary">
                      Format: {recordingMimeType}
                    </Typography>
                  )}

                  {audioUrl && <audio controls src={audioUrl} />}

                  <Button
                    variant="contained"
                    onClick={handleRunInference}
                    disabled={
                      !audioBlob || isSubmitting || selectedModels.length === 0
                    }
                  >
                    {isSubmitting ? 'Running inference...' : 'Run inference'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <ResultsPanel results={results} />
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