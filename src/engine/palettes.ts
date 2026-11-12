import { FONTS, stackFor } from './fonts'

export interface Palette {
  /** background gradient, top-left to bottom-right */
  bg0: string
  bg1: string
  /** frames, rules, ornaments */
  frame: string
  /** names: base colour and the highlight that sweeps over them */
  name: string
  hi: string
  /** secondary lines (headline, place) */
  soft: string
  /** date and body lines */
  ink: string
  /** album page and photo-card paper, album cover */
  paper: string
  cover: string
  /** FONTS id used for every line of the template */
  font: string
}

export const OCCASIONS = [
  'wedding',
  'engagement',
  'babyBoy',
  'babyGirl',
  'graduation',
  'family',
  'formal',
  'artistic',
  'birthday',
  'love',
  'general',
] as const
export type Occasion = (typeof OCCASIONS)[number]

const P = (
  bg0: string,
  bg1: string,
  frame: string,
  name: string,
  hi: string,
  soft: string,
  ink: string,
  paper: string,
  cover: string,
  font: string,
): Palette => ({ bg0, bg1, frame, name, hi, soft, ink, paper, cover, font })

/** Three palettes per occasion; every one is applied to all five layouts. */
export const PALETTES: Record<Occasion, Palette[]> = {
  wedding: [
    P('#3b0f1b', '#0d0307', '#c9a24c', '#b38a3a', '#fff2c2', '#e7c876', '#f3e3b3', '#efe7d6', '#1d3b33', 'aref-ruqaa'),
    P('#fbf5ea', '#e9dcc3', '#b58a3c', '#8a6422', '#d9b45c', '#8a6a3a', '#3a2c14', '#f6efe0', '#7a1f2e', 'amiri'),
    P('#0f3b33', '#041713', '#d4b061', '#c9a24c', '#fff0b8', '#e3c880', '#f1e6c4', '#efe7d6', '#0f3b33', 'el-messiri'),
  ],
  engagement: [
    P('#4a1f2c', '#1a0910', '#e3a98f', '#d98f78', '#ffe1d3', '#f0bfae', '#ffe9df', '#f6e9df', '#6b2b3b', 'amiri'),
    P('#13264d', '#050b1c', '#c3cde0', '#aeb9d1', '#ffffff', '#c3cde0', '#eef2fa', '#eef0f4', '#13264d', 'markazi-text'),
    P('#5a1d12', '#20090a', '#e0a64a', '#d4883a', '#ffd48a', '#f0b86a', '#ffe8c4', '#f3e4cc', '#6a2315', 'aref-ruqaa'),
  ],
  babyBoy: [
    P('#eaf4fb', '#c9e3f5', '#6fa8d6', '#2f6fa8', '#8cc2ea', '#5a88ae', '#1f4468', '#fbfdff', '#3d7db5', 'cairo'),
    P('#16345a', '#07142a', '#8fd3c8', '#8fd3c8', '#e5fff9', '#b6e4de', '#eafaf7', '#f2fbfa', '#16345a', 'tajawal'),
    P('#f2eee6', '#dfe8ec', '#7fa6bd', '#4b7a96', '#a9c9db', '#6e8fa3', '#2b4a5c', '#fbfaf6', '#5b87a1', 'amiri'),
  ],
  babyGirl: [
    P('#fdeef2', '#f8d3de', '#e58fa8', '#c2507a', '#f4a8c0', '#b86a85', '#6a2440', '#fffafb', '#d9708f', 'el-messiri'),
    P('#3b2760', '#140c2b', '#e6c27a', '#d8b4f0', '#ffffff', '#e6d2f7', '#f6ecff', '#f6f0fb', '#4a3278', 'aref-ruqaa'),
    P('#fff3ea', '#fbd9c6', '#e9a07c', '#c9623a', '#f7bd9c', '#b4765a', '#6b3220', '#fffaf6', '#e08a66', 'cairo'),
  ],
  graduation: [
    P('#0f2145', '#050a1c', '#d9b04c', '#d9b04c', '#fff1b8', '#e8d08a', '#f4ecd2', '#f3efe4', '#0f2145', 'amiri'),
    P('#222831', '#07090c', '#c9d0d8', '#d5dbe3', '#ffffff', '#aab3bd', '#f2f4f7', '#eceef1', '#222831', 'cairo'),
    P('#5c1420', '#1d070b', '#f1e8da', '#f1e8da', '#ffffff', '#dccfbd', '#fff6ea', '#f7efe3', '#5c1420', 'markazi-text'),
  ],
  family: [
    P('#4a3426', '#1c120c', '#d6b98a', '#e6cfa2', '#fff0d0', '#c9ad82', '#f6e8cf', '#efe2c8', '#5a3d2b', 'scheherazade-new'),
    P('#f1f3e9', '#d8e0cb', '#7e9a6a', '#4f6b3e', '#a9c08f', '#6f8a5d', '#2c3d22', '#fbfcf6', '#5f7d4c', 'amiri'),
    P('#12383d', '#061a1d', '#f0b968', '#f0b968', '#ffe2ac', '#d9a45a', '#f6ead2', '#f2ead9', '#12383d', 'el-messiri'),
  ],
  formal: [
    P('#0a1530', '#030611', '#cfd8e6', '#ffffff', '#ffffff', '#cfd8e6', '#ffffff', '#eef0f4', '#0a1530', 'amiri'),
    P('#1d1f24', '#050506', '#c9a24c', '#f1e6c4', '#fff5d4', '#c9a24c', '#f1e6c4', '#efe9dc', '#1d1f24', 'amiri'),
    P('#4a0f1d', '#14040a', '#e8dcc6', '#f6eddc', '#ffffff', '#e0d2b8', '#f6eddc', '#f3ead9', '#4a0f1d', 'markazi-text'),
  ],
  artistic: [
    P('#1a1033', '#08040f', '#ff7a8a', '#ff9aa5', '#ffd0d6', '#ff9aa5', '#fff0f2', '#f5eef8', '#2a1850', 'rakkas'),
    P('#0b3c49', '#031a20', '#ffd166', '#ffd166', '#fff1b8', '#7fe0d4', '#f2fffc', '#f6f4e8', '#0b3c49', 'noto-kufi-arabic'),
    P('#f4f2ee', '#dcd8d0', '#1c1c1c', '#1c1c1c', '#6b6b6b', '#5a5a5a', '#111111', '#fbfaf7', '#1c1c1c', 'reem-kufi'),
  ],
  birthday: [
    P('#6d1b5a', '#260a22', '#ffd54a', '#ffd54a', '#fff3b0', '#ffb3e0', '#fff5fb', '#fff4fa', '#a62d86', 'cairo'),
    P('#e9f6ff', '#fdf1d6', '#ff7a59', '#e0533a', '#ffb199', '#5a7fa3', '#233a55', '#fffdf7', '#3b82c4', 'tajawal'),
    P('#0f4a47', '#04201f', '#ff8f7a', '#ffd2c8', '#ffffff', '#8fe3d2', '#f2fffb', '#f4fbf8', '#0f6a64', 'el-messiri'),
  ],
  love: [
    P('#6e0f2a', '#220510', '#ff9db4', '#ffc2d2', '#ffffff', '#ff9db4', '#fff0f4', '#fbe9ee', '#8a1534', 'great-vibes'),
    P('#2a1745', '#0d0618', '#f3c77a', '#f3c77a', '#fff0c8', '#d9b8f0', '#f8eefc', '#f4ecf8', '#3a2260', 'parisienne'),
    P('#fff1ec', '#f2cfc6', '#c47a6a', '#a8483a', '#e9a79a', '#a06a5e', '#5a2a22', '#fff8f4', '#b4584a', 'aref-ruqaa'),
  ],
  general: [
    P('#0f3d36', '#041512', '#e0a22a', '#f1d58a', '#fff1c4', '#8fd0c6', '#eafaf6', '#eef3ef', '#0f3d36', 'reem-kufi'),
    P('#eef1f4', '#d3dae2', '#3f6c9a', '#1f3d5c', '#7fa6cc', '#5b7690', '#142a40', '#fbfcfd', '#3f6c9a', 'cairo'),
    P('#2d1b3d', '#120a1a', '#ffa45c', '#ffc78f', '#fff0dc', '#ff8fa0', '#fff3e8', '#f8eee6', '#4a2a5c', 'tajawal'),
  ],
}

/** Font function for a palette: (size, weight) => canvas font string. */
export function fontOf(pal: Palette) {
  const def = FONTS.find((f) => f.id === pal.font) ?? FONTS[0]
  return (size: number, weight = 400) => stackFor(def, size, weight >= 600)
}

export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.62
}
