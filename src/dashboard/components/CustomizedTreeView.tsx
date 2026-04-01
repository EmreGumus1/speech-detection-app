import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

type TreeItem = {
  id: string;
  label: string;
  children?: TreeItem[];
};

const items: TreeItem[] = [
  {
    id: 'inference',
    label: 'Inference',
    children: [
      { id: 'upload-audio', label: 'File Upload' },
      { id: 'mic-input', label: 'Microphone Input' },
      { id: 'system-audio', label: 'System / Browser Audio Capture' },
    ],
  },
  {
    id: 'models',
    label: 'Models',
    children: [
      { id: 'model-catalog', label: 'Model Catalog' },
      { id: 'model-select', label: 'Model Selection' },
      { id: 'model-compare', label: 'Multi-Model Comparison' },
      { id: 'model-upload', label: 'Model Bundle Upload' },
    ],
  },
  {
    id: 'experiments',
    label: 'Experiments',
    children: [
      { id: 'run-history', label: 'Run History' },
      { id: 'saved-results', label: 'Saved Results' },
      { id: 'reproducibility', label: 'Experiment Tracking' },
    ],
  },
  {
    id: 'backend',
    label: 'FastAPI Backend',
    children: [
      { id: 'health', label: 'Health Check' },
      { id: 'file-endpoint', label: 'POST /predict/file' },
      { id: 'stream-endpoint', label: 'WS /predict/stream' },
      { id: 'models-endpoint', label: 'GET /models' },
    ],
  },
];

export default function CustomizedTreeView() {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Typography component="h2" variant="subtitle2" gutterBottom>
              Platform Structure
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Main workflow for the synthetic speech detection research platform.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="FastAPI" size="small" />
            <Chip label="File Upload" size="small" />
            <Chip label="Microphone" size="small" />
            <Chip label="System Audio" size="small" />
            <Chip label="Model Comparison" size="small" />
          </Stack>

          <Box sx={{ minHeight: 320 }}>
            <RichTreeView items={items} defaultExpandedItems={['inference', 'models', 'backend']} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}