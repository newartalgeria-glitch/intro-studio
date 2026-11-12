import type { FieldKey, FieldStyles, Pic, RenderCtx } from './types'
import { FONTS, stackFor } from './fonts'

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3)
export const easeInOut = (t: number) => {
  t = clamp(t)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
/** progress 0..1 of t inside the window [a, b] */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a))

export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const isArabic = (s: string) => /[؀-ۿ]/.test(s)

type Ctx = CanvasRenderingContext2D
type Spaced = Ctx & { letterSpacing?: string }

let active: FieldStyles = {}
export const setActiveStyles = (s: FieldStyles) => {
  active = s
}

export interface TextOpts {
  /** which data field this line shows, so user style overrides apply */
  f?: FieldKey
  font: (size: number) => string
  size: number
  fill: string | CanvasGradient
  align?: CanvasTextAlign
  /** shrink text so it never exceeds this width */
  maxW?: number
  /** letter spacing in px (ignored for Arabic, which must stay joined) */
  spacing?: number
}

/** Draws one line of text; returns the used font size. */
export function text(c: Ctx, s: string, x: number, y: number, o: TextOpts): number {
  if (!s) return o.size
  const st = o.f ? active[o.f] : undefined
  if (st) {
    x += st.dx ?? 0
    y += st.dy ?? 0
    const def = st.font ? FONTS.find((f) => f.id === st.font) : undefined
    o = {
      ...o,
      size: o.size * (st.scale ?? 1),
      fill: st.color || o.fill,
      font: def ? (sz: number) => stackFor(def, sz, !!st.bold) : o.font,
    }
  }
  const ar = isArabic(s)
  const cc = c as Spaced
  let size = o.size
  const sp = ar ? 0 : o.spacing ?? 0
  const set = () => {
    c.font = o.font(size)
    if ('letterSpacing' in cc) cc.letterSpacing = sp ? sp + 'px' : '0px'
  }
  c.direction = ar ? 'rtl' : 'ltr'
  c.textAlign = o.align ?? 'center'
  c.textBaseline = 'alphabetic'
  set()
  if (o.maxW) {
    const w = c.measureText(s).width
    if (w > o.maxW) {
      size = Math.floor((size * o.maxW) / w)
      set()
    }
  }
  c.fillStyle = o.fill
  c.fillText(s, x, y)
  if ('letterSpacing' in cc) cc.letterSpacing = '0px'
  return size
}

/** Draws a pic cropped to cover the rectangle. pan values are -1..1. */
export function cover(
  c: Ctx,
  pic: Pic,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1,
  px = 0,
  py = -0.3,
) {
  const s = Math.max(w / pic.w, h / pic.h) * zoom
  const sw = w / s
  const sh = h / s
  const sx = (pic.w - sw) / 2 + (px * (pic.w - sw)) / 2
  const sy = (pic.h - sh) / 2 + (py * (pic.h - sh)) / 2
  c.drawImage(pic.src, sx, sy, sw, sh, x, y, w, h)
}

/** Photo i, wrapping around the available photos. */
export const pic = (r: RenderCtx, i: number): Pic => r.pics[((i % r.pics.length) + r.pics.length) % r.pics.length]

/** Slideshow in a rectangle: Ken Burns on every photo, changing with the chosen transition. */
export function slideshow(
  c: Ctx,
  r: RenderCtx,
  t: number,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { each?: number; fade?: number; first?: number; start?: number; alpha?: number } = {},
) {
  const each = opts.each ?? 3
  const fade = opts.fade ?? 0.9
  const start = opts.start ?? 0
  const first = opts.first ?? 0
  const A = opts.alpha ?? 1
  const lt = Math.max(0, t - start)
  const i = Math.floor(lt / each)
  const local = lt - i * each
  const photo = (idx: number, l: number, a = 1) => {
    c.globalAlpha = A * a
    const p = clamp(l / (each + fade))
    const dir = idx % 2 === 0 ? 1 : -1
    cover(c, pic(r, idx + first), x, y, w, h, 1.04 + 0.08 * p, dir * (p - 0.5) * 0.6, -0.3)
  }
  c.save()
  c.beginPath()
  c.rect(x, y, w, h)
  c.clip()
  if (i > 0 && local < fade) {
    const p = local / fade
    const e = easeInOut(p)
    const prevL = local + each
    const kind = r.transition
    if (kind === 'fade') {
      photo(i - 1, prevL)
      photo(i, local, e)
    } else if (kind === 'slideX' || kind === 'slideY') {
      const hor = kind === 'slideX'
      c.save()
      c.translate(hor ? -e * w : 0, hor ? 0 : -e * h)
      photo(i - 1, prevL)
      c.restore()
      c.save()
      c.translate(hor ? (1 - e) * w : 0, hor ? 0 : (1 - e) * h)
      photo(i, local)
      c.restore()
    } else if (kind === 'zoom') {
      photo(i - 1, prevL)
      c.save()
      const s = 1.4 - 0.4 * e
      c.translate(x + w / 2, y + h / 2)
      c.scale(s, s)
      c.translate(-(x + w / 2), -(y + h / 2))
      photo(i, local, e)
      c.restore()
    } else if (kind === 'wipe') {
      photo(i - 1, prevL)
      c.save()
      c.beginPath()
      c.rect(x, y, w * e, h)
      c.clip()
      photo(i, local)
      c.restore()
    } else if (kind === 'blinds') {
      photo(i - 1, prevL)
      c.save()
      c.beginPath()
      const n = 8
      for (let k = 0; k < n; k++) c.rect(x + (k * w) / n, y, (w / n) * e, h)
      c.clip()
      photo(i, local)
      c.restore()
    } else if (kind === 'flash') {
      if (p < 0.5) photo(i - 1, prevL)
      else photo(i, local)
      c.globalAlpha = A * (1 - Math.abs(p - 0.5) * 2)
      c.fillStyle = '#fff'
      c.fillRect(x, y, w, h)
    } else {
      // spin
      photo(i - 1, prevL)
      c.save()
      c.translate(x + w / 2, y + h / 2)
      c.rotate((1 - e) * 0.14)
      const s = 1.18 - 0.18 * e
      c.scale(s, s)
      c.translate(-(x + w / 2), -(y + h / 2))
      photo(i, local, e)
      c.restore()
    }
  } else {
    photo(i, local + (i === 0 ? 0 : fade))
  }
  c.restore()
  c.globalAlpha = 1
}

/** Fade + rise reveal. Returns eased progress. */
export function reveal(c: Ctx, t: number, start: number, dur = 0.9, rise = 26) {
  const p = easeOut(seg(t, start, start + dur))
  c.globalAlpha = p
  c.translate(0, (1 - p) * rise)
  return p
}

export function reset(c: Ctx) {
  c.setLineDash([])
  c.globalAlpha = 1
  c.globalCompositeOperation = 'source-over'
  c.direction = 'ltr'
  c.textAlign = 'left'
  c.shadowBlur = 0
  c.shadowColor = 'transparent'
  const cc = c as Spaced
  if ('letterSpacing' in cc) cc.letterSpacing = '0px'
}

export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

export function cached(r: RenderCtx, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  let cv = r.cache.get(key)
  if (!cv) {
    cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    draw(cv.getContext('2d')!)
    r.cache.set(key, cv)
  }
  return cv
}

/** Templates draw two names; a single name (baby, birthday, graduate) takes the middle. */
export const hasTwo = (d: { name2: string }) => d.name2.trim().length > 0
