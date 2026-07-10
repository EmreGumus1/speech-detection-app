import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useSession } from '../context/SessionContext';

type SliderRowProps = {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  marks: { value: number; label: string }[];
  format: (v: number) => string;
  onChange: (v: number) => void;
  caption?: string;
};

function SliderRow({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  marks,
  format,
  onChange,
  caption,
}: SliderRowProps) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={600}>
          {valueLabel}
        </Typography>
      </Stack>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
      <Box sx={{ px: 1, pb: 3 }}>
        <Slider
          value={value}
          onChange={(_, v) => onChange(Array.isArray(v) ? v[0] : v)}
          min={min}
          max={max}
          step={step}
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={format}
        />
      </Box>
    </Stack>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSession();
  const [silenceEnabled, setSilenceEnabled] = React.useState(settings.silenceTimeoutSec > 0);
  const [silenceSeconds, setSilenceSeconds] = React.useState(
    settings.silenceTimeoutSec > 0 ? settings.silenceTimeoutSec : 10,
  );

  const handleSilenceToggle = (checked: boolean) => {
    setSilenceEnabled(checked);
    updateSettings({ silenceTimeoutSec: checked ? silenceSeconds : 0 });
  };

  const handleSilenceSlider = (v: number) => {
    setSilenceSeconds(v);
    if (silenceEnabled) updateSettings({ silenceTimeoutSec: v });
  };

  const windowSpanSec = settings.liveWindowChunks * settings.chunkDurationSec;

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

      {/* ── Real-time detection ─────────────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <div>
              <Typography variant="h6">Real-time Detection</Typography>
              <Typography variant="body2" color="text.secondary">
                Applies to the microphone and system-audio pages. Chunk size and window changes
                take effect on the next capture you start.
              </Typography>
            </div>

            <Divider />

            <SliderRow
              label="Chunk size"
              valueLabel={`${settings.chunkDurationSec} s`}
              caption="Seconds of audio recorded before each chunk is sent for inference."
              value={settings.chunkDurationSec}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: '1 s' },
                { value: 3, label: '3 s' },
                { value: 5, label: '5 s' },
                { value: 10, label: '10 s' },
              ]}
              format={(v) => `${v} s`}
              onChange={(v) => updateSettings({ chunkDurationSec: v })}
            />

            <SliderRow
              label="Moving average window"
              valueLabel={`${settings.liveWindowChunks} chunks`}
              caption={`The live verdict and alerts average the last ${settings.liveWindowChunks} chunks — about ${windowSpanSec} s of audio at the current chunk size.`}
              value={settings.liveWindowChunks}
              min={3}
              max={30}
              step={1}
              marks={[
                { value: 3, label: '3' },
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 30, label: '30' },
              ]}
              format={(v) => `${v} chunks`}
              onChange={(v) => updateSettings({ liveWindowChunks: v })}
            />

            <Divider />

            <SliderRow
              label="Detection threshold"
              valueLabel={`${Math.round(settings.alertThreshold * 100)}%`}
              caption="Signal fake voice when the moving average of p(synthetic) is at or above this percentage."
              value={Math.round(settings.alertThreshold * 100)}
              min={5}
              max={95}
              step={5}
              marks={[
                { value: 20, label: '20%' },
                { value: 40, label: '40%' },
                { value: 60, label: '60%' },
                { value: 80, label: '80%' },
              ]}
              format={(v) => `${v}%`}
              onChange={(v) => updateSettings({ alertThreshold: v / 100 })}
            />

            <SliderRow
              label="Alert cooldown"
              valueLabel={`${settings.alertCooldownSec} s`}
              caption="Minimum interval between repeated alerts while the threshold stays exceeded."
              value={settings.alertCooldownSec}
              min={1}
              max={60}
              step={1}
              marks={[
                { value: 1, label: '1 s' },
                { value: 5, label: '5 s' },
                { value: 15, label: '15 s' },
                { value: 30, label: '30 s' },
                { value: 60, label: '60 s' },
              ]}
              format={(v) => `${v} s`}
              onChange={(v) => updateSettings({ alertCooldownSec: v })}
            />

            <Divider />

            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.alertsDefaultOn}
                    onChange={(e) => updateSettings({ alertsDefaultOn: e.target.checked })}
                  />
                }
                label="Alerts enabled by default"
              />
              <Typography variant="caption" color="text.secondary">
                Initial state of the "Alerts" switch when you open a capture page.
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Silence timeout ─────────────────────────────────────────────── */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <div>
              <Typography variant="h6">Silence Detection</Typography>
              <Typography variant="body2" color="text.secondary">
                Chunks quieter than the threshold count as silence: they are grayed out in the
                waveform, excluded from the live verdict, and feed the auto-stop timer.
              </Typography>
            </div>

            <Divider />

            <SliderRow
              label="Silence threshold"
              valueLabel={`${settings.silenceRmsThreshold} RMS`}
              caption="Audio with an average level (RMS) below this — and peaks below 5× it — is treated as silence. Raise it if background noise gets scored; lower it if quiet speech shows up gray. Takes effect on the next capture."
              value={Math.round(settings.silenceRmsThreshold * 1000)}
              min={2}
              max={50}
              step={1}
              marks={[
                { value: 2, label: '0.002' },
                { value: 8, label: '0.008' },
                { value: 20, label: '0.02' },
                { value: 50, label: '0.05' },
              ]}
              format={(v) => `${v / 1000}`}
              onChange={(v) => updateSettings({ silenceRmsThreshold: v / 1000 })}
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={silenceEnabled}
                  onChange={(e) => handleSilenceToggle(e.target.checked)}
                />
              }
              label={silenceEnabled ? 'Enabled' : 'Disabled'}
            />

            <Stack
              spacing={1}
              sx={{
                opacity: silenceEnabled ? 1 : 0.4,
                pointerEvents: silenceEnabled ? 'auto' : 'none',
              }}
            >
              <SliderRow
                label="Stop after silence longer than"
                valueLabel={`${silenceSeconds} s`}
                value={silenceSeconds}
                min={3}
                max={60}
                step={1}
                marks={[
                  { value: 3, label: '3 s' },
                  { value: 15, label: '15 s' },
                  { value: 30, label: '30 s' },
                  { value: 60, label: '60 s' },
                ]}
                format={(v) => `${v} s`}
                onChange={handleSilenceSlider}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
