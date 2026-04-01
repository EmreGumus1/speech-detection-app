import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export default function SystemAudioInferencePage() {
  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" gutterBottom>
          System Audio Capture
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Capture browser or system audio and run inference.
        </Typography>
      </div>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Audio Source Capture</Typography>
            <Typography variant="body2" color="text.secondary">
              This page will handle tab, window, or screen audio capture.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained">Start Capture</Button>
              <Button variant="outlined">Stop Capture</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}