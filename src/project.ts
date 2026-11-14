import type { FieldStyles, IntroData, OverlayItem, Transition, Wins } from './engine'
import { loadOverlayImage, loadPhoto } from './engine/pics'
import type { Pic } from './engine'

export interface ProjectFile {
  app: 'nadir-photo-album'
  version: 1 | 2
  durs?: number[]
  length?: number
  wins?: Partial<Wins>
  data: IntroData
  styles: FieldStyles
  tplId: string
  photos: string[]
  overlays?: OverlayItem[]
  /** uploaded overlay pictures as PNG data URLs, indexed like OverlayItem.custom */
  customs?: string[]
  transition?: Transition
}

export function photoToDataUrl(p: Pic) {
  return (p.src as HTMLCanvasElement).toDataURL('image/jpeg', 0.92)
}

type Picker = (o: object) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>
const pickerOf = () => (window as unknown as { showSaveFilePicker?: Picker }).showSaveFilePicker

/** Asks "where to save?" (Chrome/Edge). Must be called straight from a click. Returns null if unsupported, throws 'CANCEL' if dismissed. */
export async function askSaveLocation(name: string, ext: '.mp4' | '.nadiralbum') {
  const pick = pickerOf()
  if (!pick) return null
  try {
    const types = ext === '.mp4' ? [{ description: 'MP4', accept: { 'video/mp4': ['.mp4'] } }] : [{ description: 'Nadir Photo Album', accept: { 'application/json': ['.nadiralbum'] } }]
    return await pick.call(window, { suggestedName: name, types })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new Error('CANCEL')
    return null
  }
}
export type SaveHandle = Awaited<ReturnType<typeof askSaveLocation>>

export async function writeTo(h: SaveHandle, blob: Blob, name: string) {
  if (!h) return download(blob, name)
  const w = await h.createWritable()
  await w.write(blob)
  await w.close()
}

export function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

export async function parseProject(file: File): Promise<{
  data: IntroData
  styles: FieldStyles
  tplId: string
  photos: { pic: Pic; thumb: string }[]
  overlays: OverlayItem[]
  customs: { pic: Pic; thumb: string }[]
  transition: Transition
  durs: number[]
  length: number
  wins: Partial<Wins>
}> {
  const j = JSON.parse(await file.text()) as ProjectFile
  if (j.app !== 'nadir-photo-album' || !j.data) throw new Error('bad project')
  const photos = []
  for (const url of j.photos ?? []) {
    const blob = await (await fetch(url)).blob()
    photos.push(await loadPhoto(new File([blob], 'photo.jpg', { type: blob.type })))
  }
  const customs = []
  for (const url of j.customs ?? []) {
    const blob = await (await fetch(url)).blob()
    customs.push(await loadOverlayImage(new File([blob], 'overlay.png', { type: blob.type })))
  }
  return { data: j.data, styles: j.styles ?? {}, tplId: j.tplId, photos, overlays: j.overlays ?? [], customs, transition: j.transition ?? 'fade', durs: j.durs ?? [], length: j.length ?? 180, wins: j.wins ?? {} }
}

export function overlayToDataUrl(p: Pic) {
  return (p.src as HTMLCanvasElement).toDataURL('image/png')
}
