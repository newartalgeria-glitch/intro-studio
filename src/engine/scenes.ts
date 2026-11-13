import type { RenderCtx } from './types'
import type { Palette } from './palettes'
import { isLight, rgba } from './palettes'
import { SPRITES } from './sprites'
import type { SpriteId } from './sprites'
import { rng } from './util'

export type Base = 'grad' | 'radial' | 'stripes' | 'diamonds' | 'rays' | 'bands'
export type Pattern = 'rain' | 'rise' | 'corners' | 'border' | 'scatter' | 'orbit' | 'sides' | 'wave'

export interface Scene {
  base: Base
  pattern: Pattern
  sprites: SpriteId[]
  seed: number
}

const W = 1920
const H = 1080

function drawBase(c: CanvasRenderingContext2D, t: number, base: Base, pal: Palette) {
  const lg = c.createLinearGradient(0, 0, W, H)
  lg.addColorStop(0, pal.bg0)
  lg.addColorStop(1, pal.bg1)
  if (base === 'radial') {
    const g = c.createRadialGradient(W * 0.5, H * 0.45, 80, W * 0.5, H * 0.5, 1250)
    g.addColorStop(0, pal.bg0)
    g.addColorStop(1, pal.bg1)
    c.fillStyle = g
  } else c.fillStyle = lg
  c.fillRect(0, 0, W, H)
  const line = rgba(pal.frame, 0.1)
  if (base === 'stripes') {
    c.fillStyle = line
    for (let x = 0; x < W; x += 96) c.fillRect(x, 0, 36, H)
  } else if (base === 'diamonds') {
    c.strokeStyle = rgba(pal.frame, 0.16)
    c.lineWidth = 2
    const s = 110
    for (let y = -s; y < H + s; y += s)
      for (let x = -s; x < W + s; x += s) {
        c.beginPath()
        c.moveTo(x, y - s / 2)
        c.lineTo(x + s / 2, y)
        c.lineTo(x, y + s / 2)
        c.lineTo(x - s / 2, y)
        c.closePath()
        c.stroke()
      }
  } else if (base === 'rays') {
    c.fillStyle = rgba(pal.frame, 0.09)
    const n = 18
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2 + t * 0.02
      const a1 = ((i + 1) / n) * Math.PI * 2 + t * 0.02
      c.beginPath()
      c.moveTo(W / 2, H / 2)
      c.arc(W / 2, H / 2, 1600, a0, a1)
      c.closePath()
      c.fill()
    }
  } else if (base === 'bands') {
    for (let k = 0; k < 3; k++) {
      c.fillStyle = rgba(pal.frame, 0.1 + k * 0.06)
      c.beginPath()
      c.moveTo(0, H)
      for (let x = 0; x <= W; x += 40) c.lineTo(x, H - 150 + k * 55 + Math.sin(x / 190 + t * 0.5 + k * 1.7) * (26 - k * 5))
      c.lineTo(W, H)
      c.closePath()
      c.fill()
    }
  }
  // soft vignette keeps the centre calm
  const v = c.createRadialGradient(W / 2, H / 2, 420, W / 2, H / 2, 1250)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, isLight(pal.bg0) ? 'rgba(80,60,40,0.13)' : 'rgba(0,0,0,0.4)')
  c.fillStyle = v
  c.fillRect(0, 0, W, H)
}

interface Item {
  x: number
  y: number
  s: number
  rot: number
  k: number
  a: number
}

