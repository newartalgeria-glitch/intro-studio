import type { Motion, OverlayItem, Pic, RenderCtx, Shape } from './types'
import { easeOut, rng, seg } from './util'

type C2 = CanvasRenderingContext2D

export const SHAPES: Shape[] = ['star', 'sparkle', 'heart', 'bokeh', 'snow', 'petal', 'diamond', 'leaf', 'ring', 'confetti']
export const MOTIONS: Motion[] = ['fall', 'rise', 'twinkle', 'drift', 'burst']

const PALETTE: Record<Shape, string[]> = {
  star: ['#f6d878', '#ffe9a8', '#e8b94a'],
  sparkle: ['#ffffff', '#fff2c2', '#f3d98b'],
  heart: ['#ff7b9c', '#ff4d79', '#ffc2d1'],
  bokeh: ['#ffe6b0', '#ffd27a', '#fff6e0'],
  snow: ['#ffffff', '#d8ecff', '#bfdcff'],
  petal: ['#ffc7d6', '#ffe3ea', '#ff9fb8'],
  diamond: ['#e3f1ff', '#b9d9ff', '#ffffff'],
  leaf: ['#8fc77a', '#c9d98a', '#e0c36a'],
  ring: ['#f0cf7a', '#fff1c4', '#d9b04c'],
  confetti: ['#ff6b8b', '#ffd166', '#5ad1c4', '#7aa7ff', '#c88bff'],
}

export interface Preset {
  id: string
  shape: Shape
  motion: Motion
}
export const PRESETS: Preset[] = SHAPES.flatMap((shape) => MOTIONS.map((motion) => ({ id: `${shape}-${motion}`, shape, motion })))

const sprites = new Map<string, HTMLCanvasElement>()

function sprite(shape: Shape, color: string) {
  const key = shape + color
  let cv = sprites.get(key)
  if (cv) return cv
  cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const x = cv.getContext('2d')!
  x.translate(64, 64)
  x.fillStyle = color
  x.strokeStyle = color
  x.shadowColor = color
  x.shadowBlur = 10
  x.lineJoin = 'round'
  x.lineCap = 'round'
  switch (shape) {
    case 'star':
    case 'sparkle': {
      const pts = shape === 'star' ? 5 : 4
      const outer = shape === 'star' ? 48 : 54
      const inner = shape === 'star' ? 21 : 9
      x.beginPath()
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 ? inner : outer
        const a = (Math.PI * i) / pts - Math.PI / 2
        x.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      x.closePath()
      x.fill()
      break
    }
    case 'heart':
      x.beginPath()
      x.moveTo(0, 38)
      x.bezierCurveTo(-60, -2, -40, -46, -4, -26)
      x.bezierCurveTo(-1, -24, 0, -22, 0, -20)
      x.bezierCurveTo(0, -22, 1, -24, 4, -26)
      x.bezierCurveTo(40, -46, 60, -2, 0, 38)
      x.fill()
      break
    case 'bokeh': {
      x.shadowBlur = 0
      const g = x.createRadialGradient(0, 0, 4, 0, 0, 56)
      g.addColorStop(0, color + '55')
      g.addColorStop(0.8, color + '88')
      g.addColorStop(1, color + '00')
      x.fillStyle = g
      x.beginPath()
      x.arc(0, 0, 56, 0, 6.3)
      x.fill()
      x.strokeStyle = color + 'aa'
      x.lineWidth = 2
      x.beginPath()
      x.arc(0, 0, 46, 0, 6.3)
      x.stroke()
      break
    }
    case 'snow':
      x.lineWidth = 6
      for (let i = 0; i < 3; i++) {
        x.save()
        x.rotate((i * Math.PI) / 3)
        x.beginPath()
        x.moveTo(0, -48)
        x.lineTo(0, 48)
        x.moveTo(-14, -34)
        x.lineTo(0, -22)
        x.lineTo(14, -34)
        x.moveTo(-14, 34)
        x.lineTo(0, 22)
        x.lineTo(14, 34)
        x.stroke()
        x.restore()
      }
      break
    case 'petal':
      x.beginPath()
      x.moveTo(0, -52)
      x.quadraticCurveTo(42, -8, 0, 52)
      x.quadraticCurveTo(-42, -8, 0, -52)
      x.fill()
      break
    case 'diamond':
      x.beginPath()
      x.moveTo(0, -54)
      x.lineTo(34, 0)
      x.lineTo(0, 54)
      x.lineTo(-34, 0)
      x.closePath()
      x.fill()
      x.shadowBlur = 0
      x.strokeStyle = '#ffffff99'
      x.lineWidth = 3
      x.beginPath()
      x.moveTo(-34, 0)
      x.lineTo(34, 0)
      x.moveTo(0, -54)
      x.lineTo(0, 54)
      x.stroke()
      break
    case 'leaf':
      x.beginPath()
      x.moveTo(0, -54)
      x.bezierCurveTo(54, -22, 40, 32, 0, 54)
      x.bezierCurveTo(-40, 32, -54, -22, 0, -54)
      x.fill()
      x.shadowBlur = 0
      x.strokeStyle = 'rgba(0,0,0,0.25)'
      x.lineWidth = 3
      x.beginPath()
      x.moveTo(0, -46)
      x.lineTo(0, 50)
      x.stroke()
      break
    case 'ring':
      x.lineWidth = 9
      x.beginPath()
      x.arc(0, 0, 40, 0, 6.3)
      x.stroke()
      break
    case 'confetti':
      x.shadowBlur = 0
      x.fillRect(-36, -14, 72, 28)
      break
  }
  sprites.set(key, cv)
  return cv
}

