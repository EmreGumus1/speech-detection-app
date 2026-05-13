import * as React from 'react';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { getWhisperModels, type WhisperModel } from '../../api/whisper';

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italian' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ko', label: 'Korean' },
  { code: 'tr', label: 'Turkish' },
  { code: 'pl', label: 'Polish' },
];

type WhisperSelectorPanelProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  showTranscript: boolean;
  onShowTranscriptChange: (show: boolean) => void;
  disabled?: boolean;
};

export default function WhisperSelectorPanel({
  enabled,
  onEnabledChange,
  selectedModelId,
  onModelChange,
  selectedLanguage,
  onLanguageChange,
  showTranscript,
  onShowTranscriptChange,
  disabled = false,
}: WhisperSelectorPanelProps) {
  const [models, setModels] = React.useState<WhisperModel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getWhisperModels()
      .then((data) => {
        if (!cancelled) {
          setModels(data);
          if (!selectedModelId && data.length > 0) {
            const base = data.find((m) => m.id === 'base') ?? data[0];
            onModelChange(base.id);
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message ?? 'Failed to load Whisper models');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <div>
              <Typography variant="h6">Transcription</Typography>
              <Typography variant="body2" color="text.secondary">
                Whisper STT + scam pattern detection
              </Typography>
            </div>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => onEnabledChange(e.target.checked)}
                  disabled={disabled}
                />
              }
              label=""
              sx={{ mr: 0, mt: 0.5 }}
            />
          </Stack>

          {error && (
            <Alert severity="warning" sx={{ fontSize: '0.75rem' }}>
              {error} — backend may be offline.
            </Alert>
          )}

          {loading && (
            <Stack alignItems="center" py={1}>
              <CircularProgress size={20} />
            </Stack>
          )}

          {!loading && !error && enabled && (
            <Stack spacing={1.5}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showTranscript}
                    onChange={(e) => onShowTranscriptChange(e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={<Typography variant="body2">Show transcript</Typography>}
              />

              <FormControl size="small" fullWidth disabled={disabled}>
                <InputLabel id="whisper-model-label">Whisper Model</InputLabel>
                <Select
                  labelId="whisper-model-label"
                  label="Whisper Model"
                  value={selectedModelId}
                  onChange={(e) => onModelChange(e.target.value)}
                  renderValue={(value) => {
                    const model = models.find((m) => m.id === value);
                    return model ? `${model.name} — ${model.size_mb} MB` : String(value);
                  }}
                >
                  {models.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      <Stack sx={{ py: 0.25 }}>
                        <Typography variant="body2">{m.name} — {m.size_mb} MB</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.description}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth disabled={disabled}>
                <InputLabel id="whisper-lang-label">Language</InputLabel>
                <Select
                  labelId="whisper-lang-label"
                  label="Language"
                  value={selectedLanguage}
                  onChange={(e) => onLanguageChange(e.target.value)}
                >
                  <MenuItem value="auto">
                    <em>Auto-detect</em>
                  </MenuItem>
                  <ListSubheader>Languages</ListSubheader>
                  {LANGUAGES.filter((l) => l.code !== 'auto').map((l) => (
                    <MenuItem key={l.code} value={l.code}>
                      {l.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
