export type InferenceResultItem = {
  model_id: string;
  model_name: string;
  prediction: 'real' | 'synthetic';
  confidence: number;
  inference_time_ms: number;
};

export type InferenceResponse = {
  experiment_id: string;
  input_type: 'file' | 'microphone' | 'system_audio';
  file_name?: string;
  duration_sec?: number;
  created_at: string;
  results: InferenceResultItem[];
};

type PredictParams = {
  inputType: 'file' | 'microphone' | 'system_audio';
  fileName?: string;
  durationSec?: number;
  modelIds: string[];
};

function prettyModelName(modelId: string) {
  return modelId
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function mockPredictAudio({
  inputType,
  fileName,
  durationSec,
  modelIds,
}: PredictParams): Promise<InferenceResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    experiment_id: `exp_${Math.random().toString(36).slice(2, 10)}`,
    input_type: inputType,
    file_name: fileName,
    duration_sec: durationSec ?? 0,
    created_at: new Date().toISOString(),
    results: modelIds.map((modelId, index) => {
      const synthetic = Math.random() > 0.4;
      const confidence = Number((0.65 + Math.random() * 0.3).toFixed(2));

      return {
        model_id: modelId,
        model_name: prettyModelName(modelId),
        prediction: synthetic ? 'synthetic' : 'real',
        confidence,
        inference_time_ms: 120 + index * 40 + Math.floor(Math.random() * 80),
      };
    }),
  };
}