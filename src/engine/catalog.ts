import type { Template } from './types'
import { OCCASIONS, PALETTES } from './palettes'
import { arch } from './layouts/arch'
import { album } from './layouts/album'
import { panels } from './layouts/panels'
import { cinema } from './layouts/cinema'
import { polaroid } from './layouts/polaroid'

export const LAYOUTS = [arch, album, panels, cinema, polaroid]
export const LAYOUT_IDS = LAYOUTS.map((l) => l.id)

/** 11 occasions x 5 layouts x 3 palettes = 165 templates. */
export const CATALOG: Template[] = OCCASIONS.flatMap((occ) =>
  PALETTES[occ].flatMap((pal, variant) =>
    LAYOUTS.map((l): Template => ({
      id: `${occ}:${l.id}:${variant}`,
      occasion: occ,
      layout: l.id,
      variant,
      swatch: [pal.bg0, pal.frame, pal.name],
      duration: l.duration,
      render: l.make(pal),
    })),
  ),
)

/** Ids used by the first version of the tool. */
export const LEGACY_IDS: Record<string, string> = {
  gold: 'wedding:arch:0',
  album: 'wedding:album:0',
  modern: 'general:panels:1',
  formal: 'formal:cinema:0',
}
