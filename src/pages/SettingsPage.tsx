import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useSession } from '../context/SessionContext';

export default function SettingsPage() {
  const { settings, setSilenceTimeout } = useSession();
  const [enabled, setEnabled] = React.useState(settings.silenceTimeoutSec > 0);
  const [seconds, setSeconds] = React.useState(
    settings.silenceTimeoutSec > 0 ? settings.silenceTimeoutSec : 10,
  );

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    setSilenceTimeout(checked ? seconds : 0);
  };

  const handleSliderChange = (_: Event, value: number | number[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    setSeconds(v);
    if (enabled) setSilenceTimeout(v);
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure recording and inference behaviour. Settings are kept for the current session.
        </Typography>
      </div>

      {/* ── Silence timeout ─────────────────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <div>
              <Typography variant="h6">Silence Auto-Stop</Typography>
              <Typography variant="body2" color="text.secondary">
                Automatically stop recording after a period of silence. Silence is detected when
                the incoming audio level stays below a low-noise threshold for the specified
                number of seconds.
              </Typography>
            </div>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => handleToggle(e.target.checked)}
                />
              }
              label={enabled ? 'Enabled' : 'Disabled'}
            />

            <Stack
              spacing={1}
              sx={{
                opacity: enabled ? 1 : 0.4,
                pointerEvents: enabled ? 'auto' : 'none',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Stop after silence longer than</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {seconds} s
                </Typography>
              </Stack>
              <Slider
                value={seconds}
                onChange={handleSliderChange}
                min={3}
                max={60}
                step={1}
                marks={[
                  { value: 3, label: '3 s' },
                  { value: 15, label: '15 s' },
                  { value: 30, label: '30 s' },
                  { value: 60, label: '60 s' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v} s`}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
