export type Kind = 'intro' | 'outro'

export interface IntroData {
  kind: Kind
  headline: string
  name1: string
  connector: string
  name2: string
  date: string
  place: string
  footer: string
}

export type FieldKey = 'headline' | 'name1' | 'connector' | 'name2' | 'date' | 'place' | 'footer'

export interface FieldStyle {
  /** FONTS id; empty = the template's own face */
  font?: string
  /** size multiplier, 1 = template default */
  scale?: number
  /** css color; empty = the template's own color */
  color?: string
  bold?: boolean
  /** offset in the 1920x1080 frame */
  dx?: number
  dy?: number
}
export type FieldStyles = Partial<Record<FieldKey, FieldStyle>>

export type Shape = 'star' | 'sparkle' | 'heart' | 'bokeh' | 'snow' | 'petal' | 'diamond' | 'leaf' | 'ring' | 'confetti'
export type Motion = 'fall' | 'rise' | 'twinkle' | 'drift' | 'burst'
export type Transition = 'auto' | 'fade' | 'slideX' | 'slideY' | 'zoom' | 'wipe' | 'blinds' | 'flash' | 'spin'

export interface OverlayItem {
  uid: number
  /** built-in preset id such as 'star-fall' */
  preset?: string
  /** index into the user's uploaded overlays */
  custom?: number
  /** custom overlays only: how the picture moves, or 'frame' = stretched over the whole picture */
  motion?: Motion | 'frame'
  opacity: number
  scale: number
}

export type Wins = Record<FieldKey, [number, number]>

export interface Pic {
  src: CanvasImageSource
  w: number
  h: number
}

export interface RenderCtx {
  /** logical size - templates always draw in 1920x1080 space */
  W: number
  H: number
  data: IntroData
  styles: FieldStyles
  overlays: OverlayItem[]
  customs: Record<number, Pic>
  transition: Transition
  pics: Pic[]
  /** seconds each photo stays on screen (long templates) */
  durs: number[]
  /** how many of durs belong to real, editable photos (the rest repeat them to fill the length) */
  real: number
  /** visible window [start, end] in seconds of every text line */
  win: Wins
  /** per-(data, photos) cache for pre-rendered pieces such as album pages */
  cache: Map<string, HTMLCanvasElement>
}

export interface Template {
  /** occasion:layout:variant, for example 'wedding:arch:0' */
  id: string
  occasion: string
  layout: string
  variant: number
  /** three colours for the little swatch next to the thumbnail */
  swatch: [string, string, string]
  /** 'long' = timeline-driven (photos + text windows); 'legacy' = fixed short animation */
  kind: 'long' | 'legacy'
  /** number inside its category, 1-based */
  num: number
  /** default seconds per photo (long templates) */
  sec?: number
  /** general only: the occasion this design was made for */
  tag?: string
  defaultWin(r: RenderCtx): Wins
  duration(r: RenderCtx): number
  render(c: CanvasRenderingContext2D, t: number, r: RenderCtx): void
}
