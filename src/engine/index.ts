import type { FieldKey, FieldStyles, IntroData, OverlayItem, Pic, RenderCtx, Template, Transition, Wins } from './types'
import { drawOverlays } from './overlays'
import { CATALOG } from './catalog'
import { placeholders } from './pics'
import { DEFAULT_PHOTO_SEC } from './long'
import { drawTexts } from './textclips'
import type { TextClip } from './textclips'
import { drawMedia } from './mediaclips'
import type { MediaClip } from './mediaclips'
import { reset, seg, setActiveStyles, setActiveTimes } from './util'

export const TEMPLATES: Template[] = CATALOG
export { LAYOUT_IDS, resolveId } from './catalog'
export { OCCASIONS } from './palettes'
export type { Occasion } from './palettes'
export { loadFonts } from './fonts'
export type { Wins } from './types'
export { setHitSink } from './util'
export type { Hit } from './util'
export { DEFAULT_PHOTO_SEC } from './long'
export type { IntroData, Pic, RenderCtx, Template, Kind, FieldKey, FieldStyle, FieldStyles } from './types'
export { FONTS } from './fonts'
export { boxOf, activeAt, defaultFont } from './textclips'
export type { TextClip, Box } from './textclips'
export { drawMedia, syncVideos, prepareMedia, loadMedia, setMediaSrc, dropMediaSrc, clearMediaSrc, mediaSrc, setMediaRedraw, sampleColor, activeMedia } from './mediaclips'
export type { MediaClip, MediaSrc } from './mediaclips'
export { PRESETS, SHAPES, MOTIONS, drawPreset } from './overlays'
export type { Preset } from './overlays'
export type { OverlayItem, Transition, Motion, Shape } from './types'
export const TRANSITIONS: Transition[] = ['auto', 'fade', 'slideX', 'slideY', 'zoom', 'wipe', 'blinds', 'flash', 'spin']

let stand: Pic[] | null = null

export interface Extras {
  overlays?: OverlayItem[]
  customs?: Record<number, Pic>
  transition?: Transition
  /** wanted video length in seconds (long templates): photos repeat to fill it. 0 = follow the photos */
  length?: number
  /** seconds per photo, same order as photos */
  durs?: number[]
  /** user-moved text windows */
  wins?: Partial<Wins>
  tpl?: Template
  texts?: TextClip[]
  mclips?: MediaClip[]
}

const FIELDS: FieldKey[] = ['headline', 'name1', 'connector', 'name2', 'date', 'place', 'footer']

export function makeRenderCtx(data: IntroData, photos: Pic[], styles: FieldStyles = {}, x: Extras = {}): RenderCtx {
  if (!stand) stand = placeholders()
  const real = photos.length > 0
  const base = real ? photos.map((_, i) => x.durs?.[i] ?? DEFAULT_PHOTO_SEC) : [5, 5, 5, 5, 5, 5]
  const durs = [...base]
  const want = x.tpl?.kind === 'long' && x.length ? x.length - 2 : 0
  if (want > 0) {
    let sum = durs.reduce((a, b) => a + b, 0)
    for (let i = 0; sum < want - 0.5 && i < 400; i++) {
      const d = Math.min(base[i % base.length], want - sum)
      if (d < 2) break
      durs.push(d)
      sum += d
    }
  }
  const r: RenderCtx = {
    texts: x.texts ?? [],
    mclips: x.mclips ?? [],
    W: 1920,
    H: 1080,
    data,
    styles,
    overlays: x.overlays ?? [],
    customs: x.customs ?? {},
    transition: x.transition ?? 'auto',
    pics: real ? photos : stand,
    durs,
    real: base.length,
    win: {} as Wins,
    cache: new Map(),
  }
  const tpl = x.tpl ?? TEMPLATES[0]
  const def = tpl.defaultWin(r)
  const dur = tpl.duration(r)
  const win = {} as Wins
  for (const k of FIELDS) {
    const w = x.wins?.[k] ?? def[k]
    const s = Math.min(Math.max(0, w[0]), dur - 0.5)
    win[k] = [s, Math.min(dur, Math.max(s + 0.5, w[1]))]
  }
  r.win = win
  return r
}

/** Deterministic: the same (template, data, t) always gives the same pixels. */
export function renderFrame(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  tpl: Template,
  rc: RenderCtx,
  t: number,
) {
  const c = canvas.getContext('2d') as CanvasRenderingContext2D
  const k = canvas.width / rc.W
  c.setTransform(k, 0, 0, k, 0, 0)
  reset(c)
  setActiveStyles(rc.styles)
  setActiveTimes(t, rc.win)
  c.clearRect(0, 0, rc.W, rc.H)
  tpl.render(c, t, rc)
  reset(c)
  drawOverlays(c, t, rc)
  reset(c)
  drawMedia(c, t, rc.mclips)
  reset(c)
  drawTexts(c, t, rc.texts)
  reset(c)
  const dur = tpl.duration(rc)
  const a = Math.max(1 - seg(t, 0, 0.35), seg(t, dur - 0.6, dur))
  if (a > 0) {
    c.fillStyle = `rgba(0,0,0,${a})`
    c.fillRect(0, 0, rc.W, rc.H)
  }
}
