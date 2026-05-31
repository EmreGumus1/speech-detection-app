import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import { getModels, getModelStatus, downloadModel } from '../api/inference';

type ModelMeta = {
  id: string;
  name: string;
  description?: string;
  framework?: string;
  supports_realtime?: boolean;
  is_downloaded: boolean;
  hf_repo?: string;
};

type DownloadPhase = 'idle' | 'downloading' | 'ready' | 'error';

/** Extract a size hint like "~450 MB" from the description string. */
function parseSizeHint(description?: string): string {
  if (!description) return '';
  const m = description.match(/~[\d.]+ ?(MB|GB)/i);
  return m ? m[0] : '';
}

export default function ModelsPage() {
  const [models, setModels] = React.useState<ModelMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [downloadPhase, setDownloadPhase] = React.useState<Record<string, DownloadPhase>>({});

  // -------------------------------------------------------------------------
  // Fetch models
  // -------------------------------------------------------------------------
  const fetchModels = React.useCallback(() => {
    setLoading(true);
    setError(null);
    getModels()
      .then((data: ModelMeta[]) => setModels(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to fetch models'),
      )
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { fetchModels(); }, [fetchModels]);

  // -------------------------------------------------------------------------
  // Poll status for downloading models
  // -------------------------------------------------------------------------
  React.useEffect(() => {
    const downloading = Object.entries(downloadPhase)
      .filter(([, p]) => p === 'downloading')
      .map(([id]) => id);
    if (downloading.length === 0) return;

    const interval = setInterval(async () => {
      for (const modelId of downloading) {
        try {
          const status = await getModelStatus(modelId);
          if (status.is_downloaded) {
            setDownloadPhase((prev) => ({ ...prev, [modelId]: 'ready' }));
            setModels((prev) =>
              prev.map((m) => (m.id === modelId ? { ...m, is_downloaded: true } : m)),
            );
          } else if (status.download_state.startsWith('error')) {
            setDownloadPhase((prev) => ({ ...prev, [modelId]: 'error' }));
          }
        } catch { /* ignore transient errors */ }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [downloadPhase]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleDownload = async (modelId: string) => {
    setDownloadPhase((prev) => ({ ...prev, [modelId]: 'downloading' }));
    try {
      await downloadModel(modelId);
    } catch {
      setDownloadPhase((prev) => ({ ...prev, [modelId]: 'error' }));
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" gutterBottom>Models</Typography>
        <Typography variant="body1" color="text.secondary">
          Detection models registered on the backend. Download HuggingFace models here before using them.
        </Typography>
      </div>

      {loading && (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading models…</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">Could not reach the backend: {error}</Alert>}
      {!loading && !error && models.length === 0 && (
        <Alert severity="info">No models registered on the backend.</Alert>
      )}

      <Grid container spacing={2}>
        {models.map((model) => {
          const phase = downloadPhase[model.id] ?? 'idle';
          const isDownloading = phase === 'downloading';
          const isReady = model.is_downloaded || phase === 'ready';
          const hasError = phase === 'error';
          const sizeHint = parseSizeHint(model.description);

          return (
            <Grid key={model.id} size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    {/* Header row */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <HubRoundedIcon color={isReady ? 'primary' : 'disabled'} />
                      <Typography variant="h6">{model.name}</Typography>
                    </Stack>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary">
                      {model.description ?? 'No description available.'}
                    </Typography>

                    {/* Chips */}
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
                      {isReady ? (
                        <Chip
                          icon={<CheckCircleRoundedIcon />}
                          label="Downloaded"
                          size="small"
                          color="success"
                        />
                      ) : (
                        <Chip label="Not downloaded" size="small" color="warning" variant="outlined" />
                      )}
                    </Stack>

                    {/* HF repo */}
                    {model.hf_repo && (
                      <Typography variant="caption" color="text.disabled">
                        {model.hf_repo}
                      </Typography>
                    )}

                    {/* Download area — only for HF models that aren't ready */}
                    {model.hf_repo && !isReady && (
                      <Box>
                        {isDownloading ? (
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CircularProgress size={14} color="warning" />
                              <Typography variant="caption" color="text.secondary">
                                Downloading… this may take a few minutes
                              </Typography>
                            </Stack>
                            <LinearProgress color="warning" />
                          </Stack>
                        ) : hasError ? (
                          <Stack spacing={1}>
                            <Alert severity="error" sx={{ py: 0, fontSize: '0.75rem' }}>
                              Download failed. Check server logs and retry.
                            </Alert>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CloudDownloadRoundedIcon />}
                              onClick={() => handleDownload(model.id)}
                            >
                              Retry
                            </Button>
                          </Stack>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CloudDownloadRoundedIcon />}
                            onClick={() => handleDownload(model.id)}
                          >
                            Download{sizeHint ? ` (${sizeHint})` : ''}
                          </Button>
                        )}
                      </Box>
                    )}

                    <Typography variant="caption" color="text.disabled">
                      ID: {model.id}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
