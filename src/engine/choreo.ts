import { clamp, easeInOut, easeOut, seg } from './util'

/** Multi-photo scenes: several photos are on screen together, fly in, meet, take turns in the spotlight and leave. */
export type Kind = 'scatter' | 'marquee' | 'deck' | 'flow' | 'orbit' | 'wall'
export const KINDS: Kind[] = ['scatter', 'marquee', 'deck', 'flow', 'orbit', 'wall']
export const KIND_K: Record<Kind, number> = { scatter: 4, marquee: 6, deck: 5, flow: 6, orbit: 5, wall: 6 }
export const isKind = (s: string): s is Kind => s in KIND_K

export interface Beat {
  idx: number[]
  s: number[]
  e: number[]
}

/** Cut the photo clips into groups; a group is one choreography. */
export function beatsOf(durs: number[], k: number): Beat[] {
  const out: Beat[] = []
  let t = 0
  for (let i = 0; i < durs.length; i += k) {
    const b: Beat = { idx: [], s: [], e: [] }
    for (let j = i; j < Math.min(durs.length, i + k); j++) {
      b.idx.push(j)
      b.s.push(t)
      t += durs[j]
      b.e.push(t)
    }
    out.push(b)
  }
  // a lonely last photo joins the previous group's rhythm instead of getting a scene alone
  return out
}

export interface CardOpts {
  rot?: number
  alpha?: number
  s?: number
  sx?: number
}
export type CardFn = (idx: number, x: number, y: number, w: number, h: number, o?: CardOpts) => void

