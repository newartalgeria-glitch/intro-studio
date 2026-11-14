import { FONTS, stackFor } from './fonts'

/** A free text layer on the timeline. Position is the centre of the text in the 1920x1080 frame. */
export interface TextClip {
  id: number
  text: string
  /** seconds */
  start: number
  dur: number
  /** 0 = first text track (shown as Track 2) */
  track: number
  x: number
  y: number
  /** font size in px of the 1920x1080 frame */
  size: number
  font: string
  color: string
  bold: boolean
}

const isAr = (s: string) => /[؀-ۿ]/.test(s)
export const defaultFont = (s: string) => (isAr(s) ? 'amiri' : 'playfair-display')

let meas: CanvasRenderingContext2D | null = null
function mctx() {
  if (!meas) meas = document.createElement('canvas').getContext('2d')!
  return meas
}

function fontOf(k: TextClip) {
  const def = FONTS.find((f) => f.id === k.font) ?? FONTS.find((f) => f.id === defaultFont(k.text))!
  return stackFor(def, k.size, k.bold)
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Bounding box (top-left + size) of a clip in the 1920x1080 frame. */
export function boxOf(k: TextClip): Box {
  const c = mctx()
  c.font = fontOf(k)
  const lines = k.text.split('\n')
  let w = 0
  for (const l of lines) w = Math.max(w, c.measureText(l).width)
  const lh = k.size * 1.3
  const h = lh * lines.length
  const pad = k.size * 0.15
  return { x: k.x - w / 2 - pad, y: k.y - h / 2 - pad, w: w + pad * 2, h: h + pad * 2 }
}

const FADE = 0.4
export const alphaAt = (k: TextClip, t: number) => {
  if (t < k.start || t > k.start + k.dur) return 0
  const f = Math.min(FADE, k.dur / 2.5)
  return Math.max(0, Math.min(1, (t - k.start) / f, (k.start + k.dur - t) / f))
}
export const activeAt = (k: TextClip, t: number) => t >= k.start && t <= k.start + k.dur

export function drawTexts(c: CanvasRenderingContext2D, t: number, clips: TextClip[]) {
  // lower tracks first, so higher tracks sit on top
  const list = clips.filter((k) => k.text.trim() && activeAt(k, t)).sort((a, b) => a.track - b.track)
  for (const k of list) {
    const a = alphaAt(k, t)
    if (a <= 0) continue
    const lines = k.text.split('\n')
    const lh = k.size * 1.3
    c.save()
    c.globalAlpha = a
    c.font = fontOf(k)
    c.direction = isAr(k.text) ? 'rtl' : 'ltr'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.shadowColor = 'rgba(0,0,0,0.55)'
    c.shadowBlur = k.size * 0.12
    c.shadowOffsetY = k.size * 0.03
    c.fillStyle = k.color
    const y0 = k.y - (lh * (lines.length - 1)) / 2
    lines.forEach((l, i) => c.fillText(l, k.x, y0 + i * lh))
    c.restore()
  }
}
