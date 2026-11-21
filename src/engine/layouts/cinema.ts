import type { Palette } from '../palettes'
import { fontOf, rgba } from '../palettes'
import type { Layout } from './types'
import { easeOut, hasTwo, reveal, seg, slideshow, text } from '../util'

const W = 1920
const H = 1080

export const cinema: Layout = {
  id: 'cinema',
  duration: () => 10,
  make(pal: Palette) {
    const fnt = fontOf(pal)
    const rule = (c: CanvasRenderingContext2D, cx: number, y: number, half: number, p: number) => {
      c.strokeStyle = pal.frame
      c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(cx - half * p, y)
      c.lineTo(cx + half * p, y)
      c.stroke()
    }
    return (c, t, r) => {
      const d = r.data
      const two = hasTwo(d)
      c.fillStyle = pal.bg1
      c.fillRect(0, 0, W, H)
      slideshow(c, r, t, 0, 0, W, H, { each: 3.4, fade: 1, durs: r.real ? r.durs : undefined })
      const ov = c.createLinearGradient(0, 0, 0, H)
      ov.addColorStop(0, rgba(pal.bg1, 0.7))
      ov.addColorStop(0.5, rgba(pal.bg0, 0.58))
      ov.addColorStop(1, rgba(pal.bg1, 0.78))
      c.fillStyle = ov
      c.fillRect(0, 0, W, H)

      const fp = easeOut(seg(t, 0.2, 2))
      c.strokeStyle = pal.frame
      c.lineWidth = 2
      const inset = 58
      const per = 2 * (W + H - inset * 4)
      c.setLineDash([per * fp, per])
      c.strokeRect(inset, inset, W - inset * 2, H - inset * 2)
      c.setLineDash([])

      const cx = W / 2
      const maxW = 1300
      const dy = two ? 0 : 140
      c.save()
      reveal(c, t, 1.2)
      text(c, d.headline, cx, 250, { f: 'headline', font: (s) => fnt(s), size: 58, fill: pal.soft, maxW })
      c.restore()
      rule(c, cx, 292, 120, easeOut(seg(t, 1.6, 2.6)))
      c.save()
      reveal(c, t, 2.2, 1.1, 30)
      text(c, d.name1, cx, 470 + dy, { f: 'name1', font: (s) => fnt(s, 700), size: 160, fill: pal.name, maxW })
      c.restore()
      if (two) {
        c.save()
        reveal(c, t, 3.0)
        text(c, d.connector, cx, 585, { f: 'connector', font: (s) => fnt(s), size: 64, fill: pal.soft })
        c.restore()
        c.save()
        reveal(c, t, 3.4, 1.1, 30)
        text(c, d.name2, cx, 745, { f: 'name2', font: (s) => fnt(s, 700), size: 160, fill: pal.name, maxW })
        c.restore()
      }
      rule(c, cx, 815, 260, easeOut(seg(t, 4.4, 5.4)))
      c.save()
      reveal(c, t, 5.0)
      text(c, d.date, cx, 890, { f: 'date', font: (s) => fnt(s), size: 54, fill: pal.ink, maxW })
      c.restore()
      c.save()
      reveal(c, t, 5.5)
      text(c, d.place, cx, 960, { f: 'place', font: (s) => fnt(s), size: 42, fill: pal.soft, maxW })
      c.restore()
      if (d.footer) {
        c.save()
        reveal(c, t, 6)
        text(c, d.footer, cx, 1015, { f: 'footer', font: (s) => fnt(s), size: 32, fill: pal.soft, maxW })
        c.restore()
      }
    }
  },
}
