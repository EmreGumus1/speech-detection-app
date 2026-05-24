import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import type { WhisperSegment } from '../../api/whisper';
import type { ChunkResult } from './ResultsPanel';
import { pToHsla } from '../../utils/colorScale';
import { intervalToChunkProb } from '../../utils/intervalToChunkProb';

type SegmentedTranscriptProps = {
  segments: WhisperSegment[];
  chunks: ChunkResult[];
  maxHeight?: number;
};

function fmtTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SegmentedTranscript({
  segments,
  chunks,
  maxHeight = 320,
}: SegmentedTranscriptProps) {
  const { mode, systemMode } = useColorScheme();
  const isDark = (mode === 'system' ? systemMode : mode) === 'dark';
  const bgAlpha = isDark ? 0.28 : 0.18;

  return (
    <Stack
      spacing={1}
      sx={{
        maxHeight,
        overflowY: 'auto',
        pr: 0.5,
      }}
    >
      {segments.map((seg, i) => {
        const text = seg.text.trim();
        if (!text) return null;
        const p = intervalToChunkProb(seg.start, seg.end, chunks);
        const bg = p != null ? pToHsla(p, bgAlpha) : 'transparent';
        const border =
          p != null
            ? pToHsla(p, isDark ? 0.6 : 0.5)
            : isDark
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(0,0,0,0.12)';

        return (
          <Box
            key={`${seg.start}-${i}`}
            sx={{
              backgroundColor: bg,
              borderLeft: '3px solid',
              borderLeftColor: border,
              borderRadius: 0.75,
              px: 1.25,
              py: 0.75,
            }}
          >
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 56 }}
              >
                {fmtTime(seg.start)}–{fmtTime(seg.end)}
              </Typography>
              {p != null && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: p >= 0.5 ? 'error.main' : 'success.main',
                    flexShrink: 0,
                  }}
                >
                  {(p * 100).toFixed(0)}%
                </Typography>
              )}
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                {text}
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
