import type { Palette } from './palettes'
import { rgba } from './palettes'
import { SPRITES } from './sprites'
import { clamp, easeOut, rng } from './util'

type C = CanvasRenderingContext2D
const W = 1920
const H = 1080

/** ---------- camera moves (applied to the photo card, so the photo is never cropped by the move) ---------- */
export type Cam =
  | 'push' | 'pull' | 'panR' | 'panL' | 'diagUp' | 'diagDown' | 'pedUp' | 'pedDown'
  | 'orbit' | 'orbitRev' | 'breathe' | 'roll' | 'punch' | 'weave' | 'detail' | 'rack' | 'step'

export interface Pose {
  s: number
  x: number
  y: number
  r: number
  /** 0..1 amount of "soft focus" blended over the photo */
  soft: number
}

/** u = progress through this photo's time on screen, 0..1 */
export function pose(k: Cam, u: number): Pose {
  const m = u - 0.5
  const p: Pose = { s: 1, x: 0, y: 0, r: 0, soft: 0 }
  switch (k) {
    case 'push': p.s = 1 + 0.1 * u; break
    case 'pull': p.s = 1.1 - 0.1 * u; break
    case 'panR': p.s = 1.04; p.x = m * 0.07; break
    case 'panL': p.s = 1.04; p.x = -m * 0.07; break
    case 'diagUp': p.s = 1.03 + 0.05 * u; p.x = m * 0.05; p.y = -m * 0.05; break
    case 'diagDown': p.s = 1.03 + 0.04 * u; p.x = -m * 0.05; p.y = m * 0.05; break
    case 'pedUp': p.s = 1.04; p.y = -m * 0.07; break
    case 'pedDown': p.s = 1.04; p.y = m * 0.07; break
    case 'orbit': p.s = 1.04 + 0.03 * Math.sin(u * Math.PI); p.x = Math.sin(m * Math.PI) * 0.045; p.r = m * 0.05; break
    case 'orbitRev': p.s = 1.04 + 0.03 * Math.sin(u * Math.PI); p.x = -Math.sin(m * Math.PI) * 0.045; p.r = -m * 0.05; break
    case 'breathe': p.s = 1.01 + 0.02 * Math.sin(u * Math.PI); break
    case 'roll': p.s = 1.03; p.r = m * 0.045; break
    case 'punch': p.s = 1 + 0.09 * easeOut(u * 3) + 0.03 * u; break
    case 'weave': p.s = 1.02 + 0.06 * u; p.x = Math.sin(u * Math.PI * 2) * 0.03; break
    case 'detail': p.s = 1.24 - 0.24 * easeOut(Math.min(1, u * 1.6)); p.y = 0.05 * (1 - easeOut(Math.min(1, u * 1.6))); break
    case 'rack': p.s = 1 + 0.04 * u; p.soft = 1 - easeOut(Math.min(1, u * 2.2)); break
    case 'step': p.s = 1 + 0.03 * Math.floor(u * 4); break
  }
  // exaggerate: on a small card the subtle moves were barely visible
  p.s = 1 + (p.s - 1) * 1.7
  p.x *= 2.2
  p.y *= 2.2
  p.r *= 2
  return p
}

/** ---------- light & mood effects, drawn over the whole frame ---------- */
export type Fx =
  | 'dust' | 'flare' | 'grain' | 'leaks' | 'vig' | 'dark' | 'bokeh' | 'rays' | 'mist' | 'bloom' | 'sparks'
  | 'grid' | 'pulse' | 'warm' | 'cool' | 'gold' | 'pastel' | 'orange' | 'green' | 'bright'

function dots(c: C, t: number, seed: number, n: number, col: string, size: [number, number], speed: number, rise = true) {
  const rand = rng(seed)
  c.fillStyle = col
  for (let i = 0; i < n; i++) {
    const x0 = rand() * W
    const y0 = rand() * H
    const s = size[0] + rand() * (size[1] - size[0])
    const sp = 0.4 + rand()
    const ph = rand() * 6.28
    const y = (((y0 + (rise ? -1 : 1) * t * speed * sp) % H) + H) % H
    const x = x0 + Math.sin(t * 0.5 * sp + ph) * 40
    c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * sp + ph))
    c.beginPath()
    c.arc(x, y, s, 0, 6.283)
    c.fill()
  }
  c.globalAlpha = 1
}

