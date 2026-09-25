export type BubbleRole = 'customer' | 'agent'

const FALLBACK: Record<BubbleRole, string> = {
  customer: '#f3f3f2',
  agent: '#e8eef5',
}

/**
 * Pre-sampled solid background colors from each avatar
 * (outer ring / edge mode — not the face average).
 */
const AVATAR_BACKGROUNDS: Record<string, { r: number; g: number; b: number }> = {
  fox: { r: 253, g: 202, b: 173 },
  dog: { r: 159, g: 170, b: 119 },
  koala: { r: 119, g: 142, b: 168 },
  owl: { r: 209, g: 185, b: 239 },
  cat: { r: 251, g: 184, b: 184 },
  penguin: { r: 128, g: 213, b: 253 },
  rabbit: { r: 169, g: 215, b: 174 },
  monkey: { r: 110, g: 168, b: 230 },
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
        break
    }
    h *= 60
    if (h < 0) h += 360
  }

  return [h, s, l]
}

function hslToCss(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

function backgroundFromSrc(src: string): { r: number; g: number; b: number } | null {
  const match = src.match(/avatar-([a-z]+)\.png/i)
  if (!match) return null
  return AVATAR_BACKGROUNDS[match[1]] ?? null
}

/** Map an avatar background color into a readable speech-bubble fill. */
export function tintFromBackground(
  r: number,
  g: number,
  b: number,
  role: BubbleRole,
): string {
  const [h, s] = rgbToHsl(r, g, b)

  if (role === 'customer') {
    // Very delicate wash of the avatar backdrop.
    const sat = Math.min(0.14, Math.max(0.05, s * 0.22))
    return hslToCss(h, sat, 0.97)
  }

  // Agent: keep the backdrop hue, push saturation for a clearer chip.
  const sat = Math.min(0.55, Math.max(0.36, s * 0.85 + 0.12))
  return hslToCss(h, sat, 0.88)
}

export function getFallbackBubbleColor(role: BubbleRole): string {
  return FALLBACK[role]
}

/** Sync bubble fill from a known avatar URL (or path). */
export function getAvatarBubbleColor(src: string, role: BubbleRole): string {
  const bg = backgroundFromSrc(src)
  if (!bg) return FALLBACK[role]
  return tintFromBackground(bg.r, bg.g, bg.b, role)
}
