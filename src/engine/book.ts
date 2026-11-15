import type { RenderCtx, Template, Wins } from './types'
import type { Palette } from './palettes'
import { EXTRA, PALETTES, isLight, rgba } from './palettes'
import type { SpriteId } from './sprites'
import { drawScene } from './scenes'
import type { Base, Pattern } from './scenes'
import { drawFx } from './motion'
import { cached, clamp, easeInOut, lerp, pic, seg } from './util'

type Ctx = CanvasRenderingContext2D

const PW = 740 // page size
const PH = 930
const CW = PW + 22 // cover is a little larger than the pages
const CH = PH + 30
const F = 4600 // camera distance: weak perspective
const N_STRIPS = 44
const FL = 1.5 // seconds one page takes to turn
const OPEN_AT = 1.2
const OPEN_LEN = 2.2
const B0 = OPEN_AT + OPEN_LEN // first spread fully open
const TAIL = 1.4

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const shade = (h: string, k: number) => {
  const [r, g, b] = hex(h).map((v) => Math.round(clamp(v * k, 0, 255)))
  return `rgb(${r},${g},${b})`
}

/** Timeline of the book: when each spread is fully open and how long it stays. */
function plan(r: RenderCtx) {
  const P = Math.max(1, r.real)
  const n = Math.ceil(P / 2) // sides, two photos each
  const kmax = n <= 1 ? 0 : Math.ceil((n - 1) / 2)
  const d = (i: number) => (i < P ? r.durs[i] ?? 5 : 0)
  const hold: number[] = []
  for (let k = 0; k <= kmax; k++) {
    const sum = k === 0 ? d(0) + d(1) : d(4 * k - 2) + d(4 * k - 1) + d(4 * k) + d(4 * k + 1)
    hold.push(Math.max(sum, 4))
  }
  // B[k]: the moment spread k is completely open (turn k ends)
  const B = [B0]
  for (let k = 1; k <= kmax; k++) B.push(B[k - 1] + hold[k - 1])
  const total = Math.max(14, B[kmax] + hold[kmax] + TAIL)
  return { P, n, kmax, B, total }
}

export const bookDuration = (r: RenderCtx) => plan(r).total

interface Look {
  pal: Palette
  paper: string
  /** photos placed diagonally and a little irregular instead of stacked */
  stagger?: boolean
  scene: { base: Base; pattern: Pattern; sprites: SpriteId[]; seed: number }
}

function paperTex(r: RenderCtx, L: Look, key: string, side: number, back: boolean, pal: Palette, num: number) {
  return cached(r, `${key}:p${side}${back ? 'b' : 'f'}`, PW, PH, (c) => {
    const g = c.createLinearGradient(0, 0, PW, PH)
    g.addColorStop(0, L.paper)
    g.addColorStop(1, shade(L.paper, 0.93))
    c.fillStyle = g
    c.fillRect(0, 0, PW, PH)
    // faint paper grain
    c.fillStyle = 'rgba(120,90,50,.035)'
    for (let i = 0; i < 260; i++) c.fillRect(((i * 97) % PW) | 0, ((i * 53) % PH) | 0, 2, 2)
    const idx = [side * 2, side * 2 + 1]
    const have = r.real > 0 ? idx.filter((i) => i < r.real) : idx
    const mx0 = back ? 38 : 64
    const mx1 = back ? 64 : 38
    const sw = PW - mx0 - mx1
    const gap = 34
    const top = 44
    const sh = (PH - top * 2 - gap) / 2
    // seeded pseudo-random, so every render of the same page is identical
    const rnd = (n: number) => {
      const x = Math.sin((side * 7 + n * 13 + num * 3) * 12.9898) * 43758.5453
      return x - Math.floor(x)
    }
    have.forEach((i, j) => {
      const p = pic(r, i)
      if (L.stagger && have.length === 2) {
        // two photos on a diagonal: one near the top corner, the other near the opposite bottom corner
        const bw = sw * 0.66
        const bh = (PH - top * 2) * 0.5
        const flip = (side + (rnd(1) > 0.6 ? 1 : 0)) % 2 === 0
        const left = (j === 0) === flip // true = this photo hugs the left side
        const kk = Math.min((bw - 24) / p.w, (bh - 24) / p.h) * (0.92 + rnd(2 + j) * 0.1)
        const w = p.w * kk
        const h = p.h * kk
        const cx = left ? mx0 + 12 + w / 2 + rnd(4 + j) * 22 : PW - mx1 - 12 - w / 2 - rnd(4 + j) * 22
        const cyy = j === 0 ? top + 14 + h / 2 + rnd(6) * 28 : PH - top - 14 - h / 2 - rnd(7) * 28
        c.save()
        c.translate(cx, cyy)
        c.rotate((rnd(8 + j) - 0.5) * 0.05)
        c.shadowColor = 'rgba(0,0,0,.38)'
        c.shadowBlur = 18
        c.shadowOffsetY = 6
        c.fillStyle = '#fffdf8'
        c.fillRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24)
        c.shadowColor = 'transparent'
        c.imageSmoothingQuality = 'high'
        c.drawImage(p.src, -w / 2, -h / 2, w, h)
        c.restore()
        return
      }
      const slotH = have.length === 1 ? PH - top * 2 - 60 : sh
      const y0 = have.length === 1 ? top + 30 : top + j * (sh + gap)
      const k = Math.min((sw - 24) / p.w, (slotH - 24) / p.h)
      const w = p.w * k
      const h = p.h * k
      c.save()
      c.translate(mx0 + sw / 2, y0 + slotH / 2)
      c.rotate((((side + j) % 2) - 0.5) * 0.024)
      c.shadowColor = 'rgba(0,0,0,.35)'
      c.shadowBlur = 16
      c.shadowOffsetY = 5
      c.fillStyle = '#fffdf8'
      c.fillRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24)
      c.shadowColor = 'transparent'
      c.imageSmoothingQuality = 'high'
      c.drawImage(p.src, -w / 2, -h / 2, w, h)
      c.restore()
    })
    // gutter shade next to the spine
    const sx = back ? PW : 0
    const gg = c.createLinearGradient(sx, 0, back ? PW - 90 : 90, 0)
    gg.addColorStop(0, 'rgba(40,25,10,.38)')
    gg.addColorStop(1, 'rgba(40,25,10,0)')
    c.fillStyle = gg
    c.fillRect(0, 0, PW, PH)
    void pal
  })
}

