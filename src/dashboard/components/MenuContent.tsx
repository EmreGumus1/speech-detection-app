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
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import { useLocation, useNavigate } from 'react-router-dom';

const inferenceItems = [
  { text: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/inference' },
  { text: 'File Upload', icon: <AudioFileRoundedIcon />, path: '/inference/file' },
  { text: 'Microphone Input', icon: <MicRoundedIcon />, path: '/inference/mic' },
  { text: 'System Audio Capture', icon: <ScreenShareRoundedIcon />, path: '/inference/system-audio' },
];

const researchItems = [
  { text: 'Models', icon: <HubRoundedIcon />, path: '/models' },
  { text: 'Model Comparison', icon: <CompareArrowsRoundedIcon />, path: '/models' },
  { text: 'Experiments', icon: <ScienceRoundedIcon />, path: '/experiments' },
];

const adminItems = [
  { text: 'Upload Model Bundle', icon: <CloudUploadRoundedIcon />, path: '/models' },
  { text: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
  { text: 'About Project', icon: <InfoRoundedIcon />, path: '/settings' },
];

export default function MenuContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSelected = (path: string) => location.pathname === path;

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
          {inferenceItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                selected={isSelected(item.path)}
                onClick={() => navigate(item.path)}
              >
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
              <ListItemButton
                selected={isSelected(item.path)}
                onClick={() => navigate(item.path)}
              >
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
            <ListItemButton
              selected={isSelected(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}