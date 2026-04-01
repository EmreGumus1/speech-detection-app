import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import AudioFileRoundedIcon from '@mui/icons-material/AudioFileRounded';

type FileUploadPanelProps = {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onRunInference: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
};

export default function FileUploadPanel({
  selectedFile,
  onFileSelect,
  onRunInference,
  isSubmitting,
  disabled = false,
}: FileUploadPanelProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    onFileSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">File Upload</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload an audio file to run synthetic speech detection.
            </Typography>
          </Box>

          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleBrowseClick}
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: 'background.default',
              cursor: 'pointer',
            }}
          >
            <Stack spacing={1.5} alignItems="center">
              <CloudUploadRoundedIcon color="action" />
              <Typography variant="body1">
                Drag and drop an audio file here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: WAV, MP3
              </Typography>
              <Button variant="outlined" onClick={handleBrowseClick}>
                Browse file
              </Button>
            </Stack>

            <input
              ref={inputRef}
              type="file"
              accept=".wav,.mp3,audio/wav,audio/mpeg"
              hidden
              onChange={handleFileChange}
            />
          </Box>

          {selectedFile && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AudioFileRoundedIcon color="action" />
                <Box>
                  <Typography variant="body1">{selectedFile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={onRunInference}
            disabled={!selectedFile || disabled || isSubmitting}
          >
            {isSubmitting ? 'Running inference...' : 'Run inference'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
