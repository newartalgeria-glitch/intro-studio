import type { Pic } from './types'

const MAX_SIDE = 2000

/** Decode an uploaded file into a size-limited canvas + small thumbnail. */
export async function loadPhoto(file: File): Promise<{ pic: Pic; thumb: string }> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * k)
  const h = Math.round(bmp.height * k)
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  cv.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  const tk = 120 / Math.max(w, h)
  const th = document.createElement('canvas')
  th.width = Math.round(w * tk)
  th.height = Math.round(h * tk)
  th.getContext('2d')!.drawImage(cv, 0, 0, th.width, th.height)
  return { pic: { src: cv, w, h }, thumb: th.toDataURL('image/jpeg', 0.8) }
}

/** Soft portrait-shaped stand-ins shown until real photos are added. */
export function placeholders(): Pic[] {
  const tones: [string, string, string][] = [
    ['#5b4a63', '#c9a9a0', '#f1dcc9'],
    ['#2f4c52', '#7fa79d', '#e4e0c8'],
    ['#6a4a3a', '#d09a74', '#f6e3c8'],
  ]
  return tones.map(([a, b, c], i) => {
    const W = 1200
    const H = 1500
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const x = cv.getContext('2d')!
    const g = x.createLinearGradient(0, 0, W * 0.6, H)
    g.addColorStop(0, a)
    g.addColorStop(0.6, b)
    g.addColorStop(1, c)
    x.fillStyle = g
    x.fillRect(0, 0, W, H)
    // two overlapping figures (a couple) - abstract, no faces
    x.fillStyle = 'rgba(255,255,255,0.16)'
    const dx = i % 2 === 0 ? -60 : 60
    for (const [cx, cy, rr] of [
      [520 + dx, 560, 150],
      [700 + dx, 590, 140],
    ]) {
      x.beginPath()
      x.arc(cx, cy, rr, 0, Math.PI * 2)
      x.fill()
    }
    x.beginPath()
    x.ellipse(520 + dx, 1180, 250, 440, 0, Math.PI, 0)
    x.ellipse(700 + dx, 1190, 240, 430, 0, Math.PI, 0)
    x.fill()
    const v = x.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1000)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(0,0,0,0.35)')
    x.fillStyle = v
    x.fillRect(0, 0, W, H)
    return { src: cv, w: W, h: H }
  })
}

/** Overlay pictures keep their transparency, so they are stored as PNG at a modest size. */
export async function loadOverlayImage(file: File): Promise<{ pic: Pic; thumb: string }> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 1024 / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * k))
  const h = Math.max(1, Math.round(bmp.height * k))
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  cv.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  const tk = 96 / Math.max(w, h)
  const th = document.createElement('canvas')
  th.width = Math.max(1, Math.round(w * tk))
  th.height = Math.max(1, Math.round(h * tk))
  th.getContext('2d')!.drawImage(cv, 0, 0, th.width, th.height)
  return { pic: { src: cv, w, h }, thumb: th.toDataURL('image/png') }
}
