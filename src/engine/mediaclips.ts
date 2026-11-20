/** Chroma-key layer: a picture, logo or video placed over the video, with one colour made transparent. */
export interface MediaClip {
  id: number
  kind: 'image' | 'video'
  name: string
  /** seconds on the timeline */
  start: number
  dur: number
  /** 0 = first media track */
  track: number
  /** centre and size in the 1920x1080 frame */
  x: number
  y: number
  w: number
  h: number
  /** videos: where in the source file the clip begins */
  inPt: number
  /** key colour; empty = no keying (picture shown as it is) */
  key: string
  /** 0..1 how far from the key colour still counts as background */
  tol: number
  /** 0..1 softness of the edge (fade range) */
  feather: number
  /** 0..1 */
  opacity: number
}

export interface MediaSrc {
  kind: 'image' | 'video'
  el: HTMLImageElement | HTMLVideoElement
  w: number
  h: number
  duration: number
  blob: Blob
  url: string
}

const REG = new Map<number, MediaSrc>()
export const mediaSrc = (id: number) => REG.get(id)
export const setMediaSrc = (id: number, s: MediaSrc) => REG.set(id, s)
export const dropMediaSrc = (id: number) => {
  const s = REG.get(id)
  if (s) URL.revokeObjectURL(s.url)
  REG.delete(id)
}
export const clearMediaSrc = () => [...REG.keys()].forEach(dropMediaSrc)

let redraw: (() => void) | null = null
export const setMediaRedraw = (f: (() => void) | null) => {
  redraw = f
}

export async function loadMedia(file: Blob, nameHint = ''): Promise<MediaSrc> {
  const url = URL.createObjectURL(file)
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(nameHint)
  if (!isVideo) {
    const el = new Image()
    el.src = url
    await el.decode()
    return { kind: 'image', el, w: el.naturalWidth, h: el.naturalHeight, duration: 0, blob: file, url }
  }
  const el = document.createElement('video')
  el.muted = true
  el.playsInline = true
  el.preload = 'auto'
  el.loop = false
  el.src = url
  await new Promise<void>((res, rej) => {
    el.onloadeddata = () => res()
    el.onerror = () => rej(new Error('video'))
  })
  el.onloadeddata = null
  el.onerror = null
  el.addEventListener('seeked', () => redraw?.())
  return { kind: 'video', el, w: el.videoWidth, h: el.videoHeight, duration: el.duration || 1, blob: file, url }
}

export const activeMedia = (k: MediaClip, t: number) => t >= k.start && t <= k.start + k.dur

/** time inside the source file (videos loop when the clip is longer than the file) */
export function srcTime(k: MediaClip, s: MediaSrc, t: number) {
  const d = Math.max(0.05, s.duration - 0.05)
  const x = k.inPt + (t - k.start)
  return Math.min(d, Math.max(0, x % (s.duration || 1)))
}

// ---------- colour key ----------
function hexRgb(h: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim())
  const n = m ? parseInt(m[1], 16) : 0x00ff00
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const yuv = (r: number, g: number, b: number): [number, number, number] => [
  0.299 * r + 0.587 * g + 0.114 * b,
  128 - 0.168736 * r - 0.331264 * g + 0.5 * b,
  128 + 0.5 * r - 0.418688 * g - 0.081312 * b,
]

/** Makes the key colour transparent. Works for any colour: coloured keys are compared by hue/saturation
 *  (so shadows on a green screen still go), grey keys (black, white) by brightness. */
export function applyKey(img: ImageData, key: string, tol: number, feather: number) {
  const [kr, kg, kb] = hexRgb(key)
  const [ky, kcb, kcr] = yuv(kr, kg, kb)
  const sat = Math.hypot(kcb - 128, kcr - 128) / 128
  const wc = Math.min(1, sat * 2.5)
  const d = img.data
  const soft = Math.max(0.001, feather)
  for (let i = 0; i < d.length; i += 4) {
    const [y, cb, cr] = yuv(d[i], d[i + 1], d[i + 2])
    const dc = Math.min(1.5, Math.hypot(cb - kcb, cr - kcr) / 128)
    const dy = Math.abs(y - ky) / 255
    const dist = wc * (dc + 0.12 * dy) + (1 - wc) * (dy + 0.25 * dc * (1 - wc))
    const a = Math.min(1, Math.max(0, (dist - tol) / soft))
    d[i + 3] = Math.round(d[i + 3] * a)
  }
}

let work: HTMLCanvasElement | null = null
const still = new Map<string, HTMLCanvasElement>()

