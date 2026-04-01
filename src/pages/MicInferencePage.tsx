import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

export default function MicInferencePage() {
  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" gutterBottom>
          Microphone Input
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Record audio from the microphone and run inference.
        </Typography>
      </div>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Microphone Capture</Typography>
            <Typography variant="body2" color="text.secondary">
              Start and stop microphone recording here. This page will handle the mic workflow.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained">Start Recording</Button>
              <Button variant="outlined">Stop Recording</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}