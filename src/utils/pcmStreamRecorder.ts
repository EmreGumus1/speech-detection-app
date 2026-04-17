import { encodePcmAsWav, getAudioContextCtor } from './audioChunking';

export type PcmStreamRecorder = {
  start: () => void;
  stop: () => void;
  getCombinedWav: () => Blob | null;
};

export function createPcmStreamRecorder(
  stream: MediaStream,
  chunkDurationSec: number,
  onChunk: (wav: Blob, durationSec: number) => void,
): PcmStreamRecorder {
  const AudioCtx = getAudioContextCtor();
  let audioContext: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let processor: ScriptProcessorNode | null = null;

  const buffered: Float32Array[] = [];
  const allSamples: Float32Array[] = [];
  let samplesAccumulated = 0;
  let samplesPerChunk = 0;
  let sampleRate = 0;

  const flushChunk = (force = false) => {
    if (samplesAccumulated === 0) return;
    if (!force && samplesAccumulated < samplesPerChunk) return;

    const flushSize = Math.min(samplesAccumulated, samplesPerChunk);
    const out = new Float32Array(flushSize);
    let written = 0;
    while (written < flushSize && buffered.length > 0) {
      const head = buffered[0];
      const need = flushSize - written;
      if (head.length <= need) {
        out.set(head, written);
        written += head.length;
        buffered.shift();
      } else {
        out.set(head.subarray(0, need), written);
        buffered[0] = head.subarray(need);
        written += need;
      }
    }
    samplesAccumulated -= flushSize;

    const wav = encodePcmAsWav(out, sampleRate, 1);
    onChunk(wav, flushSize / sampleRate);

    // Recurse to drain when force=false and we still have a full chunk worth
    if (!force && samplesAccumulated >= samplesPerChunk) flushChunk(false);
  };

  return {
    start: () => {
      audioContext = new AudioCtx();
      sampleRate = audioContext.sampleRate;
      samplesPerChunk = Math.floor(sampleRate * chunkDurationSec);

      source = audioContext.createMediaStreamSource(stream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const copy = new Float32Array(input);
        buffered.push(copy);
        allSamples.push(copy);
        samplesAccumulated += copy.length;
        flushChunk(false);
      };

      source.connect(processor);
      // Connect to destination so the processor actually runs (output is silent here because we only read)
      processor.connect(audioContext.destination);
    },

    stop: () => {
      flushChunk(true); // send remaining (< chunkDurationSec) tail
      processor?.disconnect();
      source?.disconnect();
      void audioContext?.close();
      audioContext = null;
      source = null;
      processor = null;
    },

    getCombinedWav: () => {
      if (allSamples.length === 0 || sampleRate === 0) return null;
      const total = allSamples.reduce((acc, b) => acc + b.length, 0);
      const merged = new Float32Array(total);
      let offset = 0;
      for (const b of allSamples) {
        merged.set(b, offset);
        offset += b.length;
      }
      return encodePcmAsWav(merged, sampleRate, 1);
    },
  };
}
