import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import { getModels } from '../../api/inference';

type Status = 'idle' | 'checking' | 'online' | 'offline';

const STATUS_TEXT: Record<Status, string> = {
  idle: 'Server status unknown',
  checking: 'Checking server…',
  online: 'Backend server is running',
  offline: 'Backend server unreachable',
};

export default function CardAlert() {
  const [status, setStatus] = React.useState<Status>('idle');
  const [lastError, setLastError] = React.useState<string | null>(null);

  const checkStatus = React.useCallback(async () => {
    setStatus('checking');
    setLastError(null);
    try {
      await getModels();
      setStatus('online');
    } catch (err) {
      setStatus('offline');
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  React.useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const icon =
    status === 'online' ? (
      <CheckCircleRoundedIcon fontSize="small" color="success" />
    ) : status === 'offline' ? (
      <ErrorRoundedIcon fontSize="small" color="error" />
    ) : status === 'checking' ? (
      <CircularProgress size={16} />
    ) : (
      <HelpOutlineRoundedIcon fontSize="small" color="disabled" />
    );

  return (
    <Card variant="outlined" sx={{ m: 1.5, flexShrink: 0 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {icon}
          <Typography sx={{ fontWeight: 600 }}>{STATUS_TEXT[status]}</Typography>
        </Stack>
        {status === 'offline' && lastError && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1, wordBreak: 'break-word' }}
          >
            {lastError}
          </Typography>
        )}
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={() => void checkStatus()}
          disabled={status === 'checking'}
        >
          {status === 'checking' ? 'Checking…' : 'Check Status'}
        </Button>
      </CardContent>
    </Card>
  );
}
