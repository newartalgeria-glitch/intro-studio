import type { Template } from './types'
import { BOOKS } from './book'
import { EXTRA, OCCASIONS, PALETTES } from './palettes'
import type { Occasion } from './palettes'
import { arch } from './layouts/arch'
import { album } from './layouts/album'
import { panels } from './layouts/panels'
import { cinema } from './layouts/cinema'
import { polaroid } from './layouts/polaroid'
import type { Base, Pattern } from './scenes'
import type { SpriteId } from './sprites'
import { RECIPES } from './motion'
import { makeLong } from './long'
import type { CardStyle, Design, Side } from './long'
import { toBlack } from './simple'
import { KINDS } from './choreo'

export const LAYOUTS = [arch, album, panels, cinema, polaroid]
export const LAYOUT_IDS = LAYOUTS.map((l) => l.id)

/** What each occasion's backgrounds are made of. */
const THEME: Record<string, { sprites: SpriteId[]; bases: Base[] }> = {
  wedding: { sprites: ['flower', 'ring', 'heart', 'leaf', 'sparkle', 'rose', 'petal'], bases: ['grad', 'radial', 'diamonds', 'rays', 'stripes'] },
  engagement: { sprites: ['ring', 'diamond', 'heart', 'sparkle', 'bow', 'star', 'rose'], bases: ['radial', 'grad', 'rays', 'diamonds', 'stripes'] },
  babyBoy: { sprites: ['cloud', 'star', 'balloon', 'crescent', 'footprint', 'sparkle', 'dot'], bases: ['bands', 'grad', 'radial', 'stripes', 'rays'] },
  babyGirl: { sprites: ['bow', 'heart', 'butterfly', 'flower', 'cloud', 'balloon', 'star'], bases: ['bands', 'grad', 'radial', 'stripes', 'diamonds'] },
  graduation: { sprites: ['cap', 'scroll', 'laurel', 'star', 'book', 'sparkle', 'crest'], bases: ['radial', 'grad', 'rays', 'stripes', 'diamonds'] },
  family: { sprites: ['house', 'tree', 'heart', 'sun', 'leaf', 'flower', 'footprint'], bases: ['bands', 'grad', 'radial', 'stripes', 'diamonds'] },
  formal: { sprites: ['laurel', 'star', 'crest', 'diamond', 'sparkle', 'scroll', 'ring'], bases: ['radial', 'grad', 'stripes', 'diamonds', 'rays'] },
  artistic: { sprites: ['splash', 'palette', 'note', 'star', 'sparkle', 'diamond', 'dot'], bases: ['grad', 'radial', 'bands', 'rays', 'stripes'] },
  birthday: { sprites: ['balloon', 'cake', 'gift', 'hat', 'star', 'sparkle', 'dot'], bases: ['bands', 'grad', 'radial', 'rays', 'stripes'] },
  love: { sprites: ['heart', 'rose', 'butterfly', 'sparkle', 'petal', 'ring', 'flower'], bases: ['radial', 'grad', 'rays', 'diamonds', 'bands'] },
}
const PATTERNS: Pattern[] = ['rain', 'rise', 'corners', 'border', 'scatter', 'orbit', 'sides', 'wave']
const SIDES: Side[] = ['R', 'L', 'T']
const CARDS: CardStyle[] = ['plain', 'polaroid', 'gold', 'round']
const SECS = [6, 4, 6, 5]

/** The i-th of the 15 designs of one occasion. Each differs in background, motif, motion, frame shape and text position, not only colour. */
function designOf(occ: string, oi: number, i: number): Design {
  const th = THEME[occ]
  const pals = [...PALETTES[occ as Occasion], ...EXTRA[occ as Occasion]]
  const s0 = (i * 2 + oi) % th.sprites.length
  const sprites = [0, 1, 2, 3].map((k) => th.sprites[(s0 + k) % th.sprites.length])
  return {
    occ,
    num: i + 1,
    pal: pals[(i * 2 + oi) % pals.length],
    layout: KINDS[(i + oi) % KINDS.length],
    bg: i % 4 === 1 ? 'palette' : 'blur',
    card: CARDS[(i * 3 + oi) % 4],
    side: SIDES[(i + oi * 2) % 3],
    recipe: RECIPES[(i + oi * 3) % RECIPES.length],
    sec: SECS[(i * 2 + oi) % 4],
    scene: { base: th.bases[(i * 2 + oi) % th.bases.length], pattern: PATTERNS[(i * 3 + oi * 2) % PATTERNS.length], sprites, seed: oi * 40 + i + 1 },
  }
}

/** 10 occasions x 15 designs. */
const LONG: Template[] = Object.keys(THEME).flatMap((occ, oi) => Array.from({ length: 15 }, (_, i) => makeLong(designOf(occ, oi, i))))

/** "Simple": the 15 wedding designs without any motif or pattern, on a plain black background. */
const SIMPLE: Template[] = Array.from({ length: 15 }, (_, i) => {
  const d = designOf('wedding', 0, i)
  return makeLong({ ...d, occ: 'simple', plain: true, pal: toBlack(d.pal) })
})

/** The 22 short designs kept from the first version (two from each old category) live in "general". */
const LEGACY: Template[] = OCCASIONS.flatMap((occ, k) =>
  [
    [k % 5, k % 3],
    [(k + 2) % 5, (k + 1) % 3],
  ].map(([li, vi], n): Template => {
    const l = LAYOUTS[li]
    const pal = PALETTES[occ][vi]
    return {
      id: `general:${occ}:${l.id}:${vi}`,
      occasion: 'general',
      layout: l.id,
      variant: vi,
      swatch: [pal.bg0, pal.frame, pal.name],
      kind: 'legacy',
      num: k * 2 + n + 1,
      tag: occ,
      defaultWin: (r) => {
        const d = l.duration(r)
        return { headline: [0, d], name1: [0, d], connector: [0, d], name2: [0, d], date: [0, d], place: [0, d], footer: [0, d] }
      },
      duration: l.duration,
      render: l.make(pal),
    }
  }),
)

export const CATALOG: Template[] = [...LONG, ...SIMPLE, ...LEGACY, ...BOOKS]

/** Ids from older versions of the tool map to the closest template that still exists. */
export function resolveId(id: string): string {
  if (CATALOG.some((t) => t.id === id)) return id
  const old: Record<string, string> = { gold: 'wedding:arch:0', album: 'wedding:album:0', modern: 'general:panels:1', formal: 'formal:cinema:0' }
  const full = old[id] ?? id
  const [occ, lay, v] = full.split(':')
  const hit = CATALOG.find((t) => t.kind === 'legacy' && t.tag === occ && t.layout === lay && String(t.variant) === v)
  if (hit) return hit.id
  const first = CATALOG.find((t) => t.occasion === occ)
  return first ? first.id : 'wedding:1'
}
