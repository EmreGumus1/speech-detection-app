import * as React from 'react';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import FileUploadPanel from '../dashboard/components/FileUploadPanel';
import ResultsPanel from '../dashboard/components/ResultsPanel';
import { predictFile } from '../api/inference';

export default function InferencePage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedModels, setSelectedModels] = React.useState<string[]>([
    'rawnet2_telco_v3',
  ]);
  const [results, setResults] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRunInference = async () => {
    if (!selectedFile || selectedModels.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const data = await predictFile(selectedFile, selectedModels);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="h4" gutterBottom>
          Inference
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload audio and run synthetic speech detection with selected models.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <FileUploadPanel
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onRunInference={handleRunInference}
              isSubmitting={isSubmitting}
              disabled={selectedModels.length === 1}
            />
            <ResultsPanel results={results} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <div>
                  <Typography variant="h6">Selected Models</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Temporary placeholder until the real model catalog is connected.
                  </Typography>
                </div>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedModels.map((modelId) => (
                    <Chip key={modelId} label={modelId} />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
