import type { FieldKey, RenderCtx, Template, Wins } from './types'
import type { Palette } from './palettes'
import { fontOf } from './palettes'
import type { Scene } from './scenes'
import { drawScene } from './scenes'
import type { FrameId } from './frames'
import { drawFramed } from './frames'
import { easeInOut, gate, hasTwo, lerp, slideshow, text } from './util'

export type Side = 'L' | 'R' | 'T' | 'C'

export interface Design {
  occ: string
  num: number
  scene: Scene
  frame: FrameId
  side: Side
  pal: Palette
}

interface R4 {
  x: number
  y: number
  w: number
  h: number
}
const FULL: Record<Side, R4> = {
  R: { x: 300, y: 100, w: 1320, h: 880 },
  L: { x: 300, y: 100, w: 1320, h: 880 },
  T: { x: 300, y: 100, w: 1320, h: 880 },
  C: { x: 140, y: 80, w: 1640, h: 920 },
}
const SIDE: Record<Side, R4> = {
  R: { x: 1010, y: 150, w: 810, h: 780 },
  L: { x: 100, y: 150, w: 810, h: 780 },
  T: { x: 460, y: 350, w: 1000, h: 560 },
  C: { x: 140, y: 80, w: 1640, h: 920 },
}

export const MIN_LEN = 14
export const DEFAULT_PHOTO_SEC = 6

const total = (r: RenderCtx) => Math.max(MIN_LEN, r.durs.reduce((a, b) => a + b, 0))

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
  return {
    id: `${d.occ}:${d.num}`,
    occasion: d.occ,
    layout: d.frame,
    variant: d.num,
    swatch: [pal.bg0, pal.frame, pal.name],
    kind: 'long',
    num: d.num,
    defaultWin: (r): Wins => {
      const T = total(r)
      const o = {} as Wins
      for (const k of Object.keys(WIN) as FieldKey[]) o[k] = [WIN[k][0], Math.min(WIN[k][1], T)]
      return o
    },
    duration: total,
    render(c, t, r) {
      const dat = r.data
      drawScene(c, t, r, d.scene, pal)

      // how much "title" is on screen right now -> the photo frame glides between its two places
      let f = 0
      for (const k of Object.keys(r.win) as FieldKey[]) {
        const [s, e] = r.win[k]
        if (!dat[k]) continue
        const g = s <= 1.5 ? gate([-5, e], t) : gate([s - 0.7, e], t)
        f = Math.max(f, g)
      }
      const e = easeInOut(f)
      const a = FULL[side]
      const b = SIDE[side]
      const rect = { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e) }

      drawFramed(c, d.frame, rect.x, rect.y, rect.w, rect.h, pal, t, (x, y, w, h) => {
        slideshow(c, r, t, x, y, w, h, { durs: r.durs, fade: 1.1 })
        if (side === 'C' && f > 0.01) {
          c.fillStyle = `rgba(0,0,0,${0.55 * e})`
          c.fillRect(x, y, w, h)
        }
      })

      // ---- text ----
      c.save()
      c.shadowColor = side === 'C' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.25)'
      c.shadowBlur = side === 'C' ? 20 : 8
      const two = hasTwo(dat)
      const col = side === 'L' ? 1420 : side === 'R' ? 500 : 960
      const mw = side === 'T' || side === 'C' ? 1300 : 780
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
        const o = side === 'C' ? 0 : 0
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
