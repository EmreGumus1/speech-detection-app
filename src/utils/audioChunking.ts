type AudioCtxCtor = typeof AudioContext;

export function getAudioContextCtor(): AudioCtxCtor {
  const ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext;
  if (!ctor) throw new Error('Web Audio API is not supported in this browser.');
  return ctor;
}

export function encodePcmAsWav(
  samples: Float32Array,
  sampleRate: number,
  numChannels = 1,
): Blob {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  let offset = 0;

  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset++, str.charCodeAt(i));
  };

  writeString('RIFF');
  view.setUint32(offset, totalLength - 8, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numChannels * bytesPerSample, true); offset += 4;
  view.setUint16(offset, numChannels * bytesPerSample, true); offset += 2;
  view.setUint16(offset, bytesPerSample * 8, true); offset += 2;
  writeString('data');
  view.setUint32(offset, dataLength, true); offset += 4;

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export async function splitAudioFileIntoWavChunks(
  file: File,
  chunkDurationSec: number,
): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = getAudioContextCtor();
  const audioContext = new AudioCtx();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (err) {
    await audioContext.close();
    throw new Error(`Could not decode audio file: ${(err as Error).message ?? err}`);
  }

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const samplesPerChunk = Math.floor(sampleRate * chunkDurationSec);
  const totalSamples = audioBuffer.length;

  const chunks: Blob[] = [];

  for (let start = 0; start < totalSamples; start += samplesPerChunk) {
    const end = Math.min(start + samplesPerChunk, totalSamples);
    const length = end - start;

    const chunkBuffer = audioContext.createBuffer(numChannels, length, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      const slice = audioBuffer.getChannelData(ch).subarray(start, end);
      chunkBuffer.getChannelData(ch).set(slice);
    }

    chunks.push(audioBufferToWav(chunkBuffer));
  }

  await audioContext.close();
  return chunks;
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  // Mix down to mono by averaging channels (simple, good enough for inference)
  const numChannels = buffer.numberOfChannels;
  const numSamples = buffer.length;
  const mono = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) sum += buffer.getChannelData(ch)[i];
    mono[i] = sum / numChannels;
  }
  return encodePcmAsWav(mono, buffer.sampleRate, 1);
}
