import type { Palette } from '../palettes'
import { fontOf } from '../palettes'
import type { Layout } from './types'
import { easeInOut, easeOut, hasTwo, reveal, seg, slideshow, text } from '../util'

const W = 1920
const H = 1080

export const panels: Layout = {
  id: 'panels',
  duration: () => 9,
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

      const pw = 262
      const ph = 760
      const gap = 26
      const x0 = 150
      const ys = [150, 230, 120]
      for (let i = 0; i < 3; i++) {
        const start = 0.2 + i * 0.28
        const p = easeOut(seg(t, start, start + 1.1))
        if (p <= 0) continue
        const x = x0 + i * (pw + gap)
        const y = ys[i] + (1 - p) * 120 + Math.sin(t * 0.5 + i) * 10
        c.save()
        c.shadowColor = 'rgba(0,0,0,0.35)'
        c.shadowBlur = 30
        c.shadowOffsetY = 12
        c.globalAlpha = p
        c.fillStyle = pal.frame
        c.fillRect(x, y, pw, ph)
        c.restore()
        slideshow(c, r, t, x, y, pw, ph, { each: 3, fade: 0.9, start: 2.2 + i * 0.5, first: i, alpha: p })
      }

      const rx = 1790
      const maxW = 780
      const dy = two ? 0 : 130
      c.save()
      reveal(c, t, 0.9)
      text(c, d.headline, rx, 270, { f: 'headline', font: (s) => fnt(s, 600), size: 44, fill: pal.soft, align: 'right', maxW })
      c.restore()
      c.save()
      reveal(c, t, 1.3, 1, 40)
      text(c, d.name1, rx, 450 + dy, { f: 'name1', font: (s) => fnt(s, 700), size: 168, fill: pal.name, align: 'right', maxW })
      c.restore()
      if (two) {
        c.save()
        reveal(c, t, 1.8, 1, 40)
        text(c, d.connector, rx, 560, { f: 'connector', font: (s) => fnt(s), size: 72, fill: pal.frame, align: 'right' })
        c.restore()
        c.save()
        reveal(c, t, 2.2, 1, 40)
        text(c, d.name2, rx, 800, { f: 'name2', font: (s) => fnt(s, 700), size: 168, fill: pal.name, align: 'right', maxW })
        c.restore()
      }
      const lp = easeInOut(seg(t, 3.2, 4.2))
      c.fillStyle = pal.frame
      c.fillRect(rx - 380 * lp, 858, 380 * lp, 8)
      c.save()
      reveal(c, t, 3.9)
      text(c, d.date, rx, 936, { f: 'date', font: (s) => fnt(s, 600), size: 50, fill: pal.ink, align: 'right', maxW })
      c.restore()
      c.save()
      reveal(c, t, 4.3)
      text(c, d.place, rx, 994, { f: 'place', font: (s) => fnt(s), size: 38, fill: pal.soft, align: 'right', maxW })
      c.restore()
      if (d.footer) {
        c.save()
        reveal(c, t, 4.8)
        text(c, d.footer, rx, 1042, { f: 'footer', font: (s) => fnt(s), size: 28, fill: pal.soft, align: 'right', maxW })
        c.restore()
      }
    }
  },
}
