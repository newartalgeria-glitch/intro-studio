import type { FieldStyles, IntroData, OverlayItem, Pic, RenderCtx, Template, Transition } from './types'
import { drawOverlays } from './overlays'
import { CATALOG } from './catalog'
import { placeholders } from './pics'
import { reset, seg, setActiveStyles } from './util'

export const TEMPLATES: Template[] = CATALOG
export { LAYOUT_IDS, LEGACY_IDS } from './catalog'
export { OCCASIONS } from './palettes'
export type { Occasion } from './palettes'
export { loadFonts } from './fonts'
export type { IntroData, Pic, RenderCtx, Template, Kind, FieldKey, FieldStyle, FieldStyles } from './types'
export { FONTS } from './fonts'
export { PRESETS, SHAPES, MOTIONS, drawPreset } from './overlays'
export type { Preset } from './overlays'
export type { OverlayItem, Transition, Motion, Shape } from './types'
export const TRANSITIONS: Transition[] = ['fade', 'slideX', 'slideY', 'zoom', 'wipe', 'blinds', 'flash', 'spin']

let stand: Pic[] | null = null

export interface Extras {
  overlays?: OverlayItem[]
  customs?: Record<number, Pic>
  transition?: Transition
}

export function makeRenderCtx(data: IntroData, photos: Pic[], styles: FieldStyles = {}, x: Extras = {}): RenderCtx {
  if (!stand) stand = placeholders()
  return { W: 1920, H: 1080, data, styles, overlays: x.overlays ?? [], customs: x.customs ?? {}, transition: x.transition ?? 'fade', pics: photos.length ? photos : stand, cache: new Map() }
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
  c.clearRect(0, 0, rc.W, rc.H)
  tpl.render(c, t, rc)
  reset(c)
  drawOverlays(c, t, rc)
  reset(c)
  const dur = tpl.duration(rc)
  const a = Math.max(1 - seg(t, 0, 0.35), seg(t, dur - 0.6, dur))
  if (a > 0) {
    c.fillStyle = `rgba(0,0,0,${a})`
    c.fillRect(0, 0, rc.W, rc.H)
  }
}