/** Fixed-per-seed layout of motifs, moved by the pattern's own motion each frame. */
function place(p: Pattern, i: number, n: number, rand: () => number, t: number): Item {
  const ph = rand() * 6.283
  const sp = 0.4 + rand() * 0.9
  const k = Math.floor(rand() * 9)
  const r1 = rand()
  const r2 = rand()
  switch (p) {
    case 'rain':
    case 'rise': {
      const dir = p === 'rain' ? 1 : -1
      const s = 22 + r2 * 36
      const y = (((r1 * (H + 240) + dir * t * (24 + sp * 38)) % (H + 240)) + H + 240) % (H + 240) - 120
      return { x: rand() * W + Math.sin(t * 0.7 * sp + ph) * 34, y, s, rot: Math.sin(t * 0.6 + ph) * 0.9 + ph, k, a: 0.45 + r2 * 0.4 }
    }
    case 'corners': {
      const cn = i % 4
      const bx = cn % 2 ? W : 0
      const by = cn > 1 ? H : 0
      const d = Math.pow(r1, 1.4) * 430
      const an = r2 * Math.PI * 0.5
      const x = bx + (cn % 2 ? -1 : 1) * Math.cos(an) * d
      const y = by + (cn > 1 ? -1 : 1) * Math.sin(an) * d
      const s = 120 - (d / 430) * 80 + 14
      return { x: x + Math.sin(t * 0.5 * sp + ph) * 12, y: y + Math.cos(t * 0.45 * sp + ph) * 10, s, rot: (rand() - 0.5) * 3 + Math.sin(t * 0.4 + ph) * 0.15, k, a: 0.85 }
    }
    case 'border': {
      const u = (i / n + 0.003 * t * 0) % 1
      const per = 2 * (W + H - 120)
      let d = u * per
      let x = 60
      let y = 60
      if (d < W - 120) x = 60 + d
      else if ((d -= W - 120) < H - 120) (x = W - 60), (y = 60 + d)
      else if ((d -= H - 120) < W - 120) (x = W - 60 - d), (y = H - 60)
      else (y = H - 60 - (d - (W - 120)))
      return { x, y: y + Math.sin(t * sp + ph) * 7, s: 44 + r2 * 22 + Math.sin(t * sp + ph) * 4, rot: ph + t * 0.1 * (r1 - 0.5), k, a: 0.85 }
    }
    case 'orbit': {
      const an = (i / n) * 6.283 + t * 0.05 * (0.5 + sp * 0.5)
      return { x: W / 2 + Math.cos(an) * 930, y: H / 2 + Math.sin(an) * 500, s: 40 + r2 * 40, rot: an + 1.57, k, a: 0.8 }
    }
    case 'sides': {
      const left = i % 2 === 0
      const row = Math.floor(i / 2) / Math.ceil(n / 2)
      const x = (left ? 90 : W - 90) + (r1 - 0.5) * 120 + Math.sin(t * 0.6 * sp + ph) * 18
      const y = (((row * (H + 160) + t * 14 * (left ? 1 : -1)) % (H + 160)) + H + 160) % (H + 160) - 80
      return { x, y, s: 56 + r2 * 54, rot: (left ? -1 : 1) * 0.5 + Math.sin(t * 0.5 + ph) * 0.25, k, a: 0.85 }
    }
    case 'wave': {
      const row = i % 3
      const x = (((i / n) * W + t * (22 + row * 14)) % (W + 160)) - 80
      return { x, y: 110 + row * 380 + Math.sin(x / 210 + ph) * 56, s: 34 + r2 * 34, rot: Math.sin(x / 150) * 0.6, k, a: 0.7 }
    }
    default: {
      // scatter: stay put, twinkle
      const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + sp) + ph)
      return { x: r1 * W, y: r2 * H, s: (18 + rand() * 44) * (0.7 + 0.5 * tw), rot: ph, k, a: 0.25 + 0.65 * tw }
    }
  }
}

const COUNT: Record<Pattern, number> = { rain: 26, rise: 26, corners: 36, border: 38, scatter: 54, orbit: 18, sides: 16, wave: 21 }

export function drawScene(c: CanvasRenderingContext2D, t: number, _r: RenderCtx, sc: Scene, pal: Palette) {
  drawBase(c, t, sc.base, pal)
  const light = isLight(pal.bg0)
  const cols = light ? [pal.frame, pal.name, pal.soft] : [pal.frame, pal.hi, pal.soft]
  const rand = rng(sc.seed * 977 + 13)
  const n = COUNT[sc.pattern]
  for (let i = 0; i < n; i++) {
    const it = place(sc.pattern, i, n, rand, t)
    const id = sc.sprites[it.k % sc.sprites.length]
    const a = cols[(it.k >> 1) % cols.length]
    const b = cols[(it.k + 1) % cols.length]
    c.save()
    c.translate(it.x, it.y)
    c.rotate(it.rot)
    c.scale(it.s, it.s)
    c.globalAlpha = it.a
    SPRITES[id](c, a, b)
    c.restore()
  }
  c.globalAlpha = 1
}