export function drawFx(c: C, fx: Fx, t: number, a: number, pal: Palette) {
  if (a < 0.01) return
  c.save()
  c.globalAlpha = a
  switch (fx) {
    case 'dust':
      c.globalCompositeOperation = 'lighter'
      dots(c, t, 11, 70, 'rgba(255,236,190,.55)', [1.2, 3.4], 14)
      break
    case 'sparks':
      c.globalCompositeOperation = 'lighter'
      dots(c, t, 23, 46, 'rgba(255,205,90,.8)', [1.5, 4], 34)
      break
    case 'bokeh': {
      c.globalCompositeOperation = 'lighter'
      const rand = rng(31)
      for (let i = 0; i < 18; i++) {
        const x = (rand() * W + t * (8 + rand() * 14)) % W
        const y = ((rand() * H - t * (6 + rand() * 12)) % H + H) % H
        const r = 30 + rand() * 80
        const g = c.createRadialGradient(x, y, 0, x, y, r)
        const col = [pal.frame, pal.hi, pal.soft][i % 3]
        g.addColorStop(0, rgba(col, 0.45))
        g.addColorStop(1, rgba(col, 0))
        c.fillStyle = g
        c.fillRect(x - r, y - r, r * 2, r * 2)
      }
      break
    }
    case 'flare': {
      c.globalCompositeOperation = 'lighter'
      const x = ((t * 55) % (W + 800)) - 400
      const g = c.createLinearGradient(x - 300, 0, x + 300, H)
      g.addColorStop(0, 'rgba(255,230,180,0)')
      g.addColorStop(0.5, 'rgba(255,230,180,0.38)')
      g.addColorStop(1, 'rgba(255,230,180,0)')
      c.fillStyle = g
      c.fillRect(0, 0, W, H)
      break
    }
    case 'leaks': {
      c.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 2; i++) {
        const x = i ? W : 0
        const y = H * (0.25 + 0.5 * Math.sin(t * 0.2 + i * 2) * 0.5 + 0.25)
        const g = c.createRadialGradient(x, y, 0, x, y, 700)
        g.addColorStop(0, 'rgba(255,140,50,0.35)')
        g.addColorStop(1, 'rgba(255,90,20,0)')
        c.fillStyle = g
        c.fillRect(0, 0, W, H)
      }
      break
    }
    case 'rays': {
      c.globalCompositeOperation = 'lighter'
      c.fillStyle = 'rgba(255,225,160,0.11)'
      for (let i = 0; i < 7; i++) {
        const an = -0.9 + i * 0.22 + Math.sin(t * 0.15 + i) * 0.05
        c.beginPath()
        c.moveTo(W * 0.85, -60)
        c.lineTo(W * 0.85 + Math.cos(Math.PI / 2 + an) * 1600 - 70, Math.sin(Math.PI / 2 + an) * 1600)
        c.lineTo(W * 0.85 + Math.cos(Math.PI / 2 + an) * 1600 + 70, Math.sin(Math.PI / 2 + an) * 1600)
        c.closePath()
        c.fill()
      }
      break
    }
    case 'mist':
      for (let i = 0; i < 4; i++) {
        const x = ((t * (10 + i * 5) + i * 600) % (W + 1200)) - 600
        const g = c.createRadialGradient(x, H * (0.3 + i * 0.2), 0, x, H * (0.3 + i * 0.2), 520)
        g.addColorStop(0, 'rgba(235,240,255,0.26)')
        g.addColorStop(1, 'rgba(235,240,255,0)')
        c.fillStyle = g
        c.fillRect(0, 0, W, H)
      }
      break
    case 'bloom': {
      const g = c.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(1, 'rgba(255,255,255,0.28)')
      c.fillStyle = g
      c.fillRect(0, 0, W, H)
      break
    }
    case 'grain': {
      const rand = rng(Math.floor(t * 12) + 5)
      for (let i = 0; i < 700; i++) {
        c.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'
        c.fillRect(rand() * W, rand() * H, 2.2, 2.2)
      }
      break
    }
    case 'grid':
      c.strokeStyle = rgba(pal.frame, 0.2)
      c.lineWidth = 1.5
      for (let x = (t * 12) % 120; x < W; x += 120) {
        c.beginPath()
        c.moveTo(x, 0)
        c.lineTo(x, H)
        c.stroke()
      }
      for (let y = 0; y < H; y += 120) {
        c.beginPath()
        c.moveTo(0, y)
        c.lineTo(W, y)
        c.stroke()
      }
      break
    case 'pulse': {
      const k = 0.5 + 0.5 * Math.sin(t * 1.6)
      const g = c.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1150)
      g.addColorStop(0, 'rgba(80,140,255,0)')
      g.addColorStop(1, `rgba(80,140,255,${0.14 + 0.16 * k})`)
      c.fillStyle = g
      c.fillRect(0, 0, W, H)
      break
    }
    case 'vig':
    case 'dark': {
      const g = c.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1180)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, `rgba(0,0,0,${fx === 'dark' ? 0.7 : 0.4})`)
      c.fillStyle = g
      c.fillRect(0, 0, W, H)
      break
    }
    default: {
      const T: Record<string, string> = {
        warm: 'rgba(255,170,80,.13)', cool: 'rgba(90,140,255,.13)', gold: 'rgba(255,200,80,.12)',
        pastel: 'rgba(255,190,220,.12)', orange: 'rgba(255,120,30,.15)', green: 'rgba(110,200,120,.1)', bright: 'rgba(255,255,255,.07)',
      }
      c.fillStyle = T[fx] ?? 'rgba(0,0,0,0)'
      c.fillRect(0, 0, W, H)
    }
  }
  c.restore()
}

