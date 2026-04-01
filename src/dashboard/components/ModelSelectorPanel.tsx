import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

type ModelItem = {
  id: string;
  name: string;
  framework: string;
  supportsRealtime: boolean;
};

type ModelSelectorPanelProps = {
  selectedModels: string[];
  onChange: (models: string[]) => void;
};

const availableModels: ModelItem[] = [
  {
    id: 'rawnet2_telco_v3',
    name: 'RawNet2 Telco v3',
    framework: 'PyTorch',
    supportsRealtime: true,
  },
  {
    id: 'wav2vec_detector_v1',
    name: 'Wav2Vec Detector v1',
    framework: 'PyTorch',
    supportsRealtime: false,
  },
  {
    id: 'onnx_fast_detector',
    name: 'ONNX Fast Detector',
    framework: 'ONNX',
    supportsRealtime: true,
  },
];

export default function ModelSelectorPanel({
  selectedModels,
  onChange,
}: ModelSelectorPanelProps) {
  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onChange(selectedModels.filter((id) => id !== modelId));
    } else {
      onChange([...selectedModels, modelId]);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6">Selected Models</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose one or more models for inference.
            </Typography>
          </div>

          {availableModels.map((model) => (
            <Stack
              key={model.id}
              spacing={1}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedModels.includes(model.id)}
                    onChange={() => toggleModel(model.id)}
                  />
                }
                label={model.name}
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={model.framework} size="small" />
                <Chip
                  label={model.supportsRealtime ? 'Realtime' : 'File only'}
                  size="small"
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}