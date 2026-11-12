import type { RenderCtx } from '../types'
import type { Palette } from '../palettes'
import { fontOf, rgba } from '../palettes'
import type { Layout } from './types'
import { cached, cover, easeInOut, easeOut, hasTwo, lerp, pic, seg, text } from '../util'

const W = 1920
const H = 1080
const PW = 680
const PH = 880
const D = 4600
const INK = '#2a2216'

const OPEN_AT = 0.9
const OPEN_DUR = 1.6
const FIRST_FLIP = 3.9
const FLIP_GAP = 2.2
const FLIP_DUR = 1.25

type C2 = CanvasRenderingContext2D

const leaves = (r: RenderCtx) => Math.min(4, Math.max(2, Math.ceil(r.pics.length / 2)))
const flipStart = (k: number) => FIRST_FLIP + (k - 1) * FLIP_GAP

function ornament(x: C2, cx: number, y: number, color: string) {
  x.strokeStyle = color
  x.lineWidth = 2
  x.beginPath()
  x.moveTo(cx - 120, y)
  x.lineTo(cx - 18, y)
  x.moveTo(cx + 18, y)
  x.lineTo(cx + 120, y)
  x.stroke()
  x.fillStyle = color
  x.beginPath()
  x.moveTo(cx, y - 9)
  x.lineTo(cx + 9, y)
  x.lineTo(cx, y + 9)
  x.lineTo(cx - 9, y)
  x.closePath()
  x.fill()
}

function flat(c: C2, face: HTMLCanvasElement, spineX: number, cy: number, side: 'l' | 'r') {
  const x = side === 'r' ? spineX : spineX - PW
  c.drawImage(face, x, cy - PH / 2)
  const g = c.createLinearGradient(spineX, 0, side === 'r' ? spineX + 90 : spineX - 90, 0)
  g.addColorStop(0, 'rgba(40,25,5,0.34)')
  g.addColorStop(1, 'rgba(40,25,5,0)')
  c.fillStyle = g
  c.fillRect(Math.min(spineX, side === 'r' ? spineX + 90 : spineX - 90), cy - PH / 2, 90, PH)
}

function leaf(c: C2, face: HTMLCanvasElement, isBack: boolean, spineX: number, cy: number, theta: number) {
  const N = 120
  const s = Math.sin(theta)
  const co = Math.cos(theta)
  for (let i = 0; i < N; i++) {
    const u0 = i / N
    const u1 = (i + 1) / N
    const k0 = D / (D - u0 * PW * s)
    const k1 = D / (D - u1 * PW * s)
    const xa = spineX + u0 * PW * co * k0
    const xb = spineX + u1 * PW * co * k1
    const left = Math.min(xa, xb)
    const wid = Math.abs(xb - xa) + 0.8
    const hh = (PH * (k0 + k1)) / 2
    const sx = isBack ? PW - u1 * PW : u0 * PW
    c.drawImage(face, sx, 0, PW / N + 0.5, PH, left, cy - hh / 2, wid, hh)
    c.fillStyle = `rgba(20,12,0,${0.05 + 0.32 * s * (0.4 + u0)})`
    c.fillRect(left, cy - hh / 2, wid, hh)
  }
}

