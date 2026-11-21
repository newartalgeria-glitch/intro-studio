import type { Palette } from '../palettes'
import { fontOf, rgba } from '../palettes'
import type { Layout } from './types'
import { easeOut, hasTwo, reveal, seg, slideshow, text } from '../util'

const W = 1920
const H = 1080

// x, y (centre), rotation in radians, start time
const CARDS: [number, number, number, number][] = [
  [330, 330, -0.1, 0.3],
  [640, 590, 0.07, 0.8],
  [330, 800, -0.05, 1.3],
]

export const polaroid: Layout = {
  id: 'polaroid',
  duration: () => 10,
  make(pal: Palette) {
    const fnt = fontOf(pal)
    return (c, t, r) => {
      const d = r.data
      const two = hasTwo(d)
      const bg = c.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, pal.bg0)
      bg.addColorStop(1, pal.bg1)
      c.fillStyle = bg
      c.fillRect(0, 0, W, H)
      // soft light pools
      for (const [x, y, rad] of [[1500, 200, 520], [200, 950, 480]]) {
        const g = c.createRadialGradient(x, y, 0, x, y, rad)
        g.addColorStop(0, rgba(pal.frame, 0.18))
        g.addColorStop(1, rgba(pal.frame, 0))
        c.fillStyle = g
        c.fillRect(0, 0, W, H)
      }

      const cw = 340
      const ch = 410
      CARDS.forEach(([cx, cy, rot, st], i) => {
        const p = easeOut(seg(t, st, st + 1.1))
        if (p <= 0) return
        const drop = (1 - p) * -500
        const sway = Math.sin(t * 0.8 + i * 2) * 0.012
        c.save()
        c.translate(cx, cy + drop)
        c.rotate(rot + sway + (1 - p) * 0.2)
        c.globalAlpha = Math.min(1, p * 1.6)
        c.shadowColor = 'rgba(0,0,0,0.38)'
        c.shadowBlur = 36
        c.shadowOffsetY = 16
        c.fillStyle = pal.paper
        c.fillRect(-cw / 2, -ch / 2, cw, ch)
        c.shadowColor = 'transparent'
        // the photo window: draw the slideshow in card space
        c.save()
        slideshow(c, r, t, -cw / 2 + 24, -ch / 2 + 24, cw - 48, cw - 48, { each: 3, fade: 0.9, start: 2.4 + i * 0.6, first: i, alpha: Math.min(1, p * 1.6), durs: r.real ? r.durs.slice(i) : undefined })
        c.restore()
        // tape
        c.fillStyle = rgba(pal.frame, 0.55)
        c.save()
        c.rotate(-0.08)
        c.fillRect(-60, -ch / 2 - 14, 120, 34)
        c.restore()
        c.restore()
      })
      c.globalAlpha = 1

      const cx = 1330
      const maxW = 800
      const dy = two ? 0 : 130
      c.save()
      reveal(c, t, 1.4)
      text(c, d.headline, cx, 300, { f: 'headline', font: (s) => fnt(s), size: 54, fill: pal.soft, maxW })
      c.restore()
      c.save()
      reveal(c, t, 2.0, 1, 34)
      text(c, d.name1, cx, 470 + dy, { f: 'name1', font: (s) => fnt(s, 700), size: 160, fill: pal.name, maxW })
      c.restore()
      if (two) {
        c.save()
        reveal(c, t, 2.6)
        text(c, d.connector, cx, 585, { f: 'connector', font: (s) => fnt(s), size: 70, fill: pal.frame })
        c.restore()
        c.save()
        reveal(c, t, 3.0, 1, 34)
        text(c, d.name2, cx, 740, { f: 'name2', font: (s) => fnt(s, 700), size: 160, fill: pal.name, maxW })
        c.restore()
      }
      const lp = easeOut(seg(t, 4, 5))
      c.strokeStyle = pal.frame
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(cx - 170 * lp, 812)
      c.lineTo(cx + 170 * lp, 812)
      c.stroke()
      c.save()
      reveal(c, t, 4.4)
      text(c, d.date, cx, 890, { f: 'date', font: (s) => fnt(s), size: 52, fill: pal.ink, maxW })
      c.restore()
      c.save()
      reveal(c, t, 4.9)
      text(c, d.place, cx, 952, { f: 'place', font: (s) => fnt(s), size: 40, fill: pal.soft, maxW })
      c.restore()
      if (d.footer) {
        c.save()
        reveal(c, t, 5.4)
        text(c, d.footer, cx, 1008, { f: 'footer', font: (s) => fnt(s), size: 30, fill: pal.soft, maxW })
        c.restore()
      }
    }
  },
}
