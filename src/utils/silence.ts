/**
 * Silence detection for audio chunks.
 *
 * A chunk only counts as silent when BOTH the average level (RMS) and the
 * peak are low. Quiet-but-real speech still has clear peaks, so gating on
 * RMS alone (the old behaviour) wiped legitimate chunks and made the whole
 * waveform render gray with no live verdict.
 */
export const SILENCE_RMS_THRESHOLD = 0.008;
/** The peak gate scales with the RMS threshold (0.008 → 0.04 by default). */
const PEAK_TO_RMS_FACTOR = 5;

export function isSilentChunk(
  samples: Float32Array,
  rmsThreshold: number = SILENCE_RMS_THRESHOLD,
): boolean {
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    sumSq += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const rms = Math.sqrt(sumSq / samples.length);
  return rms <= rmsThreshold && peak <= rmsThreshold * PEAK_TO_RMS_FACTOR;
}