function coverFront(r: RenderCtx, L: Look, key: string) {
  const pal = L.pal
  return cached(r, `${key}:cf`, CW, CH, (c) => {
    const base = pal.cover
    const g = c.createLinearGradient(0, 0, CW, CH)
    g.addColorStop(0, shade(base, 1.35))
    g.addColorStop(0.5, shade(base, 1))
    g.addColorStop(1, shade(base, 0.72))
    c.fillStyle = g
    c.fillRect(0, 0, CW, CH)
    c.fillStyle = 'rgba(255,255,255,.03)'
    for (let i = 0; i < 900; i++) c.fillRect(((i * 131) % CW) | 0, ((i * 71) % CH) | 0, 2, 2)
    // spine groove
    const sg = c.createLinearGradient(0, 0, 70, 0)
    sg.addColorStop(0, 'rgba(0,0,0,.45)')
    sg.addColorStop(0.55, 'rgba(0,0,0,.05)')
    sg.addColorStop(0.62, 'rgba(255,255,255,.12)')
    sg.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = sg
    c.fillRect(0, 0, 70, CH)
    // gold frames
    c.strokeStyle = pal.frame
    c.lineWidth = 5
    c.strokeRect(70, 46, CW - 70 - 46, CH - 92)
    c.lineWidth = 2
    c.strokeRect(84, 60, CW - 84 - 60, CH - 120)
    // corner ornaments
    const cx0 = 84
    const cx1 = CW - 60
    const cy0 = 60
    const cy1 = CH - 60
    c.lineWidth = 3
    for (const [x, y, sx, sy] of [[cx0, cy0, 1, 1], [cx1, cy0, -1, 1], [cx0, cy1, 1, -1], [cx1, cy1, -1, -1]] as const) {
      c.beginPath()
      c.arc(x + sx * 34, y + sy * 34, 34, sx > 0 ? Math.PI : 0, 0, false)
      c.save()
      c.translate(x, y)
      c.scale(sx, sy)
      c.beginPath()
      c.arc(0, 0, 52, 0, Math.PI / 2)
      c.stroke()
      c.beginPath()
      c.arc(0, 0, 30, 0, Math.PI / 2)
      c.stroke()
      c.restore()
    }
    // centre emblem: rays, rings and a diamond
    const mx = (70 + CW - 46) / 2 + 12
    const my = CH / 2
    c.save()
    c.translate(mx, my)
    c.strokeStyle = pal.frame
    for (let i = 0; i < 24; i++) {
      c.lineWidth = i % 2 ? 1.5 : 3
      c.beginPath()
      c.moveTo(Math.cos((i / 24) * 6.283) * 120, Math.sin((i / 24) * 6.283) * 120)
      c.lineTo(Math.cos((i / 24) * 6.283) * 176, Math.sin((i / 24) * 6.283) * 176)
      c.stroke()
    }
    c.lineWidth = 4
    c.beginPath()
    c.arc(0, 0, 110, 0, 6.283)
    c.stroke()
    c.lineWidth = 2
    c.beginPath()
    c.arc(0, 0, 98, 0, 6.283)
    c.stroke()
    c.fillStyle = pal.frame
    c.beginPath()
    c.moveTo(0, -64)
    c.lineTo(46, 0)
    c.lineTo(0, 64)
    c.lineTo(-46, 0)
    c.closePath()
    c.fill()
    c.fillStyle = shade(base, 0.8)
    c.beginPath()
    c.moveTo(0, -34)
    c.lineTo(22, 0)
    c.lineTo(0, 34)
    c.lineTo(-22, 0)
    c.closePath()
    c.fill()
    c.restore()
    // sheen
    const sh = c.createLinearGradient(0, 0, CW, CH * 0.6)
    sh.addColorStop(0, 'rgba(255,255,255,.10)')
    sh.addColorStop(0.4, 'rgba(255,255,255,0)')
    c.fillStyle = sh
    c.fillRect(0, 0, CW, CH)
  })
}

