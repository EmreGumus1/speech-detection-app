import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AudioFileRoundedIcon from '@mui/icons-material/AudioFileRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import ScreenShareRoundedIcon from '@mui/icons-material/ScreenShareRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';

const inferenceItems = [
  { text: 'Inference Dashboard', icon: <DashboardRoundedIcon /> },
  { text: 'File Upload', icon: <AudioFileRoundedIcon /> },
  { text: 'Microphone Input', icon: <MicRoundedIcon /> },
  { text: 'System Audio Capture', icon: <ScreenShareRoundedIcon /> },
];

const researchItems = [
  { text: 'Models', icon: <HubRoundedIcon /> },
  { text: 'Model Comparison', icon: <CompareArrowsRoundedIcon /> },
  { text: 'Experiments', icon: <ScienceRoundedIcon /> },
];

const adminItems = [
  { text: 'Upload Model Bundle', icon: <CloudUploadRoundedIcon /> },
  { text: 'Settings', icon: <SettingsRoundedIcon /> },
  { text: 'About Project', icon: <InfoRoundedIcon /> },
];

export default function MenuContent() {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <Stack spacing={2}>
        <List
          dense
          subheader={
            <ListSubheader component="div" disableSticky>
              Inference
            </ListSubheader>
          }
        >
          {inferenceItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton selected={index === 0}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <List
          dense
          subheader={
            <ListSubheader component="div" disableSticky>
              Research
            </ListSubheader>
          }
        >
          {researchItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Stack>

      <List
        dense
        subheader={
          <ListSubheader component="div" disableSticky>
            Admin
          </ListSubheader>
        }
      >
        {adminItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}