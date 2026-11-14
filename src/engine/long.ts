import type { FieldKey, RenderCtx, Template, Wins } from './types'
import type { Palette } from './palettes'
import { fontOf, rgba } from './palettes'
import type { Scene } from './scenes'
import { drawScene } from './scenes'
import { drawFx, pose } from './motion'
import type { Recipe } from './motion'
import { beatsOf, drawChoreo, isKind, KIND_K } from './choreo'
import type { Kind } from './choreo'
import { cached, clamp, easeInOut, gate, hasTwo, lerp, pic, seg, slideshow, text } from './util'

const W = 1920
const H = 1080
const ei2 = (x: number) => Math.min(1, Math.max(0, x))

export type Side = 'L' | 'R' | 'T'
export type Layout = 'card' | 'collage' | 'studio' | Kind
export type CardStyle = 'plain' | 'polaroid' | 'gold' | 'round'

export interface Design {
  occ: string
  num: number
  scene: Scene
  layout: Layout
  /** 'blur' = the photo itself, enlarged and blurred, as background; 'palette' = occasion background */
  bg: 'blur' | 'palette'
  card: CardStyle
  side: Side
  recipe: Recipe
  sec: number
  pal: Palette
}

interface R4 {
  x: number
  y: number
  w: number
  h: number
}
const FULL: Record<string, R4> = {
  card: { x: 200, y: 90, w: 1520, h: 900 },
  collage: { x: 560, y: 70, w: 800, h: 940 },
  studio: { x: 260, y: 50, w: 1400, h: 780 },
  choreo: { x: 0, y: 0, w: 1920, h: 1080 },
}
const SIDE: Record<Side, R4> = {
  R: { x: 1010, y: 150, w: 810, h: 780 },
  L: { x: 100, y: 150, w: 810, h: 780 },
  T: { x: 460, y: 330, w: 1000, h: 520 },
}

export const MIN_LEN = 14
export const DEFAULT_PHOTO_SEC = 6

const total = (r: RenderCtx) => Math.max(MIN_LEN, r.durs.reduce((a, b) => a + b, 0) + 2)

const WIN: Record<FieldKey, [number, number]> = {
  headline: [1, 11],
  name1: [2, 12],
  connector: [2.6, 12],
  name2: [3.2, 12],
  date: [5, 12],
  place: [6, 12],
  footer: [7, 12],
}