const BASE_COUNT: Record<Motion, number> = { fall: 38, rise: 34, twinkle: 34, drift: 26, burst: 44 }

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

interface Opts {
  W: number
  H: number
  opacity: number
  scale: number
  countMul?: number
}

/** One overlay layer. Deterministic in (t, seed): same frame, same pixels. */
function layer(c: C2, t: number, motion: Motion, seed: number, o: Opts, pick: (f: number) => { src: CanvasImageSource; w: number; h: number }, big: boolean) {
  const { W, H } = o
  const k = W / 1920
  const n = Math.round(BASE_COUNT[motion] * (o.countMul ?? 1))
  const fadeIn = easeOut(seg(t, 0, 0.8))
  for (let i = 0; i < n; i++) {
    const r = rng(seed * 131 + i * 977 + 13)
    const a = r(), b = r(), cc = r(), d = r(), e = r(), f = r()
    const base = (big ? 40 + e * 90 : 20 + e * 36) * o.scale * k
    const m = base * 1.2
    let x = 0, y = 0, alpha = 1, s = base
    const spin = (d - 0.5) * 2
    let rot = d * 6.28 + t * spin * 0.6
    if (motion === 'fall' || motion === 'rise') {
      const sp = (55 + b * 110) * k
      const span = H + 2 * m
      const p = (a * span + sp * t) % span
      y = motion === 'fall' ? p - m : H + m - p
      x = cc * W + Math.sin(t * 0.7 + d * 6.28) * 45 * k
      alpha = 0.92
    } else if (motion === 'twinkle') {
      x = cc * W
      y = a * H
      const v = 0.5 + 0.5 * Math.sin(t * (1 + b * 2.4) + d * 6.28)
      alpha = v * v
      s = base * (0.6 + 0.6 * v)
      rot = d * 1.2
    } else if (motion === 'drift') {
      const sp = (22 + b * 40) * k
      const span = W + 2 * m
      x = ((cc * span + sp * t) % span) - m
      y = a * H + Math.sin(t * 0.5 + d * 6.28) * 60 * k
      alpha = 0.55 + 0.35 * Math.sin(t * 0.9 + a * 6.28)
    } else {
      const period = 2.8 + b * 1.6
      const u = (t / period + d) % 1
      const tau = u * 2.3
      x = W / 2 + (cc - 0.5) * 1150 * k * tau * 0.6
      y = H + 40 * k - (480 + a * 640) * k * tau + 420 * k * tau * tau
      alpha = Math.pow(1 - u, 1.1)
      s = base * (1 - 0.4 * u)
    }
    const im = pick(f)
    const w = s
    const h = (s * im.h) / im.w
    c.globalAlpha = Math.max(0, Math.min(1, alpha * fadeIn * o.opacity))
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.drawImage(im.src, -w / 2, -h / 2, w, h)
    c.restore()
  }
}

export function drawPreset(c: C2, t: number, p: Preset, o: Opts, seed = 1) {
  const colors = PALETTE[p.shape]
  const pick = (f: number) => ({ src: sprite(p.shape, colors[Math.floor(f * colors.length) % colors.length]), w: 1, h: 1 })
  layer(c, t, p.motion, hash(p.id) + seed, o, pick, p.shape === 'bokeh')
  c.globalAlpha = 1
}

export function drawOverlays(c: C2, t: number, rc: RenderCtx) {
  const o = { W: rc.W, H: rc.H }
  for (const it of rc.overlays) drawItem(c, t, it, o, rc.customs)
}

function drawItem(c: C2, t: number, it: OverlayItem, o: { W: number; H: number }, customs: Record<number, Pic>) {
  const opts = { ...o, opacity: it.opacity, scale: it.scale }
  if (it.custom !== undefined) {
    const im = customs[it.custom]
    if (!im) return
    if (it.motion === 'frame') {
      c.globalAlpha = it.opacity * easeOut(seg(t, 0, 0.8))
      c.drawImage(im.src, 0, 0, o.W, o.H)
      c.globalAlpha = 1
      return
    }
    layer(c, t, (it.motion as Motion) ?? 'drift', 7 + it.uid, opts, () => im, false)
    c.globalAlpha = 1
    return
  }
  const p = PRESETS.find((x) => x.id === it.preset)
  if (p) drawPreset(c, t, p, opts, it.uid)
}