function coverBack(r: RenderCtx, L: Look, key: string) {
  const pal = L.pal
  return cached(r, `${key}:cb`, CW, CH, (c) => {
    c.fillStyle = shade(pal.cover, 0.8)
    c.fillRect(0, 0, CW, CH)
    // pasted end paper
    const x0 = 14
    const y0 = 16
    const w = CW - 14 - 12
    const h = CH - 32
    c.fillStyle = shade(L.paper, 0.97)
    c.fillRect(x0, y0, w, h)
    c.strokeStyle = rgba(pal.frame, 0.4)
    c.lineWidth = 1.5
    const s = 54
    for (let y = y0 - s; y < y0 + h + s; y += s)
      for (let x = x0 - s; x < x0 + w + s; x += s) {
        c.save()
        c.beginPath()
        c.rect(x0, y0, w, h)
        c.clip()
        c.beginPath()
        c.moveTo(x, y - s / 2)
        c.lineTo(x + s / 2, y)
        c.lineTo(x, y + s / 2)
        c.lineTo(x - s / 2, y)
        c.closePath()
        c.stroke()
        c.restore()
      }
    const gg = c.createLinearGradient(CW, 0, CW - 120, 0)
    gg.addColorStop(0, 'rgba(40,25,10,.4)')
    gg.addColorStop(1, 'rgba(40,25,10,0)')
    c.fillStyle = gg
    c.fillRect(0, 0, CW, CH)
  })
}

/** One leaf, turned by `theta` (0 = flat on the right, PI = flat on the left) around the spine, with a paper curl. */
function drawLeaf(c: Ctx, front: HTMLCanvasElement, back: HTMLCanvasElement, w: number, h: number, spineX: number, cy: number, theta: number, shadow: boolean) {
  const flat = theta < 0.001 || theta > Math.PI - 0.001
  const n = flat ? 1 : N_STRIPS
  const du = w / n
  const lag = flat ? 0 : 0.5 * Math.sin(theta)
  const X: number[] = [0]
  const S: number[] = [1]
  const A: number[] = []
  let x = 0
  let z = 0
  for (let i = 0; i < n; i++) {
    const a = clamp(theta - lag * ((i + 0.5) / n), 0, Math.PI)
    x += du * Math.cos(a)
    z += du * Math.sin(a)
    A.push(a)
    X.push(spineX + x * (F / (F - z)))
    S.push(F / (F - z))
  }
  X[0] = spineX
  if (shadow && !flat) {
    // soft shadow of the turning page on whatever lies beneath it
    c.save()
    c.beginPath()
    c.moveTo(X[0], cy - (h / 2) * S[0])
    for (let i = 1; i <= n; i++) c.lineTo(X[i], cy - (h / 2) * S[i])
    for (let i = n; i >= 0; i--) c.lineTo(X[i], cy + (h / 2) * S[i])
    c.closePath()
    c.translate(-6000, 0)
    c.shadowOffsetX = 6000 + 26
    c.shadowOffsetY = 18
    c.shadowBlur = 46
    c.shadowColor = `rgba(0,0,0,${0.45 * Math.sin(theta)})`
    c.fillStyle = '#000'
    c.fill()
    c.restore()
  }
  c.imageSmoothingQuality = 'high'
  const tw = front.width
  for (let i = 0; i < n; i++) {
    const isBack = A[i] > Math.PI / 2
    const u0 = i * du
    const k = tw / w
    const sx = isBack ? (w - (u0 + du)) * k : u0 * k
    const x0 = X[i]
    const x1 = X[i + 1]
    const dx = Math.min(x0, x1) - 0.4
    const dw = Math.abs(x1 - x0) + 0.8
    if (dw < 0.9 && !flat) continue
    const s = (S[i] + S[i + 1]) / 2
    const dh = h * s
    const dy = cy - dh / 2
    c.drawImage(isBack ? back : front, sx, 0, du * k, h * k, dx, dy, dw, dh)
    if (!flat) {
      const sh = 0.3 * Math.pow(Math.sin(A[i]), 2) + 0.06 * (1 - Math.cos(A[i] - 0.5))
      c.fillStyle = `rgba(30,18,8,${clamp(sh, 0, 0.5)})`
      c.fillRect(dx + 0.4, dy, Math.max(0.2, dw - 0.8), dh)
    }
  }
}

