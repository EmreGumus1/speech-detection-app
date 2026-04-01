import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

export default function InferenceDashboardPage() {
  const navigate = useNavigate();

  const recentRuns = [
    {
      id: 'exp_001',
      input: 'File Upload',
      model: 'rawnet2_telco_v3',
      prediction: 'synthetic',
      confidence: 0.91,
    },
    {
      id: 'exp_002',
      input: 'Microphone',
      model: 'wav2vec_detector_v1',
      prediction: 'real',
      confidence: 0.84,
    },
    {
      id: 'exp_003',
      input: 'System Audio',
      model: 'rawnet2_telco_v3',
      prediction: 'synthetic',
      confidence: 0.88,
    },
  ];

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" gutterBottom>
          Inference Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of recent runs, quick actions, and inference activity.
        </Typography>
      </div>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Runs
              </Typography>
              <Typography variant="h4">124</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Synthetic Detections
              </Typography>
              <Typography variant="h4">81</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Real Detections
              </Typography>
              <Typography variant="h4">43</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Avg. Latency
              </Typography>
              <Typography variant="h4">210 ms</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Quick Actions</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button variant="contained" onClick={() => navigate('/inference/file')}>
                New File Inference
              </Button>
              <Button variant="outlined" onClick={() => navigate('/inference/mic')}>
                New Mic Session
              </Button>
              <Button variant="outlined" onClick={() => navigate('/inference/system-audio')}>
                New System Audio Session
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Recent Runs</Typography>

            {recentRuns.map((run) => (
              <Card key={run.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1">{run.id}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {run.input} · {run.model}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={run.prediction}
                        color={run.prediction === 'synthetic' ? 'error' : 'success'}
                      />
                      <Chip label={`Confidence: ${(run.confidence * 100).toFixed(1)}%`} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}