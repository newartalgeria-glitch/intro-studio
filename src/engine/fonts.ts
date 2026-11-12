import '@fontsource/aref-ruqaa/arabic-400.css'
import '@fontsource/aref-ruqaa/arabic-700.css'
import '@fontsource/aref-ruqaa/latin-400.css'
import '@fontsource/amiri/arabic-400.css'
import '@fontsource/amiri/arabic-700.css'
import '@fontsource/amiri/latin-400.css'
import '@fontsource/reem-kufi/arabic-400.css'
import '@fontsource/reem-kufi/arabic-700.css'
import '@fontsource/reem-kufi/latin-400.css'
import '@fontsource/cairo/arabic-400.css'
import '@fontsource/cairo/arabic-700.css'
import '@fontsource/cairo/latin-400.css'
import '@fontsource/tajawal/arabic-400.css'
import '@fontsource/tajawal/arabic-700.css'
import '@fontsource/tajawal/latin-400.css'
import '@fontsource/el-messiri/arabic-400.css'
import '@fontsource/el-messiri/arabic-700.css'
import '@fontsource/el-messiri/latin-400.css'
import '@fontsource/lateef/arabic-400.css'
import '@fontsource/lateef/arabic-700.css'
import '@fontsource/lateef/latin-400.css'
import '@fontsource/scheherazade-new/arabic-400.css'
import '@fontsource/scheherazade-new/arabic-700.css'
import '@fontsource/scheherazade-new/latin-400.css'
import '@fontsource/noto-kufi-arabic/arabic-400.css'
import '@fontsource/noto-kufi-arabic/arabic-700.css'
import '@fontsource/noto-kufi-arabic/latin-400.css'
import '@fontsource/markazi-text/arabic-400.css'
import '@fontsource/markazi-text/arabic-700.css'
import '@fontsource/markazi-text/latin-400.css'
import '@fontsource/rakkas/arabic-400.css'
import '@fontsource/rakkas/latin-400.css'
import '@fontsource/katibeh/arabic-400.css'
import '@fontsource/katibeh/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-700.css'
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/great-vibes/latin-400.css'
import '@fontsource/dancing-script/latin-400.css'
import '@fontsource/dancing-script/latin-700.css'
import '@fontsource/cinzel/latin-400.css'
import '@fontsource/cinzel/latin-700.css'
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/montserrat/latin-700.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/latin-700.css'
import '@fontsource/pacifico/latin-400.css'
import '@fontsource/bebas-neue/latin-400.css'
import '@fontsource/allura/latin-400.css'
import '@fontsource/parisienne/latin-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css'
import '@fontsource/ibm-plex-sans-arabic/latin-400.css'
import '@fontsource/ibm-plex-sans-arabic/latin-600.css'

export interface FontDef {
  id: string
  family: string
  label: string
  script: 'ar' | 'lat'
  bold: boolean
}

export const FONTS: FontDef[] = [
  { id: 'aref-ruqaa', family: 'Aref Ruqaa', label: 'رقعة', script: 'ar', bold: true },
  { id: 'amiri', family: 'Amiri', label: 'نسخ أميري', script: 'ar', bold: true },
  { id: 'reem-kufi', family: 'Reem Kufi', label: 'كوفي', script: 'ar', bold: true },
  { id: 'cairo', family: 'Cairo', label: 'القاهرة', script: 'ar', bold: true },
  { id: 'tajawal', family: 'Tajawal', label: 'تجوّل', script: 'ar', bold: true },
  { id: 'el-messiri', family: 'El Messiri', label: 'المسيري', script: 'ar', bold: true },
  { id: 'lateef', family: 'Lateef', label: 'لطيف', script: 'ar', bold: true },
  { id: 'scheherazade-new', family: 'Scheherazade New', label: 'شهرزاد', script: 'ar', bold: true },
  { id: 'noto-kufi-arabic', family: 'Noto Kufi Arabic', label: 'نوتو كوفي', script: 'ar', bold: true },
  { id: 'markazi-text', family: 'Markazi Text', label: 'مركزي', script: 'ar', bold: true },
  { id: 'rakkas', family: 'Rakkas', label: 'رقّاص', script: 'ar', bold: false },
  { id: 'katibeh', family: 'Katibeh', label: 'كاتبة', script: 'ar', bold: false },
  { id: 'cormorant-garamond', family: 'Cormorant Garamond', label: 'Cormorant', script: 'lat', bold: true },
  { id: 'playfair-display', family: 'Playfair Display', label: 'Playfair', script: 'lat', bold: true },
  { id: 'great-vibes', family: 'Great Vibes', label: 'Great Vibes', script: 'lat', bold: false },
  { id: 'dancing-script', family: 'Dancing Script', label: 'Dancing Script', script: 'lat', bold: true },
  { id: 'cinzel', family: 'Cinzel', label: 'Cinzel', script: 'lat', bold: true },
  { id: 'montserrat', family: 'Montserrat', label: 'Montserrat', script: 'lat', bold: true },
  { id: 'lora', family: 'Lora', label: 'Lora', script: 'lat', bold: true },
  { id: 'pacifico', family: 'Pacifico', label: 'Pacifico', script: 'lat', bold: false },
  { id: 'bebas-neue', family: 'Bebas Neue', label: 'Bebas Neue', script: 'lat', bold: false },
  { id: 'allura', family: 'Allura', label: 'Allura', script: 'lat', bold: false },
  { id: 'parisienne', family: 'Parisienne', label: 'Parisienne', script: 'lat', bold: false },
]

export const F = {
  /** calligraphic Arabic + Cormorant for Latin glyphs */
  ruqaa: (s: number, w = 400) => `${w} ${s}px 'Aref Ruqaa', 'Cormorant Garamond', serif`,
  amiri: (s: number, w = 400) => `${w} ${s}px 'Amiri', 'Cormorant Garamond', serif`,
  kufi: (s: number, w = 400) => `${w} ${s}px 'Reem Kufi', 'IBM Plex Sans Arabic', sans-serif`,
  plex: (s: number, w = 400) => `${w} ${s}px 'IBM Plex Sans Arabic', sans-serif`,
  garamond: (s: number, w = 500) => `${w} ${s}px 'Cormorant Garamond', serif`,
}

/** Font stack for a user-chosen font; the other script falls back to a sensible face. */
export function stackFor(f: FontDef, size: number, bold: boolean) {
  const fb = f.script === 'ar' ? "'Cormorant Garamond'" : "'Amiri'"
  return `${bold && f.bold ? 700 : 400} ${size}px '${f.family}', ${fb}, serif`
}

let loading: Promise<void> | null = null

export function loadFonts(): Promise<void> {
  if (!loading) {
    const sample = 'أبجد هوز عروس Abc 123'
    const specs = FONTS.flatMap((f) => [`400 40px '${f.family}'`, ...(f.bold ? [`700 40px '${f.family}'`] : [])])
    specs.push("400 40px 'IBM Plex Sans Arabic'", "600 40px 'IBM Plex Sans Arabic'")
    loading = Promise.all(specs.map((s) => document.fonts.load(s, sample)))
      .then(() => document.fonts.ready)
      .then(() => undefined)
  }
  return loading
}