export const album: Layout = {
  id: 'album',
  duration: (r) => flipStart(leaves(r)) + FLIP_DUR + 3.4,
  make(pal: Palette) {
    const fnt = fontOf(pal)
    const key = 'album:' + pal.cover + pal.paper + pal.font + pal.frame + ':'
    const paper = (x: C2) => {
      x.fillStyle = pal.paper
      x.fillRect(0, 0, PW, PH)
      const g = x.createLinearGradient(0, 0, PW, 0)
      g.addColorStop(0, 'rgba(120,95,50,0.10)')
      g.addColorStop(0.2, 'rgba(120,95,50,0)')
      g.addColorStop(1, 'rgba(120,95,50,0.07)')
      x.fillStyle = g
      x.fillRect(0, 0, PW, PH)
    }

    const coverFace = (r: RenderCtx) =>
      cached(r, key + 'cover' + r.data.name1 + r.data.name2, PW, PH, (x) => {
        x.fillStyle = pal.cover
        x.fillRect(0, 0, PW, PH)
        const g = x.createRadialGradient(PW * 0.6, PH * 0.4, 50, PW * 0.6, PH * 0.4, 800)
        g.addColorStop(0, 'rgba(255,255,255,0.12)')
        g.addColorStop(1, 'rgba(0,0,0,0.32)')
        x.fillStyle = g
        x.fillRect(0, 0, PW, PH)
        x.strokeStyle = pal.frame
        x.lineWidth = 3
        x.strokeRect(46, 46, PW - 92, PH - 92)
        x.lineWidth = 1.2
        x.strokeRect(64, 64, PW - 128, PH - 128)
        const d = r.data
        const two = hasTwo(d)
        const gold = x.createLinearGradient(0, 300, 0, 620)
        gold.addColorStop(0, pal.hi)
        gold.addColorStop(1, pal.frame)
        text(x, d.headline, PW / 2, 250, { f: 'headline', font: (s) => fnt(s), size: 44, fill: pal.soft, maxW: PW - 200 })
        text(x, d.name1, PW / 2, two ? 410 : 520, { f: 'name1', font: (s) => fnt(s, 700), size: 120, fill: gold, maxW: PW - 170 })
        if (two) {
          ornament(x, PW / 2, 480, pal.frame)
          text(x, d.connector, PW / 2, 548, { f: 'connector', font: (s) => fnt(s), size: 56, fill: pal.soft })
          text(x, d.name2, PW / 2, 690, { f: 'name2', font: (s) => fnt(s, 700), size: 120, fill: gold, maxW: PW - 170 })
        } else ornament(x, PW / 2, 590, pal.frame)
        text(x, d.date, PW / 2, 770, { f: 'date', font: (s) => fnt(s), size: 38, fill: pal.ink, maxW: PW - 200 })
      })

    const endpaper = (r: RenderCtx) =>
      cached(r, key + 'end', PW, PH, (x) => {
        paper(x)
        x.fillStyle = rgba(pal.cover, 0.08)
        for (let i = 0; i < 10; i++)
          for (let j = 0; j < 13; j++) {
            x.beginPath()
            x.arc(34 + i * 68, 34 + j * 68, 3, 0, 6.3)
            x.fill()
          }
      })

    const photoFace = (r: RenderCtx, idx: number) =>
      cached(r, key + 'photo' + (idx % r.pics.length), PW, PH, (x) => {
        paper(x)
        const m = 44
        x.save()
        x.shadowColor = 'rgba(60,40,10,0.35)'
        x.shadowBlur = 18
        x.shadowOffsetY = 6
        x.fillStyle = '#fff'
        x.fillRect(m, m, PW - m * 2, PH - m * 2)
        x.restore()
        x.save()
        x.beginPath()
        x.rect(m + 14, m + 14, PW - (m + 14) * 2, PH - (m + 14) * 2)
        x.clip()
        cover(x, pic(r, idx), m + 14, m + 14, PW - (m + 14) * 2, PH - (m + 14) * 2, 1, 0, -0.3)
        x.restore()
      })

    const namesFace = (r: RenderCtx) =>
      cached(r, key + 'names' + r.data.name1 + r.data.name2 + r.data.headline, PW, PH, (x) => {
        paper(x)
        const d = r.data
        const two = hasTwo(d)
        x.strokeStyle = pal.frame
        x.lineWidth = 2
        x.strokeRect(50, 50, PW - 100, PH - 100)
        text(x, d.headline, PW / 2, 250, { f: 'headline', font: (s) => fnt(s), size: 46, fill: pal.name, maxW: PW - 180 })
        text(x, d.name1, PW / 2, two ? 410 : 520, { f: 'name1', font: (s) => fnt(s, 700), size: 112, fill: INK, maxW: PW - 160 })
        if (two) {
          ornament(x, PW / 2, 480, pal.frame)
          text(x, d.connector, PW / 2, 546, { f: 'connector', font: (s) => fnt(s), size: 52, fill: pal.name })
          text(x, d.name2, PW / 2, 676, { f: 'name2', font: (s) => fnt(s, 700), size: 112, fill: INK, maxW: PW - 160 })
        } else ornament(x, PW / 2, 590, pal.frame)
      })

    const closingFace = (r: RenderCtx) =>
      cached(r, key + 'closing' + r.data.date + r.data.place + r.data.footer, PW, PH, (x) => {
        paper(x)
        const d = r.data
        x.strokeStyle = pal.frame
        x.lineWidth = 2
        x.strokeRect(50, 50, PW - 100, PH - 100)
        ornament(x, PW / 2, 330, pal.frame)
        text(x, d.date, PW / 2, 440, { f: 'date', font: (s) => fnt(s), size: 56, fill: INK, maxW: PW - 160 })
        text(x, d.place, PW / 2, 520, { f: 'place', font: (s) => fnt(s), size: 42, fill: pal.name, maxW: PW - 160 })
        if (d.footer) text(x, d.footer, PW / 2, 640, { f: 'footer', font: (s) => fnt(s), size: 34, fill: pal.name, maxW: PW - 160 })
        ornament(x, PW / 2, 700, pal.frame)
      })

    const front = (r: RenderCtx, k: number) => (k === 0 ? coverFace(r) : photoFace(r, 2 * (k - 1)))
    const back = (r: RenderCtx, k: number) => (k === 0 ? endpaper(r) : k === leaves(r) ? namesFace(r) : photoFace(r, 2 * (k - 1) + 1))

    return (c, t, r) => {
      const L = leaves(r)
      const dur = flipStart(L) + FLIP_DUR + 3.4
      const bg = c.createRadialGradient(W / 2, H * 0.48, 80, W / 2, H * 0.5, 1250)
      bg.addColorStop(0, pal.bg0)
      bg.addColorStop(1, pal.bg1)
      c.fillStyle = bg
      c.fillRect(0, 0, W, H)

      const zoom = lerp(1, 1.07, t / dur)
      c.save()
      c.translate(W / 2, H / 2)
      c.scale(zoom, zoom)
      c.translate(-W / 2, -H / 2 + lerp(14, -6, t / dur))

      const cy = H / 2
      const enter = easeOut(seg(t, 0, 1.1))
      const open = easeInOut(seg(t, OPEN_AT, OPEN_AT + OPEN_DUR))
      const spineX = lerp(W / 2 - PW / 2, W / 2, open)

      const sh = cached(r, 'album:shadow', 1700, 1100, (x) => {
        x.filter = 'blur(40px)'
        x.fillStyle = 'rgba(0,0,0,0.75)'
        x.fillRect(150, 150, 1400, PH + 40)
      })
      c.globalAlpha = 0.9 * enter
      const spreadW = lerp(PW, PW * 2, open)
      const centre = spineX + lerp(PW / 2, 0, open)
      const ks = (spreadW + 40) / 1400
      c.drawImage(sh, centre - 850 * ks, cy - 550 + 20, 1700 * ks, 1100)
      c.globalAlpha = enter
      c.translate(0, (1 - enter) * 40)

      const prog: number[] = []
      for (let k = 0; k <= L; k++) prog.push(k === 0 ? open : easeInOut(seg(t, flipStart(k), flipStart(k) + FLIP_DUR)))
      let cur = -1
      for (let k = 0; k <= L; k++) if (prog[k] >= 1) cur = k
      const inflight = prog.findIndex((p) => p > 0 && p < 1)

      const rightIdx = (inflight >= 0 ? inflight : cur) + 1
      flat(c, rightIdx > L ? closingFace(r) : front(r, rightIdx), spineX, cy, 'r')
      if (cur >= 0) flat(c, back(r, cur), spineX, cy, 'l')
      if (inflight >= 0) {
        const th = Math.PI * prog[inflight]
        const showBack = th > Math.PI / 2
        leaf(c, showBack ? back(r, inflight) : front(r, inflight), showBack, spineX, cy, th)
      }
      c.restore()
      c.globalAlpha = 1
    }
  },
}
