import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ScreenShareRoundedIcon from '@mui/icons-material/ScreenShareRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import ResultsPanel, { type ChunkResult } from '../dashboard/components/ResultsPanel';
import ModelSelectorPanel from '../dashboard/components/ModelSelectorPanel';
import { createRealtimeSession } from '../api/inference';
import { createPcmStreamRecorder, type PcmStreamRecorder } from '../utils/pcmStreamRecorder';

const CHUNK_DURATION_SEC = 3;

type CaptureMode = 'display' | 'device';

export default function SystemAudioInferencePage() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [chunks, setChunks] = React.useState<ChunkResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [captureMode, setCaptureMode] = React.useState<CaptureMode>('display');
  const [showDevicePicker, setShowDevicePicker] = React.useState(false);

  const [audioDevices, setAudioDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>('');

  const sessionRef = React.useRef<ReturnType<typeof createRealtimeSession> | null>(null);
  const recorderRef = React.useRef<PcmStreamRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const refreshDevices = async () => {
    try {
      const temp = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      temp.getTracks().forEach((t) => t.stop());
      const all = await navigator.mediaDevices.enumerateDevices();
      const inputs = all.filter((d) => d.kind === 'audioinput');
      setAudioDevices(inputs);
      if (inputs.length > 0 && !selectedDeviceId) setSelectedDeviceId(inputs[0].deviceId);
    } catch {
      setError('Could not enumerate audio devices.');
    }
  };

  React.useEffect(() => { void refreshDevices(); }, []);

  const startSession = (stream: MediaStream) => {
    // Drop video tracks — we only need audio
    stream.getVideoTracks().forEach((t) => t.stop());

    sessionRef.current = createRealtimeSession(
      selectedModels[0],
      (data) => {
        const payload = data as { duration_sec?: number; results?: ChunkResult['results']; error?: string };
        if (payload.error) { setError(payload.error); return; }
        if (!payload.results) return;
        setChunks((prev) => {
          const startSec = prev.reduce((acc, c) => acc + c.durationSec, 0);
          return [...prev, { index: prev.length, startSec, durationSec: payload.duration_sec ?? CHUNK_DURATION_SEC, results: payload.results! }];
        });
      },
      (err) => { console.error('WebSocket error:', err); setError('WebSocket connection error'); },
    );

    const audioStream = new MediaStream(stream.getAudioTracks());
    const recorder = createPcmStreamRecorder(audioStream, CHUNK_DURATION_SEC, (wav) => {
      void sessionRef.current?.send(wav);
    });
    recorderRef.current = recorder;
    recorder.start();

    stream.getAudioTracks()[0].onended = () => handleStop();
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    setIsCapturing(true);
  };

  // PRIMARY: screen share → system audio (Chrome/Edge on macOS)
  const handleStartDisplay = async () => {
    try {
      setError(null); setChunks([]); setElapsedSec(0);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      if (stream.getAudioTracks().length === 0) {
        cleanupStream();
        setError('No audio captured — in the share dialog make sure "Share system audio" is checked, then try again.');
        return;
      }
      setCaptureMode('display');
      startSession(stream);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') return;
      setError('Screen share failed or was cancelled.');
      cleanupStream();
    }
  };

  // FALLBACK: audio input device (any browser — use with BlackHole / virtual cable)
  const handleStartDevice = async () => {
    try {
      setError(null); setChunks([]); setElapsedSec(0);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      streamRef.current = stream;
      setCaptureMode('device');
      startSession(stream);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permission denied.');
        return;
      }
      setError('Could not open audio device.');
      cleanupStream();
    }
  };

  const handleStop = () => {
    stopTimer();
    recorderRef.current?.stop();
    cleanupStream();
    setIsCapturing(false);
    setTimeout(() => sessionRef.current?.close(), 1500);
  };

  React.useEffect(() => {
    return () => {
      stopTimer();
      sessionRef.current?.close();
      recorderRef.current?.stop();
      cleanupStream();
    };
  }, []);

  const elapsed = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`;

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" gutterBottom>System Audio Capture</Typography>
        <Typography variant="body1" color="text.secondary">
          Capture what's playing on your system — inference runs every {CHUNK_DURATION_SEC} seconds in real time.
        </Typography>
      </div>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2.5}>

                  {/* Timer */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">Capture System Audio</Typography>
                    {isCapturing && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FiberManualRecordIcon color="error" sx={{ fontSize: 12, animation: 'pulse 1s infinite' }} />
                        <Typography variant="body2" color="error">{elapsed}</Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* PRIMARY — getDisplayMedia */}
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ScreenShareRoundedIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">Screen / System Audio</Typography>
                      <Typography variant="caption" color="text.secondary">— Chrome · Edge · Firefox</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Opens a system picker. Select <strong>Entire Screen</strong> and check{' '}
                      <strong>"Share system audio"</strong> — captures audio from all apps.
                    </Typography>
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<ScreenShareRoundedIcon />}
                        onClick={handleStartDisplay}
                        disabled={isCapturing || selectedModels.length === 0}
                      >
                        Share Screen Audio
                      </Button>
                    </Box>
                  </Stack>

                  <Divider>
                    <Typography variant="caption" color="text.secondary">or</Typography>
                  </Divider>

                  {/* SECONDARY — getUserMedia device picker */}
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MicRoundedIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">Audio Input Device</Typography>
                      <Typography variant="caption" color="text.secondary">— all browsers incl. Safari</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Select any audio input — including virtual devices like{' '}
                      <strong>BlackHole</strong> (macOS) or <strong>VB-Cable</strong> (Windows)
                      that route system audio.
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 260 }} disabled={isCapturing}>
                        <InputLabel id="device-label">Input Device</InputLabel>
                        <Select
                          labelId="device-label"
                          label="Input Device"
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                        >
                          {audioDevices.length === 0 && (
                            <MenuItem value="" disabled>No devices found</MenuItem>
                          )}
                          {audioDevices.map((d) => (
                            <MenuItem key={d.deviceId} value={d.deviceId}>
                              {d.label || `Device ${d.deviceId.slice(0, 8)}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Tooltip title="Refresh devices">
                        <IconButton onClick={refreshDevices} disabled={isCapturing} size="small">
                          <RefreshRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="outlined"
                        onClick={handleStartDevice}
                        disabled={isCapturing || !selectedDeviceId || selectedModels.length === 0}
                      >
                        Start
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider />

                  {/* Stop */}
                  <Box>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleStop}
                      disabled={!isCapturing}
                    >
                      Stop Capture
                    </Button>
                  </Box>

                </Stack>
              </CardContent>
            </Card>

            <ResultsPanel chunks={chunks} isStreaming={isCapturing} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ModelSelectorPanel selectedModels={selectedModels} onChange={setSelectedModels} />
        </Grid>
      </Grid>
    </Stack>
  );
}