const eo = easeOut
const ei = easeInOut
const dirOf = (x: number, y: number) => {
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

/** Draws one group centred on (0,0). */
export function drawChoreo(kind: Kind, t: number, b: Beat, card: CardFn) {
  const n = b.idx.length
  const t0 = b.s[0]
  const t1 = b.e[n - 1]
  const enter = (j: number) => eo(seg(t, t0 - 1.3 + 0.22 * j, t0 + 0.4 + 0.22 * j))
  const leave = (j: number) => ei(seg(t, t1 - 0.2 + 0.1 * j, t1 + 1.3 + 0.1 * j))
  const fw = (j: number) => ei(seg(t, b.s[j] - 0.2, b.s[j] + 0.8)) * (1 - ei(seg(t, b.e[j] - 0.8, b.e[j] + 0.1)))
  const fmax = Math.max(...b.idx.map((_, j) => fw(j)))
  let jf = n - 1
  for (let j = 0; j < n; j++) if (t < b.e[j]) { jf = j; break }

  switch (kind) {
    case 'scatter': {
      const POS = [[-560, -190, -0.13], [560, -210, 0.11], [-470, 250, 0.09], [580, 230, -0.1], [0, -330, 0.05]]
      const order = b.idx.map((_, j) => j).sort((x, y) => fw(x) - fw(y))
      for (const j of order) {
        const [px, py, pr] = POS[j % POS.length]
        const [dx, dy] = dirOf(px, py + 1)
        const en = enter(j)
        const lv = leave(j)
        const f = fw(j)
        const away = (1 - en) * 1600 + lv * 1600
        const bob = Math.sin(t * 0.7 + j * 1.7) * 12
        const x = px * (1 - f) + dx * away
        const y = (py + bob) * (1 - f) + dy * away
        card(b.idx[j], x, y, 600 + 700 * f, 440 + 420 * f, { rot: (pr + (1 - en) * 0.9 * (j % 2 ? 1 : -1) + lv * 0.8) * (1 - f), alpha: 1 - 0.45 * fmax * (1 - f) })
      }
      break
    }
    case 'marquee': {
      const rows = [[-330, 40], [0, -55], [330, 45]]
      const ni = 8
      const per = ni * 480
      rows.forEach(([y, sp], r) => {
        const en = eo(seg(t, t0 - 1.3 + r * 0.2, t0 + 0.6 + r * 0.2)) * (1 - leave(r))
        for (let i = 0; i < ni; i++) {
          const x = ((((i * 480 + t * sp) % per) + per) % per) - per / 2
          card(b.idx[(i + r * 2) % n], x, y + (1 - en) * (r - 1 || 1) * 700, 420, 300, { alpha: en * (1 - 0.55 * fmax), rot: (r - 1) * 0.03 })
        }
      })
      for (let j = 0; j < n; j++) {
        const f = fw(j)
        if (f > 0.01) card(b.idx[j], 0, 0, 1250, 800, { s: 0.82 + 0.18 * f, alpha: f, rot: (1 - f) * 0.08 * (j % 2 ? 1 : -1) })
      }
      break
    }
    case 'deck': {
      for (let j = n - 1; j >= 0; j--) {
        const en = enter(n - 1 - j)
        const fo = ei(seg(t, b.e[j] - 0.9, b.e[j] + 0.05))
        if (fo >= 1 && j < n - 1) continue
        const dir = j % 2 ? -1 : 1
        const rest = ((j * 37) % 11 - 5) * 0.012
        const above = Math.max(0, j - jf)
        const lv = j === n - 1 ? 0 : leave(j) * 0
        card(b.idx[j], dir * fo * 2300 + ((j * 53) % 9 - 4) * 10, (1 - en) * -1400 - fo * 200 + lv, 1100, 740, {
          rot: rest + dir * fo * 0.7,
          s: 1 - 0.03 * Math.min(3, above),
          alpha: 1 - 0.2 * Math.min(3, above) * 0,
        })
      }
      break
    }
    case 'flow': {
      const step = ei(seg(t, b.e[jf] - 0.9, b.e[jf]))
      const fpos = jf + (jf < n - 1 ? step : 0) - (1 - enter(0)) * 3 + leave(0) * 3
      const order = b.idx.map((_, j) => j).sort((x, y) => Math.abs(y - fpos) - Math.abs(x - fpos))
      for (const j of order) {
        const d = j - fpos
        const ad = Math.abs(d)
        if (ad > 3.4) continue
        const sc = 1.35 - 0.63 * clamp(ad * 0.8)
        card(b.idx[j], d * 560, Math.sin(t * 0.7 + j) * 10 + ad * 14, 640, 480, { s: sc, sx: Math.cos(clamp(d, -1.4, 1.4) * 0.5), alpha: 1 - 0.18 * Math.min(3, ad) })
      }
      break
    }
    case 'orbit': {
      const rad = 820 + (1 - enter(0)) * 1300 + leave(0) * 1300
      const items = b.idx.map((_, j) => {
        const a = (j / n) * 6.2832 + t * 0.3
        const sn = Math.sin(a)
        const f = fw(j)
        return { j, f, ox: Math.cos(a) * rad, oy: sn * 330 + 60, sn }
      })
      items.sort((p, q) => (p.f < 0.5 && q.f < 0.5 ? p.sn - q.sn : p.f - q.f))
      for (const it of items) {
        const sc = 0.78 + 0.22 * it.sn
        card(b.idx[it.j], it.ox * (1 - it.f), it.oy * (1 - it.f), 400 + 700 * it.f, 300 + 440 * it.f, { s: sc + (1 - sc) * it.f, alpha: 0.9 - 0.25 * (1 - it.f) * (1 - it.sn) / 2 })
      }
      break
    }
    case 'wall': {
      const cell = (j: number) => [((j % 3) - 1) * 640, (Math.floor(j / 3) - 0.5) * 470]
      const a = cell(jf)
      const nx = cell(Math.min(n - 1, jf + 1))
      const tr = jf < n - 1 ? ei(seg(t, b.e[jf] - 1.1, b.e[jf])) : 0
      let cx = a[0] + (nx[0] - a[0]) * tr
      let cy = a[1] + (nx[1] - a[1]) * tr
      let s = 1.85 - 0.5 * Math.sin(Math.PI * tr)
      const wide = 1 - ei(seg(t, t0 - 0.2, t0 + 1.4)) * (1 - ei(seg(t, t1 - 1.0, t1 + 0.2)))
      cx *= 1 - wide
      cy *= 1 - wide
      s = s * (1 - wide) + 0.9 * wide
      c2(card, n, b, s, cx, cy, enter, leave)
      break
    }
  }
}

function c2(card: CardFn, n: number, b: Beat, s: number, cx: number, cy: number, enter: (j: number) => number, leave: (j: number) => number) {
  // the wall is drawn by scaling every card's position and size around the camera
  for (let j = 0; j < n; j++) {
    const x = (((j % 3) - 1) * 640 - cx) * s
    const y = ((Math.floor(j / 3) - 0.5) * 470 - cy) * s
    const en = enter(j)
    card(b.idx[j], x, y, 600 * s, 440 * s, { s: 0.4 + 0.6 * en, alpha: en * (1 - leave(j)) })
  }
}
