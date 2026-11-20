import type { Palette } from './palettes'
import { isLight } from './palettes'

function mix(hex: string, to: string, k: number) {
  const a = parseInt(hex.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k)
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`
}

/** "Simple" templates: same design as the wedding ones, but on a plain black background.
 *  Palettes made for a light background get light text so every line stays readable on black. */
export function toBlack(p: Palette): Palette {
  const light = isLight(p.bg0)
  return {
    ...p,
    bg0: '#000000',
    bg1: '#000000',
    frame: light ? mix(p.frame, '#ffffff', 0.12) : p.frame,
    name: light ? mix(p.frame, '#ffffff', 0.4) : p.name,
    hi: light ? mix(p.frame, '#ffffff', 0.75) : p.hi,
    soft: light ? mix(p.frame, '#ffffff', 0.55) : p.soft,
    ink: light ? '#f3ece0' : p.ink,
  }
}
