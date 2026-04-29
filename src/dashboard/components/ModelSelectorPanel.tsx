import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { getModels } from '../../api/inference';

type ModelItem = {
  id: string;
  name: string;
  framework: string;
  supports_realtime: boolean;
};

type ModelSelectorPanelProps = {
  selectedModels: string[];
  onChange: (models: string[]) => void;
};

export default function ModelSelectorPanel({
  selectedModels,
  onChange,
}: ModelSelectorPanelProps) {
  const [models, setModels] = React.useState<ModelItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getModels()
      .then((data: ModelItem[]) => {
        if (!cancelled) {
          setModels(data);
          // Auto-select first model if none selected
          if (selectedModels.length === 0 && data.length > 0) {
            onChange([data[0].id]);
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message ?? 'Failed to load models');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onChange(selectedModels.filter((id) => id !== modelId));
    } else {
      onChange([...selectedModels, modelId]);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6">Models</Typography>
            <Typography variant="body2" color="text.secondary">
              Select one or more models for inference.
            </Typography>
          </div>

          {loading && (
            <Stack alignItems="center" py={2}>
              <CircularProgress size={24} />
            </Stack>
          )}

          {error && (
            <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
              {error}
            </Alert>
          )}

          {!loading && !error && models.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No models available.
            </Typography>
          )}

          {models.map((model) => (
            <Stack
              key={model.id}
              spacing={1}
              sx={{
                border: '1px solid',
                borderColor: selectedModels.includes(model.id) ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedModels.includes(model.id)}
                    onChange={() => toggleModel(model.id)}
                  />
                }
                label={model.name}
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={model.framework} size="small" />
                <Chip
                  label={model.supports_realtime ? 'Realtime' : 'File only'}
                  color={model.supports_realtime ? 'success' : 'default'}
                  size="small"
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
