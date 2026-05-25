// Maps p(synthetic) in [0,1] to a hue: 0 = real (green, 120), 1 = synthetic (red, 0).
export function pToHue(p: number): number {
  return (1 - p) * 120;
}

export function pToHsla(p: number, alpha: number, saturation = 75, lightness = 50): string {
  return `hsla(${pToHue(p)}, ${saturation}%, ${lightness}%, ${alpha})`;
}
