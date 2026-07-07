import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import { getModels } from '../../api/inference';

type ModelItem = {
  id: string;
  name: string;
  framework: string;
  supports_realtime: boolean;
  /** Optional — newer backends report download state; absent means usable. */
  is_downloaded?: boolean;
};

// Selecting a model the backend hasn't downloaded yields empty/errored results
// (which renders as an all-gray waveform with no verdict), so treat those as
// unavailable. Backends without the field are assumed ready.
const isAvailable = (m: ModelItem) => m.is_downloaded !== false;

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
          // Auto-select the first usable model if none selected
          if (selectedModels.length === 0) {
            const first = data.find(isAvailable);
            if (first) onChange([first.id]);
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
                opacity: isAvailable(model) ? 1 : 0.6,
              }}
            >
              <Tooltip
                title={isAvailable(model) ? '' : 'Not downloaded — visit the Models page to download it first'}
                placement="left"
                disableHoverListener={isAvailable(model)}
              >
                <FormControlLabel
                  disabled={!isAvailable(model)}
                  control={
                    <Checkbox
                      checked={selectedModels.includes(model.id)}
                      onChange={() => toggleModel(model.id)}
                    />
                  }
                  label={model.name}
                />
              </Tooltip>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={model.framework} size="small" />
                <Chip
                  label={model.supports_realtime ? 'Realtime' : 'File only'}
                  color={model.supports_realtime ? 'success' : 'default'}
                  size="small"
                />
                {!isAvailable(model) && (
                  <Chip label="Not downloaded" color="warning" size="small" variant="outlined" />
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
