import type { Palette } from './palettes'
import { rgba } from './palettes'

type C = CanvasRenderingContext2D
export type FrameId = 'rect' | 'round' | 'arch' | 'oval' | 'circle' | 'hex' | 'heart' | 'diamond' | 'cut' | 'polaroid' | 'stack'
export const FRAMES: FrameId[] = ['rect', 'round', 'arch', 'oval', 'circle', 'hex', 'heart', 'diamond', 'cut', 'polaroid', 'stack']

function path(c: C, id: FrameId, x: number, y: number, w: number, h: number) {
  c.beginPath()
  const cx = x + w / 2
  const cy = y + h / 2
  switch (id) {
    case 'round':
      c.roundRect(x, y, w, h, 46)
      break
    case 'arch': {
      const ry = Math.min(h * 0.42, w / 2)
      c.moveTo(x, y + h)
      c.lineTo(x, y + ry)
      c.ellipse(cx, y + ry, w / 2, ry, 0, Math.PI, 0)
      c.lineTo(x + w, y + h)
      c.closePath()
      break
    }
    case 'oval':
      c.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
      break
    case 'circle':
      c.arc(cx, cy, Math.min(w, h) / 2, 0, Math.PI * 2)
      break
    case 'hex':
      c.moveTo(x + w * 0.25, y)
      c.lineTo(x + w * 0.75, y)
      c.lineTo(x + w, cy)
      c.lineTo(x + w * 0.75, y + h)
      c.lineTo(x + w * 0.25, y + h)
      c.lineTo(x, cy)
      c.closePath()
      break
    case 'diamond':
      c.moveTo(cx, y)
      c.lineTo(x + w, cy)
      c.lineTo(cx, y + h)
      c.lineTo(x, cy)
      c.closePath()
      break
    case 'cut': {
      const k = Math.min(w, h) * 0.14
      c.moveTo(x + k, y)
      c.lineTo(x + w - k, y)
      c.lineTo(x + w, y + k)
      c.lineTo(x + w, y + h - k)
      c.lineTo(x + w - k, y + h)
      c.lineTo(x + k, y + h)
      c.lineTo(x, y + h - k)
      c.lineTo(x, y + k)
      c.closePath()
      break
    }
    case 'heart': {
      const sx = w / 104
      const sy = h / 84
      const X = (v: number) => cx + v * sx
      const Y = (v: number) => y + (v + 46) * sy
      c.moveTo(X(0), Y(38))
      c.bezierCurveTo(X(-62), Y(-2), X(-44), Y(-46), X(-4), Y(-26))
      c.bezierCurveTo(X(-1), Y(-24), X(0), Y(-22), X(0), Y(-20))
      c.bezierCurveTo(X(0), Y(-22), X(1), Y(-24), X(4), Y(-26))
      c.bezierCurveTo(X(44), Y(-46), X(62), Y(-2), X(0), Y(38))
      c.closePath()
      break
    }
    default:
      c.rect(x, y, w, h)
  }
}

/** Draws `paint` clipped to the frame shape, with shadow and a double line in the palette colour. */
export function drawFramed(c: C, id: FrameId, x: number, y: number, w: number, h: number, pal: Palette, t: number, paint: (x: number, y: number, w: number, h: number) => void) {
  c.save()
  if (id === 'polaroid' || id === 'stack') {
    const cx = x + w / 2
    const cy = y + h / 2
    const card = (rot: number, fill: string, dx = 0, dy = 0) => {
      c.save()
      c.translate(cx + dx, cy + dy)
      c.rotate(rot)
      c.shadowColor = 'rgba(0,0,0,0.4)'
      c.shadowBlur = 36
      c.shadowOffsetY = 12
      c.fillStyle = fill
      c.fillRect(-w / 2 - 20, -h / 2 - 20, w + 40, h + (id === 'polaroid' ? 110 : 40))
      c.restore()
    }
    if (id === 'stack') {
      card(-0.07, rgba(pal.paper, 0.85), -14, 8)
      card(0.05, rgba(pal.paper, 0.92), 12, -4)
    }
    const rot = id === 'polaroid' ? -0.035 + Math.sin(t * 0.4) * 0.004 : 0
    card(rot, pal.paper)
    c.translate(cx, cy)
    c.rotate(rot)
    c.translate(-cx, -cy)
    c.beginPath()
    c.rect(x, y, w, h)
    c.clip()
    paint(x, y, w, h)
    c.restore()
    return
  }
  path(c, id, x, y, w, h)
  c.shadowColor = 'rgba(0,0,0,0.45)'
  c.shadowBlur = 40
  c.shadowOffsetY = 14
  c.fillStyle = '#000'
  c.fill()
  c.shadowColor = 'transparent'
  c.save()
  c.clip()
  paint(x, y, w, h)
  c.restore()
  path(c, id, x, y, w, h)
  c.strokeStyle = pal.frame
  c.lineWidth = 7
  c.stroke()
  const g = id === 'circle' || id === 'heart' || id === 'diamond' || id === 'oval' ? 26 : 22
  path(c, id, x - g, y - g, w + g * 2, h + g * 2)
  c.strokeStyle = rgba(pal.frame, 0.55)
  c.lineWidth = 2
  c.stroke()
  c.restore()
}