function stack(c: Ctx, spineX: number, cy: number, w: number, h: number, side: 1 | -1, th: number, paper: string) {
  for (let i = Math.round(th); i >= 1; i--) {
    const off = i * 1.1
    c.fillStyle = i % 3 ? shade(paper, 0.9) : shade(paper, 0.78)
    const x = side === 1 ? spineX + off : spineX - w - off
    c.fillRect(x, cy - h / 2 + i * 0.8, w, h)
  }
}

export function makeBook(num: number, look: Look, sec: number): Template {
  const L = look
  const pal = L.pal
  const key = `bk${num}`
  return {
    id: `book:${num}`,
    occasion: 'book',
    layout: 'book',
    variant: num,
    swatch: [pal.bg0, pal.frame, pal.cover],
    kind: 'long',
    num,
    sec,
    tag: 'book',
    defaultWin: (): Wins => {
      const o = {} as Wins
      for (const k of ['headline', 'name1', 'connector', 'name2', 'date', 'place', 'footer'] as const) o[k] = [0, 1]
      return o
    },
    duration: bookDuration,
    render(c, t, r) {
      const W = 1920
      const H = 1080
      const pl = plan(r)
      // ---- background: table / backdrop with a few sparkles ----
      drawScene(c, t, r, { ...L.scene, sprites: L.scene.sprites }, pal)
      drawFx(c, 'dust', t, 0.7, pal)
      const vg = c.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1200)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.45)')
      c.fillStyle = vg
      c.fillRect(0, 0, W, H)

      // ---- which leaf is turning, how far ----
      const theta = (k: number) => {
        const a = k === 0 ? OPEN_AT : pl.B[k] - FL
        const b = pl.B[k]
        return Math.PI * easeInOut(seg(t, a, b))
      }
      let turned = 0
      let turning = -1
      let th = 0
      for (let k = 0; k <= pl.kmax; k++) {
        const v = theta(k)
        if (v >= Math.PI - 1e-6) turned = k + 1
        else {
          if (v > 1e-6) {
            turning = k
            th = v
          }
          break
        }
      }
      const openAmt = turned > 0 ? 1 : turning === 0 ? easeInOut(th / Math.PI) : 0
      const spineX = lerp(W / 2 - CW / 2, W / 2, openAmt)
      const cy = H / 2 + Math.sin(t * 0.6) * 4
      const zoom = lerp(0.93, 1, clamp(t / 3))

      c.save()
      c.translate(W / 2, H / 2)
      c.scale(zoom, zoom)
      c.translate(-W / 2, -H / 2)

      // ground shadow
      c.save()
      const left = lerp(spineX, spineX - CW, openAmt)
      c.translate(-6000, 0)
      c.shadowOffsetX = 6000 + 14
      c.shadowOffsetY = 30
      c.shadowBlur = 40
      c.shadowColor = 'rgba(0,0,0,.5)'
      c.fillStyle = '#000'
      c.fillRect(left, cy - CH / 2, spineX + CW - left, CH)
      c.restore()

      const key2 = key
      const cf = coverFront(r, L, key2)
      const cb = coverBack(r, L, key2)
      const side = (s: number, back: boolean) => paperTex(r, L, key2, s, back, pal, num)
      // leaf textures: [front, back, w, h]
      const leaf = (j: number): [HTMLCanvasElement, HTMLCanvasElement, number, number] =>
        j === 0 ? [cf, cb, CW, CH] : [side(2 * j - 2, false), side(2 * j - 1, true), PW, PH]

      const restLeaves = pl.kmax + 1 - Math.max(0, turned - 1) // paper leaves still on the right (+ the cover when closed)
      const rightTop = turning >= 0 ? turning + 1 : turned
      const rightPaper = Math.max(0, pl.kmax + 1 - rightTop + (rightTop === 0 ? 0 : 1))

      // back board of the book (right)
      c.save()
      c.shadowColor = 'rgba(0,0,0,.4)'
      c.shadowBlur = 26
      c.shadowOffsetY = 10
      c.fillStyle = shade(pal.cover, 0.85)
      c.fillRect(spineX, cy - CH / 2, CW, CH)
      c.restore()
      c.fillStyle = shade(pal.cover, 0.7)
      c.fillRect(spineX, cy - CH / 2, 22, CH)
      void restLeaves

      // left side: cover lying open, then the pile of turned pages
      if (turned > 0 || (turning === 0 && th > Math.PI / 2)) {
        // cover back flat on the left once it has landed
      }
      if (turned >= 1) {
        const [, b0, w0, h0] = leaf(0)
        drawLeaf(c, b0, b0, w0, h0, spineX, cy, Math.PI, false)
      }
      if (turned >= 2) {
        const tpaper = Math.min(14, 2 + (turned - 1) * 1.4)
        stack(c, spineX, cy, PW, PH, -1, tpaper, L.paper)
        const [, bk, w1, h1] = leaf(turned - 1)
        drawLeaf(c, bk, bk, w1, h1, spineX, cy, Math.PI, false)
      }
      // right side: pile + top page
      if (rightTop === 0 || rightTop <= pl.kmax + 1) {
        if (rightTop >= 1) {
          stack(c, spineX, cy, PW, PH, 1, Math.min(16, 2 + rightPaper * 1.4), L.paper)
          const [f1, , w1, h1] = leaf(rightTop)
          drawLeaf(c, f1, f1, w1, h1, spineX, cy, 0, false)
        }
      }
      if (rightTop === 0) {
        stack(c, spineX + 0, cy, PW, PH, 1, Math.min(16, 2 + (pl.kmax + 1) * 1.4), L.paper)
        const [f0, , w0, h0] = leaf(0)
        drawLeaf(c, f0, f0, w0, h0, spineX, cy, 0, false)
      }
      // the turning leaf
      if (turning >= 0) {
        const [f, b, w, h] = leaf(turning)
        drawLeaf(c, f, b, w, h, spineX, cy, th, true)
      }
      c.restore()

      // warm light from the top
      const lg = c.createLinearGradient(0, 0, 0, H)
      lg.addColorStop(0, 'rgba(255,240,210,.10)')
      lg.addColorStop(0.5, 'rgba(255,240,210,0)')
      c.fillStyle = lg
      c.fillRect(0, 0, W, H)
    },
  }
}