export function makeLong(d: Design): Template {
  const { pal, side } = d
  const fnt = fontOf(pal)
  const bgc = pal.bg1
  return {
    id: `${d.occ}:${d.num}`,
    occasion: d.occ,
    layout: d.layout,
    variant: d.num,
    swatch: [pal.bg0, pal.frame, pal.name],
    kind: 'long',
    num: d.num,
    sec: d.sec,
    tag: d.recipe.name,
    defaultWin: (r): Wins => {
      const T = total(r)
      const o = {} as Wins
      for (const k of Object.keys(WIN) as FieldKey[]) o[k] = [WIN[k][0], Math.min(WIN[k][1], T)]
      return o
    },
    duration: total,
    render(c, t, r) {
      const dat = r.data
      const T = total(r)
      const starts: number[] = []
      r.durs.reduce((a, b) => (starts.push(a), a + b), 0)

      // how much "title" is on screen right now -> the photo card glides between its two places
      let f = 0
      for (const k of Object.keys(r.win) as FieldKey[]) {
        const [s, e] = r.win[k]
        if (!dat[k]) continue
        const g = s <= 1.5 ? gate([-5, e], t) : gate([s - 0.7, e], t)
        f = Math.max(f, g)
      }
      const e = easeInOut(f)
      const a = FULL[isKind(d.layout) ? 'choreo' : d.layout]
      const b = SIDE[side]
      const box = { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e) }

      const blur = (idx: number) =>
        cached(r, `bl${idx % r.pics.length}`, 48, 27, (x) => {
          x.imageSmoothingQuality = 'high'
          const p = pic(r, idx)
          const s = Math.max(48 / p.w, 27 / p.h)
          x.drawImage(p.src, (48 - p.w * s) / 2, (27 - p.h * s) / 2, p.w * s, p.h * s)
        })

      const drawCard = (idx: number, cx: number, cy: number, maxW: number, maxH: number, ps: ReturnType<typeof pose>, alpha = 1, rot = 0, sx = 1) => {
        const p = pic(r, idx)
        const k = Math.min(maxW / p.w, maxH / p.h)
        const cw = p.w * k
        const ch = p.h * k
        c.save()
        c.globalAlpha *= alpha
        c.translate(cx + ps.x * cw, cy + ps.y * ch)
        c.rotate(ps.r + rot)
        c.scale(ps.s * sx, ps.s)
        const x = -cw / 2
        const y = -ch / 2
        c.shadowColor = 'rgba(0,0,0,0.55)'
        c.shadowBlur = 44
        c.shadowOffsetY = 16
        if (d.card === 'polaroid') {
          c.fillStyle = pal.paper
          c.fillRect(x - 24, y - 24, cw + 48, ch + 78)
        } else if (d.card === 'round') {
          c.fillStyle = '#000'
          c.beginPath()
          c.roundRect(x, y, cw, ch, 30)
          c.fill()
        } else {
          c.fillStyle = '#000'
          c.fillRect(x, y, cw, ch)
        }
        c.shadowColor = 'transparent'
        c.save()
        if (d.card === 'round') {
          c.beginPath()
          c.roundRect(x, y, cw, ch, 30)
          c.clip()
        }
        c.drawImage(p.src, x, y, cw, ch)
        if (ps.soft > 0.02) {
          c.globalAlpha *= ps.soft
          c.drawImage(blur(idx), x, y, cw, ch)
        }
        c.restore()
        if (d.card === 'gold') {
          c.strokeStyle = pal.frame
          c.lineWidth = 7
          c.strokeRect(x, y, cw, ch)
          c.strokeStyle = rgba(pal.frame, 0.55)
          c.lineWidth = 2
          c.strokeRect(x - 20, y - 20, cw + 40, ch + 40)
        } else if (d.card === 'plain') {
          c.strokeStyle = 'rgba(255,255,255,0.85)'
          c.lineWidth = 5
          c.strokeRect(x, y, cw, ch)
        }
        c.restore()
        return { cw, ch }
      }

      const paint = (idx: number, l: number, dur: number) => {
        const p = pic(r, idx)
        const start = starts[idx] ?? 0
        const phase = Math.min(2, Math.floor((3 * start) / T))
        const u = clamp(l / (dur + 1.2))
        const ps = pose(d.recipe.phases[phase][0], u)
        // ---- background ----
        if (d.bg === 'blur') {
          c.save()
          c.translate(W / 2 - ps.x * 900, H / 2 - ps.y * 500)
          c.scale(1.3 + 0.08 * u, 1.3 + 0.08 * u)
          c.imageSmoothingQuality = 'high'
          c.drawImage(blur(idx), -W / 2, -H / 2, W, H)
          c.restore()
          c.fillStyle = rgba(bgc, 0.5)
          c.fillRect(0, 0, W, H)
          drawScene(c, t, r, d.scene, pal, true)
        } else drawScene(c, t, r, d.scene, pal)
        // ---- card(s) ----
        const cx = box.x + box.w / 2
        const cy = box.y + box.h / 2
        if (d.layout === 'collage' && e < 0.95) {
          const side2 = (dir: number, k: number) => {
            const q = pic(r, idx + dir)
            const kk = Math.min(420 / q.w, 560 / q.h)
            const nw = q.w * kk
            const bob = Math.sin(t * 0.6 + dir) * 14
            drawCard(idx + dir, cx + dir * (box.w * 0.5 + nw * 0.5 + 40 + k), cy + 40 + bob + dir * 20, 420, 560, pose('weave', u), 0.92 * (1 - e), dir * 0.13)
          }
          if (r.pics.length > 1) {
            side2(-1, 0)
            side2(1, 0)
          }
        }
        const { cw, ch } = drawCard(idx, cx, cy, box.w, box.h, ps)
        if (d.layout === 'studio') {
          const bottom = cy + (ch * ps.s) / 2 + 10
          c.save()
          c.beginPath()
          c.rect(cx - (cw * ps.s) / 2, bottom, cw * ps.s, ch * 0.34)
          c.clip()
          c.translate(cx, bottom)
          c.scale(1, -1)
          c.globalAlpha *= 0.4
          c.drawImage(p.src, (-cw * ps.s) / 2, -ch * ps.s, cw * ps.s, ch * ps.s)
          c.restore()
          const g = c.createLinearGradient(0, bottom, 0, bottom + ch * 0.34)
          g.addColorStop(0, rgba(bgc, 0.35))
          g.addColorStop(1, rgba(bgc, 1))
          c.fillStyle = g
          c.fillRect(cx - cw, bottom, cw * 2, ch * 0.36)
        }
      }
      if (isKind(d.layout)) {
        // background follows the photo in the spotlight, melting from one photo's colours into the next
        let j = r.durs.length - 1
        for (let i = 0; i < starts.length; i++) if (t < starts[i] + r.durs[i]) { j = i; break }
        const mix = (i: number) => {
          const u = ei2((t - (starts[i] - 0.5)) / 3)
          return u * u * (3 - 2 * u)
        }
        const bgOf = (i: number, al: number) => {
          const z = 1.3 + 0.006 * Math.min(40, Math.max(0, t - starts[i]))
          c.save()
          c.globalAlpha *= al
          c.translate(W / 2, H / 2)
          c.scale(z, z)
          c.imageSmoothingQuality = 'high'
          c.drawImage(blur(i), -W / 2, -H / 2, W, H)
          c.restore()
          c.save()
          c.globalAlpha *= al
          c.fillStyle = rgba(bgc, 0.5)
          c.fillRect(0, 0, W, H)
          c.restore()
        }
        drawScene(c, t, r, d.scene, pal, d.bg === 'blur')
        if (d.bg === 'blur') {
          // behind the motifs, newest layer first (destination-over stacks each new draw underneath)
          c.save()
          c.globalCompositeOperation = 'destination-over'
          for (let i = j; i >= Math.max(0, j - 2); i--) bgOf(i, i === Math.max(0, j - 2) ? 1 : mix(i))
          c.restore()
        }
        const k = KIND_K[d.layout]
        const SS = { R: [0.62, 1415, 540], L: [0.62, 505, 540], T: [0.55, 960, 700] }[side]
        const sc = lerp(1, SS[0], e)
        c.save()
        c.translate(lerp(960, SS[1], e), lerp(540, SS[2], e))
        c.scale(sc, sc)
        for (const bt of beatsOf(r.durs, k)) {
          const last = bt.e[bt.e.length - 1]
          if (t < bt.s[0] - 1.4 || t > last + 1.6) continue
          const ph = Math.min(2, Math.floor((3 * bt.s[0]) / T))
          const u = clamp((t - bt.s[0]) / (last - bt.s[0]))
          const ps = pose(d.recipe.phases[ph][0], u)
          c.save()
          c.rotate(ps.r * 0.4)
          c.translate(ps.x * 260, ps.y * 200)
          c.scale(1 + (ps.s - 1) * 0.35, 1 + (ps.s - 1) * 0.35)
          drawChoreo(d.layout, t, bt, (idx, x, y, w, h, o = {}) => {
            drawCard(idx, x, y, w, h, { s: o.s ?? 1, x: 0, y: 0, r: 0, soft: 0 }, o.alpha ?? 1, o.rot ?? 0, o.sx ?? 1)
          })
          c.restore()
        }
        c.restore()
      } else slideshow(c, r.transition === 'auto' ? { ...r, transition: d.recipe.trans } : r, t, 0, 0, W, H, { durs: r.durs, fade: 1.2, paint })

      // ---- light & mood of the current phase (cross-faded) ----
      for (let q = 0; q < 3; q++) {
        const lo = (q * T) / 3
        const hi = ((q + 1) * T) / 3
        const w = (q === 0 ? 1 : seg(t, lo - 2, lo + 2)) * (q === 2 ? 1 : 1 - seg(t, hi - 2, hi + 2))
        for (const fx of d.recipe.phases[q][1]) drawFx(c, fx, t, w, pal)
      }

      // ---- text ----
      c.save()
      c.shadowColor = 'rgba(0,0,0,0.45)'
      c.shadowBlur = 12
      const two = hasTwo(dat)
      const col = side === 'L' ? 1420 : side === 'R' ? 500 : 960
      const mw = side === 'T' ? 1300 : 780
      const head = { font: (s: number) => fnt(s, 500), fill: pal.soft, maxW: mw }
      const nm = (s: number) => ({ font: (z: number) => fnt(z, 700), size: s, fill: pal.name, maxW: mw })
      const body = { font: (z: number) => fnt(z, 500), fill: pal.ink, maxW: mw }
      if (side === 'T') {
        text(c, dat.headline, col, 120, { f: 'headline', ...head, size: 50 })
        if (two) {
          text(c, dat.name1, 600, 270, { f: 'name1', ...nm(104), maxW: 560 })
          text(c, dat.connector, col, 262, { f: 'connector', ...head, size: 54, maxW: 200 })
          text(c, dat.name2, 1320, 270, { f: 'name2', ...nm(104), maxW: 560 })
        } else text(c, dat.name1, col, 275, { f: 'name1', ...nm(136) })
        text(c, dat.date, col, 965, { f: 'date', ...body, size: 46 })
        text(c, dat.place, col, 1012, { f: 'place', ...head, size: 38 })
        text(c, dat.footer, col, 1055, { f: 'footer', ...body, size: 30 })
      } else {
        const o = 0
        text(c, dat.headline, col, 270 + o, { f: 'headline', ...head, size: 54 })
        if (two) {
          text(c, dat.name1, col, 470, { f: 'name1', ...nm(118) })
          text(c, dat.connector, col, 555, { f: 'connector', ...head, size: 56, maxW: 300 })
          text(c, dat.name2, col, 685, { f: 'name2', ...nm(118) })
        } else text(c, dat.name1, col, 560, { f: 'name1', ...nm(150) })
        text(c, dat.date, col, 810, { f: 'date', ...body, size: 46 })
        text(c, dat.place, col, 878, { f: 'place', ...head, size: 40 })
        text(c, dat.footer, col, 950, { f: 'footer', ...body, size: 34 })
      }
      c.restore()
    },
  }
}
