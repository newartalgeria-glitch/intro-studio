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

type Writable = { write: (b: Blob) => Promise<void>; close: () => Promise<void> }
type Handle = { createWritable: () => Promise<Writable> }
let lastPickerError = ''
export const pickerError = () => lastPickerError

/** "Where to save?" dialog (Chrome / Edge). Call it straight from a click.
 *  null  -> not available or refused (caller uses the normal download; pickerError() says why)
 *  throws 'CANCEL' -> the user really closed the dialog. */
export async function askSaveLocation(name: string, ext: '.mp4' | '.nadiralbum'): Promise<Handle | null> {
  lastPickerError = ''
  const fn = (window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<Handle> }).showSaveFilePicker
  if (!fn) {
    lastPickerError = 'showSaveFilePicker unavailable'
    return null
  }
  const types = ext === '.mp4' ? [{ description: 'MP4 video', accept: { 'video/mp4': ['.mp4'] } }] : [{ description: 'Nadir Photo Album', accept: { 'application/json': ['.nadiralbum'] } }]
  try {
    return await fn.call(window, { suggestedName: plainName(name), types })
  } catch (e) {
    const err = e as Error
    if (err?.name === 'AbortError' && /user aborted|cancel/i.test(err.message || '')) throw new Error('CANCEL')
    lastPickerError = `${err?.name}: ${err?.message}`
    return null
  }
}
export type SaveHandle = Awaited<ReturnType<typeof askSaveLocation>>

export async function writeTo(h: SaveHandle, blob: Blob, name: string) {
  if (!h) return download(blob, name)
  try {
    const w = await h.createWritable()
    await w.write(blob)
    await w.close()
  } catch {
    download(blob, name)
  }
}

/** Arabic/bidi characters in a file name make some browsers drop the name entirely, so keep it plain ASCII. */
function plainName(name: string) {
  const ext = name.slice(name.lastIndexOf('.'))
  const stem = name.slice(0, name.lastIndexOf('.')).replace(/[^\x20-\x7e]/g, '').replace(/[\\/:*?"<>|]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').trim()
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
  return `${stem.length > 2 ? stem : 'nadir-album'}-${stamp}${ext}`
}

export function download(blob: Blob, rawName: string) {
  const name = plainName(rawName)
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
