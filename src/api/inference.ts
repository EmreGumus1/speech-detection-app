const API_BASE_URL = 'http://127.0.0.1:8000';

export type InferenceResultItem = {
  model_id: string;
  model_name: string;
  prediction: string;
  confidence: number;
  inference_time_ms: number;
};

export type InferenceResponse = {
  experiment_id: string;
  input_type: string;
  file_name?: string;
  duration_sec?: number;
  results: InferenceResultItem[];
};

export async function predictFile(
  file: File,
  modelIds: string[],
): Promise<InferenceResponse> {
  const formData = new FormData();
  formData.append('file', file);

  modelIds.forEach((id) => {
    formData.append('model_ids', id);
  });

  const response = await fetch(`${API_BASE_URL}/predict/file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Prediction request failed');
  }

  return response.json();
}
