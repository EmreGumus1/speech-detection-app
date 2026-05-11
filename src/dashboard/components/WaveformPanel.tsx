import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import type { ChunkResult } from './ResultsPanel';
import { toSyntheticProbability } from '../../utils/aggregateChunks';

type WaveformPanelProps = {
  chunks: ChunkResult[];
  chunkDurationSec: number;
  isStreaming?: boolean;
};

const PX_PER_SEC = 60;
const TIME_STRIP_HEIGHT = 22;
const WAVE_HEIGHT = 120;
const HEIGHT = TIME_STRIP_HEIGHT + WAVE_HEIGHT;
const MIN_LABEL_SPACING_PX = 44;
const TICK_HEIGHT = 8;

function avgSyntheticForChunk(chunk: ChunkResult): number | null {
  if (!chunk.results || chunk.results.length === 0) return null;
  const sum = chunk.results.reduce((acc, r) => acc + toSyntheticProbability(r), 0);
  return sum / chunk.results.length;
}

function pToHue(p: number): number {
  // 0 = real (green hue 120), 1 = synthetic (red hue 0)
  return (1 - p) * 120;
}

function fmtTime(sec: number): string {
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function WaveformPanel({
  chunks,
  chunkDurationSec,
  isStreaming = false,
}: WaveformPanelProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const { mode, systemMode } = useColorScheme();
  const isDark = (mode === 'system' ? systemMode : mode) === 'dark';

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const chunkPx = chunkDurationSec * PX_PER_SEC;
    const totalSec = chunks.reduce((acc, c) => acc + c.durationSec, 0);
    const totalWidth = Math.max(Math.ceil(totalSec * PX_PER_SEC), 200);

    canvas.width = totalWidth * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, totalWidth, HEIGHT);

    const waveMid = TIME_STRIP_HEIGHT + WAVE_HEIGHT / 2;
    const tickColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)';
    const labelColor = isDark ? '#fff' : 'rgba(0,0,0,0.8)';
    const separatorColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)';
    const stripBgColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

    // Time strip background
    ctx.fillStyle = stripBgColor;
    ctx.fillRect(0, 0, totalWidth, TIME_STRIP_HEIGHT);

    // centerline through the waveform area
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, waveMid);
    ctx.lineTo(totalWidth, waveMid);
    ctx.stroke();

    // Decide label stride so labels don't overlap when chunks are narrow
    const labelStride = Math.max(1, Math.ceil(MIN_LABEL_SPACING_PX / chunkPx));

    let xCursor = 0;
    chunks.forEach((chunk, i) => {
      const width = Math.max(1, Math.round((chunk.durationSec / chunkDurationSec) * chunkPx));
      const p = avgSyntheticForChunk(chunk);
      const hue = p != null ? pToHue(p) : 0;
      const bgAlpha = isDark ? 0.22 : 0.16;

      // Background fill across the waveform area only (not the time strip)
      ctx.fillStyle =
        p != null
          ? `hsla(${hue}, 75%, 50%, ${bgAlpha})`
          : isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)';
      ctx.fillRect(xCursor, TIME_STRIP_HEIGHT, width, WAVE_HEIGHT);

      // Waveform
      if (chunk.samples && chunk.samples.length > 0) {
        const strokeColor =
          p != null ? `hsl(${hue}, 75%, ${isDark ? 60 : 40}%)` : isDark ? '#888' : '#666';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();

        const samples = chunk.samples;
        const samplesPerPx = samples.length / width;
        for (let px = 0; px < width; px++) {
          const start = Math.floor(px * samplesPerPx);
          const end = Math.max(start + 1, Math.floor((px + 1) * samplesPerPx));
          let min = 1;
          let max = -1;
          for (let s = start; s < end && s < samples.length; s++) {
            const v = samples[s];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          if (min > max) {
            min = 0;
            max = 0;
          }
          const yMin = TIME_STRIP_HEIGHT + ((1 - max) * WAVE_HEIGHT) / 2;
          const yMax = TIME_STRIP_HEIGHT + ((1 - min) * WAVE_HEIGHT) / 2;
          ctx.moveTo(xCursor + px + 0.5, yMin);
          ctx.lineTo(xCursor + px + 0.5, Math.max(yMax, yMin + 0.5));
        }
        ctx.stroke();
      }

      // Tick + label at chunk start
      ctx.strokeStyle = tickColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCursor + 0.5, TIME_STRIP_HEIGHT - TICK_HEIGHT);
      ctx.lineTo(xCursor + 0.5, TIME_STRIP_HEIGHT);
      ctx.stroke();
      ctx.lineWidth = 1;

      if (i % labelStride === 0) {
        ctx.fillStyle = labelColor;
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(fmtTime(chunk.startSec), xCursor + 3, 3);
      }

      xCursor += width;
    });

    // Final tick + label at the end of the last chunk so total duration is visible
    if (chunks.length > 0) {
      const endSec = chunks.reduce((acc, c) => acc + c.durationSec, 0);
      ctx.strokeStyle = tickColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCursor - 0.5, TIME_STRIP_HEIGHT - TICK_HEIGHT);
      ctx.lineTo(xCursor - 0.5, TIME_STRIP_HEIGHT);
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.fillStyle = labelColor;
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(fmtTime(endSec), xCursor - 3, 3);
    }

    // Separator between time strip and waveform
    ctx.strokeStyle = separatorColor;
    ctx.beginPath();
    ctx.moveTo(0, TIME_STRIP_HEIGHT + 0.5);
    ctx.lineTo(totalWidth, TIME_STRIP_HEIGHT + 0.5);
    ctx.stroke();
  }, [chunks, chunkDurationSec, isDark]);

  // Auto-scroll right when streaming and new chunks arrive
  React.useEffect(() => {
    if (!isStreaming) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [chunks, isStreaming]);

  const showEmpty = chunks.length === 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <div>
            <Typography variant="h6">Audio Waveform</Typography>
            <Typography variant="body2" color="text.secondary">
              Colored by p(synthetic) per chunk — updates every {chunkDurationSec}s.
            </Typography>
          </div>

          {showEmpty ? (
            <Box
              sx={{
                height: HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                color: 'text.secondary',
              }}
            >
              <Typography variant="body2">
                {isStreaming ? 'Waiting for first chunk…' : 'Waveform will appear here.'}
              </Typography>
            </Box>
          ) : (
            <Box
              ref={scrollRef}
              sx={{
                overflowX: 'auto',
                overflowY: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <canvas ref={canvasRef} style={{ display: 'block' }} />
            </Box>
          )}

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              real
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: 8,
                borderRadius: 1,
                background:
                  'linear-gradient(to right, hsl(120,75%,50%), hsl(60,75%,50%), hsl(0,75%,50%))',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              synthetic
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
