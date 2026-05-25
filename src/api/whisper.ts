const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export type WhisperModel = {
  id: string;
  name: string;
  size_mb: number;
  multilingual: boolean;
  description: string;
};

export type ScamMatch = {
  category: string;
  matched_keywords: string[];
};

export type ScamDetection = {
  is_scam: boolean;
  english: ScamMatch[];
  italian: ScamMatch[];
};

export type WhisperSegment = {
  start: number;
  end: number;
  text: string;
};

export type TranscribeResult = {
  warmup: false;
  transcript: string;
  language_detected: string;
  scam_detection: ScamDetection;
  duration_sec?: number;
  window_start_sec?: number;
  window_end_sec?: number;
  segments?: WhisperSegment[];
};

export type WarmupProgress = {
  warmup: true;
  accumulated_sec: number;
  target_sec: number;
  progress: number;
};

export type TranscribeMessage = TranscribeResult | WarmupProgress;

export async function getWhisperModels(): Promise<WhisperModel[]> {
  const response = await fetch(`${API_BASE_URL}/whisper-models`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function transcribeFile(
  file: File,
  whisperModelId: string,
  language: string,
): Promise<TranscribeResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('whisper_model_id', whisperModelId);
  formData.append('language', language);

  const response = await fetch(`${API_BASE_URL}/transcribe/file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return { ...data, warmup: false } as TranscribeResult;
}

export function createTranscribeSession(
  modelId: string,
  language: string,
  onMessage: (msg: TranscribeMessage) => void,
  onError?: (err: unknown) => void,
) {
  const params = new URLSearchParams({ model_id: modelId, language });
  const ws = new WebSocket(`${WS_BASE_URL}/ws/transcribe?${params}`);

  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data as string) as TranscribeMessage);
    } catch {
      onError?.(event.data);
    }
  };

  ws.onerror = (event) => onError?.(event);

  return {
    send: async (audioBlob: Blob) => {
      if (ws.readyState === WebSocket.CONNECTING) {
        await new Promise<void>((resolve) => {
          ws.addEventListener('open', () => resolve(), { once: true });
        });
      }
      if (ws.readyState === WebSocket.OPEN) {
        const buffer = await audioBlob.arrayBuffer();
        ws.send(buffer);
      }
    },
    close: () => ws.close(),
    get readyState() {
      return ws.readyState;
    },
  };
}