/** drifting sparkles, handy as a decoration for "sparkle"-ish recipes */
export function sparkles(c: C, t: number, col: string) {
  const rand = rng(77)
  for (let i = 0; i < 20; i++) {
    const x = rand() * W
    const y = rand() * H
    const tw = clamp(Math.sin(t * (0.8 + rand()) + rand() * 6.28), 0, 1)
    c.save()
    c.translate(x, y)
    c.scale(8 + tw * 14, 8 + tw * 14)
    c.globalAlpha = tw * 0.8
    SPRITES.sparkle(c, col)
    c.restore()
  }
}

/** ---------- the 20 recipes: three phases, each a camera move plus effects ---------- */
export interface Recipe {
  id: string
  name: string
  phases: [Cam, Fx[]][]
  /** how one photo gives way to the next when the user keeps the default */
  trans: import('./types').Transition
}
export const RECIPES: Recipe[] = [
  { id: 'cinema', name: 'Classic Cinema', trans: 'fade', phases: [['push', ['dust', 'warm']], ['panR', ['flare']], ['pull', ['vig']]] },
  { id: 'nostalgic', name: 'Nostalgic Memory', trans: 'wipe', phases: [['panL', ['grain', 'warm']], ['diagUp', ['leaks']], ['roll', ['bloom']]] },
  { id: 'epic', name: 'Epic Ascent', trans: 'zoom', phases: [['pedUp', ['rays']], ['orbit', ['sparks']], ['punch', ['dark']]] },
  { id: 'serene', name: 'Serene', trans: 'fade', phases: [['breathe', ['mist']], ['panR', ['mist', 'bloom']], ['pull', ['cool']]] },
  { id: 'modern', name: 'Modern Dynamic', trans: 'slideX', phases: [['step', ['grid']], ['diagDown', ['pulse']], ['panL', ['bright']]] },
  { id: 'portrait', name: 'Studio Portrait', trans: 'flash', phases: [['rack', []], ['orbit', ['flare']], ['pedUp', ['bloom']]] },
  { id: 'explorer', name: "Explorer's Horizon", trans: 'slideX', phases: [['push', ['mist']], ['pedUp', ['rays']], ['panR', ['green', 'gold']]] },
  { id: 'romance', name: 'Dreamy Romance', trans: 'fade', phases: [['push', ['bokeh']], ['weave', ['pastel']], ['pull', ['bloom']]] },
  { id: 'mystery', name: 'Mystery', trans: 'blinds', phases: [['push', ['dark']], ['roll', ['cool', 'vig']], ['pull', ['mist']]] },
  { id: 'nature', name: 'Living Nature', trans: 'wipe', phases: [['panR', ['dust']], ['diagUp', ['rays']], ['pedDown', ['sparks']]] },
  { id: 'tech', name: 'Clean Tech', trans: 'slideY', phases: [['panR', ['grid']], ['push', ['pulse']], ['roll', ['bright']]] },
  { id: 'story', name: "Storyteller's Canvas", trans: 'wipe', phases: [['panR', ['grain']], ['detail', ['vig']], ['pull', ['warm']]] },
  { id: 'luxury', name: 'Luxury', trans: 'zoom', phases: [['push', ['sparks']], ['orbit', ['flare', 'gold']], ['pedUp', ['dark', 'gold']]] },
  { id: 'group', name: 'Vibrant Events', trans: 'slideX', phases: [['panR', ['bright']], ['weave', ['leaks']], ['pull', ['bright', 'warm']]] },
  { id: 'parallax', name: '2.5D Parallax', trans: 'slideY', phases: [['panR', ['dust']], ['push', ['dust', 'mist']], ['orbitRev', ['mist']]] },
  { id: 'sunset', name: 'Golden Sunset', trans: 'fade', phases: [['panR', ['rays', 'warm']], ['push', ['orange']], ['pedDown', ['vig', 'warm']]] },
  { id: 'dawn', name: 'Morning Mist', trans: 'zoom', phases: [['push', ['mist']], ['panR', ['sparks', 'cool']], ['pull', ['bright']]] },
  { id: 'drama', name: 'Dramatic Contrast', trans: 'flash', phases: [['punch', ['vig']], ['diagUp', ['mist', 'dark']], ['orbit', ['dark']]] },
  { id: 'minimal', name: 'Minimalist', trans: 'slideY', phases: [['panR', ['bright']], ['push', ['grid']], ['pull', ['vig']]] },
  { id: 'festive', name: 'Festive & Joyful', trans: 'spin', phases: [['push', ['bokeh']], ['orbit', ['sparks']], ['pull', ['bloom', 'warm']]] },
]
