import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { TranscribeResult, WarmupProgress } from '../../api/whisper';
import type { ChunkResult } from './ResultsPanel';
import { chunksToGradient } from '../../utils/chunksToGradient';
import SegmentedTranscript from './SegmentedTranscript';

type ScamResultPanelProps = {
  result: TranscribeResult | null;
  warmup: WarmupProgress | null;
  isActive: boolean;
  showTranscript: boolean;
  chunks?: ChunkResult[];
};

export default function ScamResultPanel({ result, warmup, isActive, showTranscript, chunks = [] }: ScamResultPanelProps) {
  const stripGradient = chunksToGradient(chunks, 1);
  const totalDurationSec = chunks.reduce((acc, c) => acc + c.durationSec, 0);
  if (!result && !isActive) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Transcription & Scam Detection</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enable Whisper transcription and run inference to see results here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!result && isActive) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Transcription & Scam Detection</Typography>
            {warmup ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Accumulating audio… first analysis in ~{Math.ceil(warmup.target_sec - warmup.accumulated_sec)}s
                </Typography>
                <LinearProgress variant="determinate" value={warmup.progress * 100} sx={{ borderRadius: 4 }} />
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Waiting for audio…
                </Typography>
                <LinearProgress sx={{ borderRadius: 4 }} />
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const { transcript, language_detected, scam_detection, window_start_sec, window_end_sec, segments } = result;
  const hasSegments = !!segments && segments.length > 0;
  const hasEnglish = scam_detection.english.length > 0;
  const hasItalian = scam_detection.italian.length > 0;
  const hasMatches = hasEnglish || hasItalian;

  return (
    <Stack spacing={2}>
      {/* Alert banner */}
      {scam_detection.is_scam ? (
        <Alert severity="error" icon={<WarningAmberIcon />} variant="filled">
          Scam patterns detected in transcription — review the matches below.
        </Alert>
      ) : (
        <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
          No scam patterns detected in this transcript.
        </Alert>
      )}

      {/* Transcript card */}
      {showTranscript && <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="h6">Transcript</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Lang: ${language_detected}`} size="small" />
                {window_start_sec !== undefined && window_end_sec !== undefined && (
                  <Chip
                    label={`${window_start_sec.toFixed(0)}s – ${window_end_sec.toFixed(0)}s`}
                    size="small"
                  />
                )}
              </Stack>
            </Stack>

            {stripGradient && (
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Synthetic probability over time
                </Typography>
                <Box
                  aria-hidden
                  sx={{
                    height: 14,
                    borderRadius: 1,
                    backgroundImage: stripGradient,
                  }}
                />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">0s</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totalDurationSec.toFixed(0)}s
                  </Typography>
                </Stack>
              </Stack>
            )}

            {hasSegments ? (
              <SegmentedTranscript segments={segments!} chunks={chunks} />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 160,
                  overflowY: 'auto',
                  fontStyle: transcript ? 'normal' : 'italic',
                  color: transcript ? 'text.primary' : 'text.secondary',
                  lineHeight: 1.6,
                }}
              >
                {transcript || 'No speech detected in this window.'}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>}

      {/* Scam matches card — only shown when patterns are found */}
      {hasMatches && (
        <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" color="error">Matched Scam Patterns</Typography>

              {hasEnglish && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                    English
                  </Typography>
                  {scam_detection.english.map((match) => (
                    <Stack key={match.category} spacing={0.75}>
                      <Typography variant="body2" fontWeight={600}>
                        {match.category}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {match.matched_keywords.map((kw) => (
                          <Chip key={kw} label={kw} size="small" color="error" variant="outlined" />
                        ))}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}

              {hasEnglish && hasItalian && <Divider />}

              {hasItalian && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                    Italian
                  </Typography>
                  {scam_detection.italian.map((match) => (
                    <Stack key={match.category} spacing={0.75}>
                      <Typography variant="body2" fontWeight={600}>
                        {match.category}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {match.matched_keywords.map((kw) => (
                          <Chip key={kw} label={kw} size="small" color="error" variant="outlined" />
                        ))}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {isActive && <LinearProgress sx={{ borderRadius: 4 }} />}
    </Stack>
  );
}
