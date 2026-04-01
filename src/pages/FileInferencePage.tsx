import * as React from 'react';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FileUploadPanel from '../dashboard/components/FileUploadPanel';
import ResultsPanel from '../dashboard/components/ResultsPanel';
import ModelSelectorPanel from '../dashboard/components/ModelSelectorPanel';
import { mockPredictAudio } from '../api/mockInference';

export default function FileInferencePage() {
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

      const data = await mockPredictAudio({
        inputType: 'file',
        fileName: selectedFile.name,
        durationSec: 8.4,
        modelIds: selectedModels,
      });

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
          File Upload Inference
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload audio files and run synthetic speech detection.
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
              disabled={selectedModels.length === 0}
            />
            <ResultsPanel results={results} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ModelSelectorPanel
            selectedModels={selectedModels}
            onChange={setSelectedModels}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}