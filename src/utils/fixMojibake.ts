/**
 * Repairs mojibake: text that was UTF-8 encoded but decoded as Windows-1252
 * somewhere upstream (e.g. "—" arriving as "â€/â€”" sequences).
 * Conservative: returns the input unchanged unless the telltale lead bytes are
 * present AND the reversed decode succeeds cleanly.
 */

// Windows-1252 maps bytes 0x80–0x9F to these code points (unlike Latin-1).
const CP1252_REVERSE: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

export function fixMojibake(text: string): string {
  // Fast path: UTF-8 multi-byte sequences misread as cp1252 always start with
  // Â/Ã (0xC2/0xC3) or â/å/etc. (0xE0–0xEF lead bytes). Plain text skips this.
  if (!/[Â-ô]/.test(text)) return text;

  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0xff) {
      bytes[i] = code;
    } else {
      const mapped = CP1252_REVERSE[code];
      if (mapped === undefined) return text; // not cp1252 mojibake — leave as is
      bytes[i] = mapped;
    }
  }

  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return decoded;
  } catch {
    return text; // wasn't valid UTF-8 after all — keep the original
  }
}

/** Applies fixMojibake to every string field of an object (shallow). */
export function fixMojibakeFields<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  const out = { ...obj } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === 'string') out[k] = fixMojibake(v);
  }
  return out as T;
}
