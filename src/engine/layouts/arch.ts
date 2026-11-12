import type { RenderCtx } from '../types'
import type { Palette } from '../palettes'
import { fontOf } from '../palettes'
import type { Layout } from './types'
import { cached, easeOut, hasTwo, reveal, rng, seg, slideshow, text } from '../util'

const W = 1920
const H = 1080

function grad(c: CanvasRenderingContext2D, x0: number, x1: number, pos: number, base: string, hi: string) {
  const g = c.createLinearGradient(x0, 0, x1, 0)
  const k = (v: number) => Math.min(1, Math.max(0, v))
  g.addColorStop(0, base)
  g.addColorStop(k(pos - 0.14), base)
  g.addColorStop(k(pos), hi)
  g.addColorStop(k(pos + 0.14), base)
  g.addColorStop(1, base)
  return g
}

function dust(r: RenderCtx, color: string) {
  return cached(r, 'arch:dust' + color, 64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, color)
    g.addColorStop(0.35, color + '88')
    g.addColorStop(1, color + '00')
    x.fillStyle = g
    x.fillRect(0, 0, 64, 64)
  })
}

function frame(c: CanvasRenderingContext2D, inset: number, p: number, lw: number, color: string) {
  const w = W - inset * 2
  const h = H - inset * 2
  const per = 2 * (w + h)
  c.save()
  c.strokeStyle = color
  c.lineWidth = lw
  c.setLineDash([per * p, per])
  c.strokeRect(inset, inset, w, h)
  c.restore()
}

function diamond(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath()
  c.moveTo(x, y - s)
  c.lineTo(x + s, y)
  c.lineTo(x, y + s)
  c.lineTo(x - s, y)
  c.closePath()
  c.fill()
}

export const arch: Layout = {
  id: 'arch',
  duration: () => 12,
  make(pal: Palette) {
    const fnt = fontOf(pal)
    return (c, t, r) => {
      const d = r.data
      const two = hasTwo(d)
      const bg = c.createRadialGradient(W * 0.42, H * 0.5, 100, W * 0.42, H * 0.5, 1300)
      bg.addColorStop(0, pal.bg0)
      bg.addColorStop(1, pal.bg1)
      c.fillStyle = bg
      c.fillRect(0, 0, W, H)

      const rand = rng(7)
      const sprite = dust(r, pal.frame)
      for (let i = 0; i < 70; i++) {
        const x = rand() * W
        const y0 = rand() * H
        const sp = 8 + rand() * 22
        const sz = 8 + rand() * 26
        const ph = rand() * 6.28
        const y = (((y0 - sp * t) % H) + H) % H
        c.globalAlpha = (0.25 + 0.45 * Math.sin(t * 1.4 + ph) ** 2) * easeOut(seg(t, 0, 1.5))
        c.drawImage(sprite, x - sz / 2, y - sz / 2, sz, sz)
      }
      c.globalAlpha = 1

      frame(c, 64, easeOut(seg(t, 0.2, 2.6)), 3, pal.frame)
      frame(c, 86, easeOut(seg(t, 0.5, 2.9)), 1.2, pal.frame)
      const cp = seg(t, 2.4, 3.2)
      if (cp > 0) {
        c.fillStyle = pal.hi
        c.globalAlpha = cp
        for (const [x, y] of [[64, 64], [W - 64, 64], [64, H - 64], [W - 64, H - 64]]) diamond(c, x, y, 11)
        c.globalAlpha = 1
      }

      const ax = W * 0.745
      const aw = 560
      const ah = 790
      const ay = (H - ah) / 2
      const ap = easeOut(seg(t, 1.8, 3.4))
      if (ap > 0) {
        c.save()
        c.globalAlpha = ap
        const sc = 0.94 + 0.06 * ap
        c.translate(ax, H / 2)
        c.scale(sc, sc)
        c.translate(-ax, -H / 2)
        const path = (grow: number) => {
          const x0 = ax - aw / 2 - grow
          const x1 = ax + aw / 2 + grow
          const rr = aw / 2 + grow
          c.beginPath()
          c.moveTo(x0, ay + ah + grow)
          c.lineTo(x0, ay + rr)
          c.arc(ax, ay + rr, rr, Math.PI, 0)
          c.lineTo(x1, ay + ah + grow)
          c.closePath()
        }
        c.save()
        path(0)
        c.clip()
        slideshow(c, r, t, ax - aw / 2, ay, aw, ah, { each: 3, fade: 0.9, start: 2.4, alpha: ap })
        c.restore()
        c.globalAlpha = ap
        c.strokeStyle = pal.frame
        c.lineWidth = 4
        path(0)
        c.stroke()
        c.lineWidth = 1.5
        path(18)
        c.stroke()
        c.restore()
      }

      const cx = W * 0.35
      const maxW = 880
      const dy = two ? 0 : 120
      c.save()
      reveal(c, t, 1.4)
      text(c, d.headline, cx, 262, { f: 'headline', font: (s) => fnt(s), size: 54, fill: pal.soft, maxW })
      c.restore()

      const sh = seg(t, 4.2, 6.6)
      const gx0 = cx - maxW / 2
      const gx1 = cx + maxW / 2
      c.save()
      reveal(c, t, 2.6, 1.1, 34)
      text(c, d.name1, cx, 468 + dy, { f: 'name1', font: (s) => fnt(s, 700), size: 176, fill: grad(c, gx0, gx1, sh * 1.5 - 0.25, pal.name, pal.hi), maxW })
      c.restore()

      if (two) {
        c.save()
        const kp = easeOut(seg(t, 3.4, 4.4))
        c.globalAlpha = kp
        c.strokeStyle = pal.frame
        c.lineWidth = 1.5
        c.beginPath()
        c.moveTo(cx - 60 - 190 * kp, 590)
        c.lineTo(cx - 60, 590)
        c.moveTo(cx + 60, 590)
        c.lineTo(cx + 60 + 190 * kp, 590)
        c.stroke()
        text(c, d.connector, cx, 606, { f: 'connector', font: (s) => fnt(s), size: 70, fill: pal.soft })
        c.restore()

        c.save()
        reveal(c, t, 3.8, 1.1, 34)
        text(c, d.name2, cx, 770, { f: 'name2', font: (s) => fnt(s, 700), size: 176, fill: grad(c, gx0, gx1, sh * 1.5 - 0.1, pal.name, pal.hi), maxW })
        c.restore()
      }

      const lp = easeOut(seg(t, 5.6, 6.6))
      c.strokeStyle = pal.frame
      c.lineWidth = 1.2
      c.beginPath()
      c.moveTo(cx - 140 * lp, 835)
      c.lineTo(cx + 140 * lp, 835)
      c.stroke()
      c.save()
      reveal(c, t, 6.0)
      text(c, d.date, cx, 912, { f: 'date', font: (s) => fnt(s), size: 58, fill: pal.ink, maxW })
      c.restore()
      c.save()
      reveal(c, t, 6.5)
      text(c, d.place, cx, 976, { f: 'place', font: (s) => fnt(s), size: 40, fill: pal.frame, maxW })
      c.restore()
      if (d.footer) {
        c.save()
        reveal(c, t, 7)
        text(c, d.footer, cx, 1020, { f: 'footer', font: (s) => fnt(s), size: 30, fill: pal.soft, maxW })
        c.restore()
      }
    }
  },
}
