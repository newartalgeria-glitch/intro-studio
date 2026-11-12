import type { RenderCtx } from '../types'
import type { Palette } from '../palettes'

export interface Layout {
  id: 'arch' | 'album' | 'panels' | 'cinema' | 'polaroid'
  duration(r: RenderCtx): number
  make(pal: Palette): (c: CanvasRenderingContext2D, t: number, r: RenderCtx) => void
}