const SPR: SpriteId[][] = [
  ['sparkle', 'heart', 'petal', 'ring'],
  ['sparkle', 'flower', 'petal', 'butterfly'],
  ['sparkle', 'star', 'diamond', 'heart'] as SpriteId[],
  ['sparkle', 'leaf', 'flower', 'petal'] as SpriteId[],
  ['sparkle', 'rose', 'heart', 'butterfly'] as SpriteId[],
  ['sparkle', 'star', 'ring', 'diamond'] as SpriteId[],
]
const PALS: Palette[] = [
  PALETTES.wedding[0],
  PALETTES.wedding[2],
  PALETTES.engagement[1],
  PALETTES.love[0],
  EXTRA.family[0],
  PALETTES.formal[0],
]
const BASES: Base[] = ['radial', 'grad', 'rays', 'radial', 'diamonds', 'grad']
const PATS: Pattern[] = ['scatter', 'rise', 'orbit', 'scatter', 'corners', 'rain']

export const BOOKS: Template[] = PALS.map((pal, i) =>
  makeBook(
    i + 1,
    {
      pal,
      paper: isLight(pal.paper) ? pal.paper : '#f3ead8',
      stagger: i % 2 === 1,
      scene: { base: BASES[i], pattern: PATS[i], sprites: SPR[i].filter((s): s is SpriteId => !!s), seed: 900 + i },
    },
    5,
  ),
)
