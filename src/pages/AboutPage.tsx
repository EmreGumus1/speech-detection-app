import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import TerminalRoundedIcon from '@mui/icons-material/TerminalRounded';

export default function AboutPage() {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" gutterBottom>
          About Project
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Synthetic Audio Detection — a real-time deepfake speech detector built on a
          Mixture-of-Experts LCNN model with optional Whisper transcription and
          scam-pattern analysis.
        </Typography>
      </div>

      {/* Architecture */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CodeRoundedIcon color="primary" fontSize="small" />
              <Typography variant="h6">Architecture</Typography>
            </Stack>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              The backend is a FastAPI server with three router modules:
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
              {[
                'routes_inference — POST /predict/file for batch audio analysis',
                'routes_ws — WebSocket /ws/predict for real-time chunk streaming',
                'routes_transcribe — Whisper transcription + scam-pattern detection',
              ].map((line) => (
                <Typography key={line} component="li" variant="body2" color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Models are discovered automatically from the <code>detectors/</code> folder via a
              registry — drop in a new detector and it appears in the API without any manual
              registration.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* How to upload a model bundle */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CloudUploadRoundedIcon color="primary" fontSize="small" />
              <Typography variant="h6">Adding a New Model</Typography>
            </Stack>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Models are loaded from the backend filesystem — there is no in-app upload UI.
              To register a new detector:
            </Typography>
            <Stack component="ol" spacing={0.75} sx={{ pl: 2, m: 0 }}>
              {[
                'Create a new folder under detectors/, e.g. detectors/my_model/',
                'Add __init__.py, detector.py (subclass BaseDetector), and a config.json with id, name, checkpoint_path, etc.',
                'Place the model checkpoint (.pth) on the server at the path specified in config.json.',
                'Restart the backend — the model is picked up automatically by the registry.',
              ].map((step, i) => (
                <Typography key={i} component="li" variant="body2" color="text.secondary">
                  {step}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Running locally */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TerminalRoundedIcon color="primary" fontSize="small" />
              <Typography variant="h6">Running Locally</Typography>
            </Stack>
            <Divider />
            <Stack spacing={0.5}>
              {[
                '# Backend',
                'cd synthetic_audio_detection_minimal',
                'conda activate sad-backend',
                'uvicorn app.main:app --reload',
                '',
                '# Frontend',
                'cd speech-detection-app',
                'npm run dev',
              ].map((line, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    color: line.startsWith('#') ? 'text.disabled' : 'text.secondary',
                    lineHeight: line === '' ? 0.5 : 1.6,
                  }}
                >
                  {line || ' '}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
