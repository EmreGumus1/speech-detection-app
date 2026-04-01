import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function ExperimentsPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Experiments</Typography>
      <Typography color="text.secondary">
        Experiment history page.
      </Typography>
    </Stack>
  );
}