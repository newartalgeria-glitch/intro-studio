type C = CanvasRenderingContext2D
/** Motif drawers: centred on 0,0, about 1 unit in radius (the caller scales). a = main colour, b = accent. */
type Draw = (c: C, a: string, b: string) => void

const circ = (c: C, x: number, y: number, r: number) => {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}
const poly = (c: C, pts: number[][], close = true) => {
  c.beginPath()
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
  if (close) c.closePath()
}
const starPath = (c: C, n: number, ro: number, ri: number) => {
  c.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro
    const a = (Math.PI * i) / n - Math.PI / 2
    c.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  c.closePath()
}

export const SPRITES = {
  heart: (c, a) => {
    c.fillStyle = a
    c.beginPath()
    c.moveTo(0, 0.85)
    c.bezierCurveTo(-1.3, -0.1, -0.9, -1, -0.1, -0.55)
    c.lineTo(0, -0.45)
    c.lineTo(0.1, -0.55)
    c.bezierCurveTo(0.9, -1, 1.3, -0.1, 0, 0.85)
    c.fill()
  },
  star: (c, a) => {
    c.fillStyle = a
    starPath(c, 5, 1, 0.42)
    c.fill()
  },
  sparkle: (c, a, _b?: string) => {
    c.fillStyle = a
    starPath(c, 4, 1, 0.14)
    c.fill()
  },
  diamond: (c, a, b) => {
    c.fillStyle = a
    poly(c, [[0, -1], [0.7, -0.3], [0, 1], [-0.7, -0.3]])
    c.fill()
    c.fillStyle = b
    poly(c, [[-0.7, -0.3], [0.7, -0.3], [0.35, -0.7], [-0.35, -0.7]])
    c.globalAlpha *= 0.5
    c.fill()
    c.globalAlpha /= 0.5
  },
  flower: (c, a, b) => {
    c.fillStyle = a
    for (let i = 0; i < 6; i++) {
      c.save()
      c.rotate((i * Math.PI) / 3)
      c.beginPath()
      c.ellipse(0, -0.55, 0.3, 0.5, 0, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
    c.fillStyle = b
    circ(c, 0, 0, 0.26)
  },
  rose: (c, a, b) => {
    c.fillStyle = a
    circ(c, 0, 0, 1)
    c.strokeStyle = b
    c.lineWidth = 0.09
    c.beginPath()
    for (let i = 0; i < 60; i++) {
      const t = i / 8
      const r = 0.08 + t * 0.14
      c.lineTo(Math.cos(t * 2.4) * r * 1.5, Math.sin(t * 2.4) * r * 1.5)
    }
    c.stroke()
  },
  leaf: (c, a, b) => {
    c.fillStyle = a
    c.beginPath()
    c.moveTo(0, -1)
    c.quadraticCurveTo(0.8, -0.1, 0, 1)
    c.quadraticCurveTo(-0.8, -0.1, 0, -1)
    c.fill()
    c.strokeStyle = b
    c.lineWidth = 0.06
    c.beginPath()
    c.moveTo(0, -0.8)
    c.lineTo(0, 0.9)
    c.stroke()
  },
  petal: (c, a) => {
    c.fillStyle = a
    c.beginPath()
    c.moveTo(0, -1)
    c.quadraticCurveTo(0.8, -0.2, 0, 1)
    c.quadraticCurveTo(-0.8, -0.2, 0, -1)
    c.fill()
  },
  ring: (c, a, b) => {
    c.strokeStyle = a
    c.lineWidth = 0.16
    c.beginPath()
    c.arc(0, 0.2, 0.62, 0, Math.PI * 2)
    c.stroke()
    c.fillStyle = b
    poly(c, [[0, -0.95], [0.3, -0.62], [0, -0.3], [-0.3, -0.62]])
    c.fill()
  },
  balloon: (c, a, b) => {
    c.fillStyle = a
    c.beginPath()
    c.ellipse(0, -0.2, 0.65, 0.8, 0, 0, Math.PI * 2)
    c.fill()
    poly(c, [[0, 0.62], [-0.12, 0.8], [0.12, 0.8]])
    c.fill()
    c.strokeStyle = b
    c.lineWidth = 0.05
    c.beginPath()
    c.moveTo(0, 0.8)
    c.bezierCurveTo(-0.2, 1, 0.2, 1.1, 0, 1.3)
    c.stroke()
    c.fillStyle = 'rgba(255,255,255,.35)'
    c.beginPath()
    c.ellipse(-0.25, -0.5, 0.1, 0.2, 0.5, 0, Math.PI * 2)
    c.fill()
  },
  cloud: (c, a) => {
    c.fillStyle = a
    circ(c, -0.45, 0.1, 0.4)
    circ(c, 0, -0.15, 0.5)
    circ(c, 0.5, 0.1, 0.38)
    c.fillRect(-0.45, 0.1, 0.95, 0.38)
    circ(c, -0.45, 0.48, 0.0)
  },
  crescent: (c, a) => {
    c.fillStyle = a
    c.save()
    c.beginPath()
    c.arc(0, 0, 0.9, 0, Math.PI * 2)
    c.clip()
    c.beginPath()
    c.rect(-2, -2, 4, 4)
    c.arc(0.38, -0.2, 0.78, 0, Math.PI * 2)
    c.fill('evenodd')
    c.restore()
  },
  footprint: (c, a) => {
    c.fillStyle = a
    c.beginPath()
    c.ellipse(0, 0.4, 0.45, 0.58, 0, 0, Math.PI * 2)
    c.fill()
    for (const [x, y, r] of [[-0.45, -0.45, 0.17], [-0.17, -0.7, 0.16], [0.13, -0.72, 0.15], [0.4, -0.55, 0.14], [0.6, -0.3, 0.12]]) circ(c, x, y, r)
  },
  bow: (c, a, b) => {
    c.fillStyle = a
    poly(c, [[0, 0], [-1, -0.6], [-1, 0.6]])
    c.fill()
    poly(c, [[0, 0], [1, -0.6], [1, 0.6]])
    c.fill()
    c.fillStyle = b
    circ(c, 0, 0, 0.28)
  },
  butterfly: (c, a, b) => {
    c.fillStyle = a
    for (const s of [-1, 1]) {
      c.beginPath()
      c.ellipse(s * 0.5, -0.4, 0.5, 0.6, s * 0.5, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.ellipse(s * 0.4, 0.4, 0.35, 0.45, -s * 0.4, 0, Math.PI * 2)
      c.fill()
    }
    c.fillStyle = b
    c.fillRect(-0.06, -0.7, 0.12, 1.4)
  },
  cap: (c, a, b) => {
    c.fillStyle = a
    poly(c, [[0, -0.6], [1, -0.15], [0, 0.3], [-1, -0.15]])
    c.fill()
    poly(c, [[-0.55, 0.05], [-0.55, 0.55], [0, 0.8], [0.55, 0.55], [0.55, 0.05], [0, 0.3]])
    c.fill()
    c.strokeStyle = b
    c.lineWidth = 0.07
    c.beginPath()
    c.moveTo(0.85, -0.1)
    c.lineTo(0.85, 0.6)
    c.stroke()
    circ(c, 0.85, 0.65, 0.1)
  },
  scroll: (c, a, b) => {
    c.fillStyle = a
    c.fillRect(-0.8, -0.5, 1.6, 1)
    c.fillStyle = b
    c.fillRect(-0.9, -0.6, 0.2, 1.2)
    c.fillRect(0.7, -0.6, 0.2, 1.2)
    c.fillRect(-0.45, -0.15, 0.9, 0.07)
    c.fillRect(-0.45, 0.1, 0.9, 0.07)
  },
  book: (c, a, b) => {
    c.fillStyle = a
    poly(c, [[-1, -0.6], [0, -0.4], [0, 0.7], [-1, 0.5]])
    c.fill()
    poly(c, [[1, -0.6], [0, -0.4], [0, 0.7], [1, 0.5]])
    c.fill()
    c.strokeStyle = b
    c.lineWidth = 0.06
    c.beginPath()
    c.moveTo(0, -0.4)
    c.lineTo(0, 0.7)
    c.stroke()
  },
  laurel: (c, a) => {
    c.fillStyle = a
    for (const s of [-1, 1])
      for (let i = 0; i < 7; i++) {
        const t = i / 6
        c.save()
        c.translate(s * (0.85 - t * 0.5 + (t * t) * 0.25), 0.7 - t * 1.5)
        c.rotate(s * (0.5 - t * 1.2))
        c.beginPath()
        c.ellipse(0, 0, 0.12, 0.28, 0, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }
  },
  house: (c, a, b) => {
    c.fillStyle = a
    c.fillRect(-0.6, -0.1, 1.2, 0.9)
    poly(c, [[-0.85, -0.05], [0, -0.85], [0.85, -0.05]])
    c.fill()
    c.fillStyle = b
    c.fillRect(-0.15, 0.3, 0.3, 0.5)
  },
  tree: (c, a, b) => {
    c.fillStyle = b
    c.fillRect(-0.1, 0.2, 0.2, 0.75)
    c.fillStyle = a
    circ(c, 0, -0.4, 0.55)
    circ(c, -0.45, 0.05, 0.42)
    circ(c, 0.45, 0.05, 0.42)
  },
  sun: (c, a) => {
    c.fillStyle = a
    c.strokeStyle = a
    c.lineWidth = 0.1
    circ(c, 0, 0, 0.45)
    for (let i = 0; i < 10; i++) {
      c.save()
      c.rotate((i * Math.PI) / 5)
      c.beginPath()
      c.moveTo(0, -0.62)
      c.lineTo(0, -0.95)
      c.stroke()
      c.restore()
    }
  },
  crest: (c, a, b) => {
    c.fillStyle = a
    c.beginPath()
    c.moveTo(-0.7, -0.8)
    c.lineTo(0.7, -0.8)
    c.lineTo(0.7, 0.1)
    c.quadraticCurveTo(0.7, 0.7, 0, 1)
    c.quadraticCurveTo(-0.7, 0.7, -0.7, 0.1)
    c.closePath()
    c.fill()
    c.fillStyle = b
    starPath(c, 5, 0.4, 0.17)
    c.translate(0, -0.05)
    c.fill()
  },
  note: (c, a) => {
    c.fillStyle = a
    c.strokeStyle = a
    c.lineWidth = 0.12
    c.beginPath()
    c.ellipse(-0.35, 0.65, 0.35, 0.25, -0.4, 0, Math.PI * 2)
    c.fill()
    c.beginPath()
    c.moveTo(-0.03, 0.55)
    c.lineTo(-0.03, -0.9)
    c.quadraticCurveTo(0.5, -0.7, 0.55, -0.2)
    c.stroke()
  },
  splash: (c, a) => {
    c.fillStyle = a
    circ(c, 0, 0, 0.55)
    for (let i = 0; i < 7; i++) {
      const an = i * 0.9 + 0.3
      circ(c, Math.cos(an) * 0.7, Math.sin(an) * 0.7, 0.16 + (i % 3) * 0.06)
    }
  },
  palette: (c, a, b) => {
    c.fillStyle = a
    c.beginPath()
    c.ellipse(0, 0, 1, 0.78, 0, 0, Math.PI * 2)
    c.moveTo(0.55, 0.3)
    c.arc(0.35, 0.3, 0.2, 0, Math.PI * 2)
    c.fill('evenodd')
    c.fillStyle = b
    for (const [x, y] of [[-0.5, -0.1], [-0.15, -0.42], [0.25, -0.35]]) circ(c, x, y, 0.15)
  },
  cake: (c, a, b) => {
    c.fillStyle = a
    c.fillRect(-0.8, 0.1, 1.6, 0.75)
    c.fillStyle = b
    c.fillRect(-0.55, -0.35, 1.1, 0.45)
    c.fillRect(-0.04, -0.85, 0.08, 0.5)
    c.beginPath()
    c.ellipse(0, -0.95, 0.09, 0.14, 0, 0, Math.PI * 2)
    c.fill()
  },
  gift: (c, a, b) => {
    c.fillStyle = a
    c.fillRect(-0.8, -0.2, 1.6, 1.0)
    c.fillStyle = b
    c.fillRect(-0.1, -0.2, 0.2, 1.0)
    c.fillRect(-0.85, -0.45, 1.7, 0.3)
    circ(c, -0.25, -0.62, 0.2)
    circ(c, 0.25, -0.62, 0.2)
  },
  hat: (c, a, b) => {
    c.fillStyle = a
    poly(c, [[0, -1], [0.7, 0.8], [-0.7, 0.8]])
    c.fill()
    c.fillStyle = b
    circ(c, 0, -1, 0.17)
    c.fillRect(-0.6, 0.62, 1.2, 0.18)
  },
  dot: (c, a) => {
    c.fillStyle = a
    circ(c, 0, 0, 0.6)
  },
} satisfies Record<string, Draw>

export type SpriteId = keyof typeof SPRITES