function keyed(k: MediaClip, s: MediaSrc, rw: number, rh: number): CanvasImageSource {
  const make = (cv: HTMLCanvasElement) => {
    cv.width = rw
    cv.height = rh
    const c = cv.getContext('2d', { willReadFrequently: true })!
    c.clearRect(0, 0, rw, rh)
    c.drawImage(s.el, 0, 0, rw, rh)
    const im = c.getImageData(0, 0, rw, rh)
    applyKey(im, k.key, k.tol, k.feather)
    c.putImageData(im, 0, 0)
    return cv
  }
  if (s.kind === 'image') {
    const id = `${k.id}|${rw}x${rh}|${k.key}|${k.tol}|${k.feather}`
    let cv = still.get(id)
    if (!cv) {
      if (still.size > 24) still.clear()
      cv = make(document.createElement('canvas'))
      still.set(id, cv)
    }
    return cv
  }
  if (!work) work = document.createElement('canvas')
  return make(work)
}

export function drawMedia(c: CanvasRenderingContext2D, t: number, clips: MediaClip[]) {
  if (!clips.length) return
  const list = clips.filter((k) => activeMedia(k, t)).sort((a, b) => a.track - b.track)
  for (const k of list) {
    const s = REG.get(k.id)
    if (!s) continue
    // never process more pixels than will be seen
    const rw = Math.max(2, Math.round(Math.min(k.w, s.w, 1280)))
    const rh = Math.max(2, Math.round((rw * k.h) / Math.max(1, k.w)))
    c.save()
    c.globalAlpha = Math.max(0, Math.min(1, k.opacity))
    if (k.key) {
      const src = keyed(k, s, rw, rh)
      c.drawImage(src, k.x - k.w / 2, k.y - k.h / 2, k.w, k.h)
    } else {
      c.drawImage(s.el, k.x - k.w / 2, k.y - k.h / 2, k.w, k.h)
    }
    c.restore()
  }
}

/** Preview: put every visible video on the right frame (or let it play). */
export function syncVideos(clips: MediaClip[], t: number, playing: boolean) {
  for (const k of clips) {
    const s = REG.get(k.id)
    if (!s || s.kind !== 'video') continue
    const v = s.el as HTMLVideoElement
    if (!activeMedia(k, t)) {
      if (!v.paused) v.pause()
      continue
    }
    const want = srcTime(k, s, t)
    if (playing) {
      if (v.paused || Math.abs(v.currentTime - want) > 0.35) v.currentTime = want
      if (v.paused) v.play().catch(() => {})
    } else {
      if (!v.paused) v.pause()
      if (Math.abs(v.currentTime - want) > 0.02) v.currentTime = want
    }
  }
}

/** Export: exact frame for time t (waits until the browser has it). */
export async function prepareMedia(clips: MediaClip[], t: number) {
  const jobs: Promise<void>[] = []
  for (const k of clips) {
    const s = REG.get(k.id)
    if (!s || s.kind !== 'video' || !activeMedia(k, t)) continue
    const v = s.el as HTMLVideoElement
    if (!v.paused) v.pause()
    const want = srcTime(k, s, t)
    if (Math.abs(v.currentTime - want) < 0.001) continue
    jobs.push(
      new Promise<void>((res) => {
        const done = () => {
          v.removeEventListener('seeked', done)
          clearTimeout(to)
          res()
        }
        const to = setTimeout(done, 3000)
        v.addEventListener('seeked', done)
        v.currentTime = want
      }),
    )
  }
  await Promise.all(jobs)
}

/** colour of the unkeyed source at a point (fx, fy in 0..1 inside the clip) */
export function sampleColor(k: MediaClip, fx: number, fy: number): string | null {
  const s = REG.get(k.id)
  if (!s) return null
  const cv = document.createElement('canvas')
  cv.width = 64
  cv.height = 64
  const c = cv.getContext('2d', { willReadFrequently: true })!
  const sw = s.w, sh = s.h
  const px = Math.min(sw - 1, Math.max(0, Math.round(fx * sw)))
  const py = Math.min(sh - 1, Math.max(0, Math.round(fy * sh)))
  c.drawImage(s.el, Math.max(0, px - 2), Math.max(0, py - 2), 5, 5, 0, 0, 5, 5)
  const d = c.getImageData(0, 0, 5, 5).data
  let r = 0, g = 0, b = 0
  for (let i = 0; i < d.length; i += 4) {
    r += d[i]; g += d[i + 1]; b += d[i + 2]
  }
  const n = d.length / 4
  const h = (v: number) => Math.round(v / n).toString(16).padStart(2, '0')
  return '#' + h(r) + h(g) + h(b)
}
