import * as React from 'react';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { getModels } from '../api/inference';

type ModelMeta = {
  id: string;
  name: string;
  description?: string;
  framework?: string;
  supports_realtime?: boolean;
  [key: string]: unknown;
};

export default function ModelsPage() {
  const [models, setModels] = React.useState<ModelMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getModels()
      .then((data: ModelMeta[]) => {
        if (!cancelled) setModels(data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to fetch models');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" gutterBottom>
          Models
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Detection models registered and available on the backend.
        </Typography>
      </div>

      {loading && (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading models…</Typography>
        </Stack>
      )}

      {error && (
        <Alert severity="error">
          Could not reach the backend: {error}
        </Alert>
      )}

      {!loading && !error && models.length === 0 && (
        <Alert severity="info">No models registered on the backend.</Alert>
      )}

      <Grid container spacing={2}>
        {models.map((model) => (
          <Grid key={model.id} size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <HubRoundedIcon color="primary" />
                    <Typography variant="h6">{model.name}</Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {model.description ?? 'No description available.'}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {model.framework && (
                      <Chip label={model.framework} size="small" variant="outlined" />
                    )}
                    {model.supports_realtime && (
                      <Chip
                        icon={<CheckCircleRoundedIcon />}
                        label="Real-time"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  <Typography variant="caption" color="text.disabled">
                    ID: {model.id}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
