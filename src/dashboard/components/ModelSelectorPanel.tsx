import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { getModels } from '../../api/inference';

type ModelItem = {
  id: string;
  name: string;
  supports_realtime: boolean;
  is_downloaded: boolean;
};

type ModelSelectorPanelProps = {
  selectedModels: string[];
  onChange: (models: string[]) => void;
};

export default function ModelSelectorPanel({ selectedModels, onChange }: ModelSelectorPanelProps) {
  const [models, setModels] = React.useState<ModelItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    getModels()
      .then((data: ModelItem[]) => {
        if (cancelled) return;
        setModels(data);
        if (selectedModels.length === 0) {
          const first = data.find((m) => m.is_downloaded);
          if (first) onChange([first.id]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) =>
    onChange(
      selectedModels.includes(id)
        ? selectedModels.filter((x) => x !== id)
        : [...selectedModels, id],
    );

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: '12px !important' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Detection Models
        </Typography>

        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">Loading…</Typography>
          </Stack>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {models.map((model) => (
              <Tooltip
                key={model.id}
                title={model.is_downloaded ? '' : 'Not downloaded — visit the Models page to download'}
                placement="left"
                disableHoverListener={model.is_downloaded}
              >
                <FormControlLabel
                  disabled={!model.is_downloaded}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedModels.includes(model.id)}
                      onChange={() => toggle(model.id)}
                      sx={{ py: 0.5 }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{ color: model.is_downloaded ? 'text.primary' : 'text.disabled' }}
                    >
                      {model.name}
                    </Typography>
                  }
                  sx={{ mx: 0, width: '100%' }}
                />
              </Tooltip>
            ))}
          </Stack>
        )}

        {!loading && models.some((m) => !m.is_downloaded) && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
            Some models need downloading — see the Models page.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
