const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export async function predictFile(
  file: File,
  modelIds: string[],
  inputType: 'file' | 'microphone' | 'system_audio' = 'file',
) {
  const formData = new FormData();
  formData.append('file', file);
  modelIds.forEach((id) => formData.append('model_ids', id));
  formData.append('input_type', inputType);

  const response = await fetch(`${API_BASE_URL}/predict/file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function getModels() {
  const response = await fetch(`${API_BASE_URL}/models`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export function createRealtimeSession(
  modelIds: string[],
  onResult: (data: unknown) => void,
  onError?: (err: unknown) => void,
) {
  const params = modelIds.length > 0
    ? `?model_ids=${modelIds.map(encodeURIComponent).join(',')}`
    : '';
  const ws = new WebSocket(`${WS_BASE_URL}/ws/predict${params}`);

  ws.onmessage = (event) => {
    try {
      onResult(JSON.parse(event.data as string));
    } catch {
      onError?.(event.data);
    }
  };

  ws.onerror = (event) => onError?.(event);

  return {
    send: async (audioBytes: Blob) => {
      // Wait for connection if still opening
      if (ws.readyState === WebSocket.CONNECTING) {
        await new Promise<void>((resolve) => {
          ws.addEventListener('open', () => resolve(), { once: true });
        });
      }
      const buffer = await audioBytes.arrayBuffer();
      ws.send(buffer);
    },
    close: () => ws.close(),
    get readyState() {
      return ws.readyState;
    },
  };
}
