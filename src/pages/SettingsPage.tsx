import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function SettingsPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Settings</Typography>
      <Typography color="text.secondary">
        Settings page.
      </Typography>
    </Stack>
  );
}