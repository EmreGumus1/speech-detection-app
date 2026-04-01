import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { InferenceResponse } from '../../api/mockInference';

type ResultsPanelProps = {
  results: InferenceResponse | null;
};

export default function ResultsPanel({ results }: ResultsPanelProps) {
  if (!results) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Results</Typography>
          <Typography variant="body2" color="text.secondary">
            Run inference to see results here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6">Results</Typography>
            <Typography variant="body2" color="text.secondary">
              Experiment ID: {results.experiment_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Input Type: {results.input_type}
            </Typography>
            {results.file_name && (
              <Typography variant="body2" color="text.secondary">
                File: {results.file_name}
              </Typography>
            )}
          </div>

          {results.results.map((item) => (
            <Card key={item.model_id} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle1">{item.model_name}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={item.prediction}
                      color={item.prediction === 'synthetic' ? 'error' : 'success'}
                    />
                    <Chip
                      label={`Confidence: ${(item.confidence * 100).toFixed(1)}%`}
                    />
                    <Chip label={`${item.inference_time_ms} ms`} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}