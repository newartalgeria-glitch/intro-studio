import { useLayoutEffect, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_PHOTO_SEC, FONTS, activeMedia, clearMediaSrc, loadMedia, mediaSrc, sampleColor, setMediaRedraw, setMediaSrc, syncVideos, OCCASIONS, PRESETS, TEMPLATES, TRANSITIONS, activeAt, boxOf, defaultFont, drawPreset, loadFonts, makeRenderCtx, renderFrame, resolveId } from './engine'
import type { FieldStyles, IntroData, MediaClip, Motion, OverlayItem, Pic, TextClip, Transition } from './engine'
import { Timeline } from './Timeline'
import type { Sel } from './Timeline'
import { Player, clipLen, decodeDataUrl, decodeFile, mixdown, peaks } from './audio'
import type { AudioClip, Music } from './audio'
import { loadOverlayImage, loadPhoto } from './engine/pics'
import { exportMp4, webCodecsAvailable } from './export/encode'
import { DICT, LANGS } from './i18n'
import type { Lang } from './i18n'
import { askSaveLocation, blobToDataUrl, overlayToDataUrl, parseProject, photoToDataUrl, pickerError, writeTo } from './project'
import type { SaveHandle } from './project'
import type { ProjectFile } from './project'

interface Photo {
  id: number
  pic: Pic
  thumb: string
  dur: number
}
type Tab = 'templates' | 'text' | 'photos' | 'overlays' | 'motion' | 'music' | 'chroma'
const MAX_PHOTOS = 40
interface Custom {
  id: number
  pic: Pic
  thumb: string
}
type Theme = 'light' | 'dark'

/** The classic 8 x 6 basic-colour grid. */
const BASIC = [
  '#FF8080', '#FFFF80', '#80FF80', '#00FF80', '#80FFFF', '#0080FF', '#FF80C0', '#FF80FF',
  '#FF0000', '#FFFF00', '#80FF00', '#00FF40', '#00FFFF', '#0080C0', '#8080C0', '#FF00FF',
  '#804040', '#FF8040', '#00FF00', '#008080', '#004080', '#8080FF', '#800040', '#FF0080',
  '#800000', '#FF8000', '#008000', '#008040', '#0000FF', '#0000A0', '#800080', '#8000FF',
  '#400000', '#804000', '#004000', '#004040', '#000080', '#000040', '#400040', '#400080',
  '#000000', '#808000', '#808040', '#808080', '#408080', '#C0C0C0', '#E0C080', '#FFFFFF',
]

function ColorPick({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const sw = useRef<HTMLButtonElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  // the palette is placed in the window (not inside the scrolling panel) and kept fully visible
  useLayoutEffect(() => {
    if (!open || !sw.current || !grid.current) return setPos(null)
    const r = sw.current.getBoundingClientRect()
    const g = grid.current.getBoundingClientRect()
    const left = Math.min(Math.max(8, r.left), window.innerWidth - g.width - 8)
    const top = r.bottom + 6 + g.height > window.innerHeight - 8 ? Math.max(8, r.top - g.height - 6) : r.bottom + 6
    setPos({ left, top })
  }, [open])
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])
  return (
    <div className="cpick" onPointerDown={(e) => e.stopPropagation()}>
      <button type="button" ref={sw} className="cswatch" style={{ background: value }} onClick={() => setOpen((o) => !o)} aria-label="color" />
      {open && (
        <div className="cgrid" ref={grid} style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden', left: 0, top: 0 }}>
          {BASIC.map((c) => (
            <button
              type="button"
              key={c}
              className={c.toLowerCase() === value.toLowerCase() ? 'on' : ''}
              style={{ background: c }}
              onClick={() => {
                onChange(c)
                setOpen(false)
              }}
              aria-label={c}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Templates draw only their artwork; every word on screen is a user text clip. */
const NO_DATA: IntroData = { kind: 'intro', headline: '', name1: '', connector: '', name2: '', date: '', place: '', footer: '' }
const NO_STYLES: FieldStyles = {}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function stored<T extends string>(key: string, ok: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null
    if (v && ok.includes(v)) return v
  } catch {
    /* storage unavailable */
  }
  return fallback
}
function remember(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* storage unavailable */
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => stored('npa_lang', ['ar', 'fr', 'en'], 'ar'))
  const [theme, setTheme] = useState<Theme>(() => stored('npa_theme', ['light', 'dark'], 'light'))
  const t9 = DICT[lang]

  const [texts, setTexts] = useState<TextClip[]>([])
  const [mclips, setMclips] = useState<MediaClip[]>([])
  const [picking, setPicking] = useState(false)
  const [sel, setSel] = useState<Sel>(null)
  const [modal, setModal] = useState<string | null>(null)
  const [music, setMusic] = useState<Music | null>(null)
  const [aclips, setAclips] = useState<AudioClip[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [overlays, setOverlays] = useState<OverlayItem[]>([])
  const [customs, setCustoms] = useState<Custom[]>([])
  const [transition, setTransition] = useState<Transition>('auto')
  const [length, setLength] = useState(0)
  const [tplId, setTplId] = useState('wedding:1')
  const [tab, setTab] = useState<Tab>('templates')
  const [occTab, setOccTab] = useState('wedding')
  const [ready, setReady] = useState(false)
  const [t, setT] = useState(0)
  const [undoN, setUndoN] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [quality, setQuality] = useState<'1080' | '720'>('1080')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string; retry?: boolean; escape?: boolean; saveDirect?: boolean } | null>(null)
  const escapeRef = useRef<(() => void) | null>(null)
  /** "where to save?" dialog; the message lets the user fall back to a plain download if the dialog never shows up */
  const pickPlace = (name: string, ext: '.mp4' | '.nadiralbum') =>
    new Promise<SaveHandle | 'DIRECT'>((res, rej) => {
      escapeRef.current = () => res('DIRECT')
      setMsg({ type: 'ok', text: t9.pickWaiting, escape: true })
      askSaveLocation(name, ext).then(res, rej)
    })
  const [drag, setDrag] = useState(false)
  const [allSec, setAllSec] = useState(DEFAULT_PHOTO_SEC)

  const stage = useRef<HTMLCanvasElement>(null)
  const idRef = useRef(1)
  const uidRef = useRef(1)
  const player = useRef(new Player())
  const tRef = useRef(0)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => {
    loadFonts().then(() => setReady(true))
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    remember('npa_lang', lang)
  }, [lang])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    remember('npa_theme', theme)
  }, [theme])

  const tpl = TEMPLATES.find((x) => x.id === tplId) ?? TEMPLATES[0]
  const rc = useMemo(
    () =>
      makeRenderCtx(NO_DATA, photos.map((p) => p.pic), NO_STYLES, {
        overlays,
        customs: Object.fromEntries(customs.map((c) => [c.id, c.pic])),
        transition,
        durs: photos.map((p) => p.dur),
        tpl,
        length,
        texts,
        mclips,
      }),
    [photos, overlays, customs, transition, tpl, length, texts, mclips],
  )
  const occ = tpl.occasion
  const dur = tpl.duration(rc)

  useEffect(() => {
    if (tRef.current > dur) {
      tRef.current = 0
      setT(0)
    }
  }, [dur])

  useEffect(() => {
    if (ready) {
      const s = tpl.kind === 'long' ? Math.min(8, dur - 1) : Math.min(dur * 0.7, dur - 1)
      tRef.current = s
      setT(s)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tplId])

  const draw = useCallback(() => {
    if (!ready || !stage.current) return
    renderFrame(stage.current, tpl, rc, tRef.current)
  }, [ready, tpl, rc])
  useEffect(() => {
    syncVideos(mclips, t, playing)
  }, [mclips, t, playing])
  const drawRef = useRef(draw)
  drawRef.current = draw
  useEffect(() => {
    setMediaRedraw(() => drawRef.current())
    return () => setMediaRedraw(null)
  }, [])
  useEffect(draw, [draw, t])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      let n = tRef.current + dt
      if (n >= dur) {
        n = 0
        startAudio(0)
      }
      tRef.current = n
      setT(n)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, dur])

  const live = useRef({ music, aclips, dur })
  live.current = { music, aclips, dur }
  function startAudio(from: number) {
    const l = live.current
    player.current.play(l.music, l.aclips, from, l.dur)
  }
  useEffect(() => {
    if (playing) startAudio(tRef.current)
    else player.current.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])
  useEffect(() => () => player.current.stop(), [])
  // volume / trim edits while playing are heard at once
  useEffect(() => {
    if (!playing) return
    const h = setTimeout(() => startAudio(tRef.current), 120)
    return () => clearTimeout(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aclips, music?.volume])

  const changeLang = (next: Lang) => setLang(next)


  // ---- undo: remembers the project state before each burst of edits ----
  interface Snap {
    photos: Photo[]
    texts: TextClip[]
    mclips: MediaClip[]
    aclips: AudioClip[]
    music: Music | null
    overlays: OverlayItem[]
    transition: Transition
    tplId: string
    length: number
  }
  const snapNow: Snap = { photos, texts, mclips, aclips, music, overlays, transition, tplId, length }
  const settled = useRef<Snap>(snapNow)
  const stack = useRef<Snap[]>([])
  const skipHist = useRef(false)
  const resetUntil = useRef(0)
  useEffect(() => {
    const s: Snap = { photos, texts, mclips, aclips, music, overlays, transition, tplId, length }
    if (skipHist.current) {
      skipHist.current = false
      settled.current = s
      return
    }
    if (Date.now() < resetUntil.current) {
      stack.current = []
      settled.current = s
      setUndoN(0)
      return
    }
    const h = setTimeout(() => {
      stack.current.push(settled.current)
      if (stack.current.length > 50) stack.current.shift()
      settled.current = s
      setUndoN(stack.current.length)
    }, 350)
    return () => clearTimeout(h)
  }, [photos, texts, mclips, aclips, music, overlays, transition, tplId, length])
  const undo = () => {
    const p = stack.current.pop()
    if (!p) return
    skipHist.current = true
    setPhotos(p.photos)
    setTexts(p.texts)
    setMclips(p.mclips)
    setAclips(p.aclips)
    setMusic(p.music)
    setOverlays(p.overlays)
    setTransition(p.transition)
    setTplId(p.tplId)
    setLength(p.length)
    setSel(null)
    setUndoN(stack.current.length)
  }

  // ---- text clips ----
  const selText = sel?.kind === 'text' ? texts.find((k) => k.id === sel.id) : undefined
  const patchText = (id: number, patch: Partial<TextClip>) => setTexts((l) => l.map((k) => (k.id === id ? { ...k, ...patch } : k)))
  const overlaps = (a: TextClip, b: TextClip) => a.id !== b.id && a.track === b.track && a.start < b.start + b.dur - 0.001 && b.start < a.start + a.dur - 0.001
  /** After a move: if the clip now sits on top of another one on the same track, drop it on the first free track. */
  const settle = (id: number) =>
    setTexts((l) => {
      const k = l.find((x) => x.id === id)
      if (!k || !l.some((o) => overlaps(k, o))) return l
      let tr = 0
      while (l.some((o) => overlaps({ ...k, track: tr }, o))) tr++
      return l.map((x) => (x.id === id ? { ...x, track: tr } : x))
    })
  const addText = (text: string) => {
    const body = text.trim()
    if (!body) return
    const id = uidRef.current++
    let start = Math.min(tRef.current, Math.max(0, dur - 1))
    if (dur - start < 3) start = Math.max(0, dur - 5)
    const len = Math.min(5, dur - start)
    setTexts((l) => {
      const k: TextClip = { id, text: body, start, dur: len, track: 0, x: 960, y: 540, size: 110, font: defaultFont(body), color: '#ffffff', bold: true, shadow: true, shadowAmt: 1, shadowBlur: 0.12 }
      let tr = 0
      while (l.some((o) => overlaps({ ...k, track: tr }, o))) tr++
      return [...l, { ...k, track: tr, y: 540 + [0, 150, -150, 300, -300][tr % 5] }]
    })
    setSel({ kind: 'text', id })
    // show the new text right away (it fades in over its first moments)
    tRef.current = Math.min(start + Math.min(1, len / 2), dur)
    setT(tRef.current)
  }
  // ---- chroma-key media ----
  const selMedia = sel?.kind === 'media' ? mclips.find((k) => k.id === sel.id) : undefined
  const patchMedia = (id: number, patch: Partial<MediaClip>) => setMclips((l) => l.map((k) => (k.id === id ? { ...k, ...patch } : k)))
  const mOverlap = (a: MediaClip, b: MediaClip) => a.id !== b.id && a.track === b.track && a.start < b.start + b.dur - 0.001 && b.start < a.start + a.dur - 0.001
  const settleMedia = (id: number) =>
    setMclips((l) => {
      const k = l.find((x) => x.id === id)
      if (!k || !l.some((o) => mOverlap(k, o))) return l
      let tr = 0
      while (l.some((o) => mOverlap({ ...k, track: tr }, o))) tr++
      return l.map((x) => (x.id === id ? { ...x, track: tr } : x))
    })
  const makeClip = (id: number, name: string, src: { kind: 'image' | 'video'; w: number; h: number; duration: number }, at: number): MediaClip => {
    const fit = Math.min(1, 1100 / src.w, 620 / src.h)
    const start = Math.min(at, Math.max(0, dur - 1))
    const len = src.kind === 'video' ? Math.min(src.duration, dur - start) : Math.min(5, dur - start)
    return { id, kind: src.kind, name, start, dur: Math.max(0.5, len), track: 0, x: 960, y: 540, w: Math.round(src.w * fit), h: Math.round(src.h * fit), inPt: 0, key: '', tol: 0.25, feather: 0.12, opacity: 1 }
  }
  const addMedia = async (f: File) => {
    try {
      const src = await loadMedia(f, f.name)
      const id = uidRef.current++
      setMediaSrc(id, src)
      const base = makeClip(id, f.name.replace(/\.[^.]+$/, '').slice(0, 24), src, tRef.current)
      setMclips((l) => {
        let tr = 0
        while (l.some((o) => mOverlap({ ...base, track: tr }, o))) tr++
        return [...l, { ...base, track: tr }]
      })
      setSel({ kind: 'media', id })
      setMsg(f.size > 60e6 ? { type: 'err', text: t9.chromaBig } : null)
    } catch {
      setMsg({ type: 'err', text: t9.chromaFail })
    }
  }
  const removeSel = () => {
    if (!sel) return
    if (sel.kind === 'media') {
      setMclips((l) => l.filter((k) => k.id !== sel.id))
    } else if (sel.kind === 'text') setTexts((l) => l.filter((k) => k.id !== sel.id))
    else setAclips((l) => l.filter((c) => c.id !== sel.id))
    setSel(null)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement
      if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault()
        removeSel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---- music ----
  const wave = useMemo(() => (music ? peaks(music.buffer, 2400) : null), [music])
  const addMusic = async (f: File) => {
    try {
      const m = await decodeFile(f)
      setMusic(m)
      setAclips([{ id: uidRef.current++, start: 0, inPt: 0, outPt: Math.min(m.buffer.duration, dur) }])
      setMsg(null)
    } catch {
      setMsg({ type: 'err', text: t9.musicFail })
    }
  }
  const patchAudio = (id: number, patch: Partial<AudioClip>) => setAclips((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const fitAudio = () => {
    if (!music) return
    const base = aclips[0] ?? { inPt: 0, outPt: music.buffer.duration }
    const seg = Math.max(0.5, base.outPt - base.inPt)
    const out: AudioClip[] = []
    for (let at = 0; at < dur - 0.05 && out.length < 60; at += seg) out.push({ id: uidRef.current++, start: at, inPt: base.inPt, outPt: base.inPt + Math.min(seg, dur - at), vol: base.vol })
    setAclips(out)
    setSel(null)
  }
  const splitAudio = () => {
    const at = tRef.current
    const c = aclips.find((x) => at > x.start + 0.3 && at < x.start + clipLen(x) - 0.3)
    if (!c) return
    const cut = c.inPt + (at - c.start)
    const b: AudioClip = { id: uidRef.current++, start: at, inPt: cut, outPt: c.outPt, vol: c.vol, fade: c.fade }
    setAclips((l) => l.flatMap((x) => (x.id === c.id ? [{ ...x, outPt: cut, fade: 0 }, b] : [x])))
    setSel({ kind: 'audio', id: b.id })
  }

  /** Choosing a template from another occasion also swaps the sample text the user has not edited. */
  const pickTemplate = (id: string) => {
    const next = TEMPLATES.find((x) => x.id === id)
    if (!next) return
    if (next.sec) {
      setPhotos((l) => l.map((p) => ({ ...p, dur: next.sec! })))
      setAllSec(next.sec)
    }
    setTplId(id)
    setOccTab(next.occasion)
  }

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const room = MAX_PHOTOS - photos.length
    const out: Photo[] = []
    for (const f of list.slice(0, Math.max(0, room))) {
      try {
        const r = await loadPhoto(f)
        out.push({ id: idRef.current++, ...r, dur: tpl.sec ?? DEFAULT_PHOTO_SEC })
      } catch {
        /* skip unreadable file */
      }
    }
    if (out.length) setPhotos((p) => [...p, ...out])
    if (list.length > room) setMsg({ type: 'err', text: t9.maxPhotos })
  }

  const move = (i: number, dir: number) =>
    setPhotos((p) => {
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const n = p.slice()
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })

  const newProject = () => {
    if (!window.confirm(t9.confirmNew)) return
    resetUntil.current = Date.now() + 1500
    setTexts([])
    clearMediaSrc()
    setMclips([])
    setSel(null)
    setMusic(null)
    setAclips([])
    setPhotos([])
    setOverlays([])
    setCustoms([])
    setTransition('auto')
    setLength(0)
    setTplId('wedding:1')
    setOccTab('wedding')
    setMsg(null)
  }

  const saveProject = async (direct = false) => {
    const fname = 'nadir-project.nadiralbum'
    let handle: SaveHandle = null
    if (!direct) {
      try {
        const h = await pickPlace(fname, '.nadiralbum')
        handle = h === 'DIRECT' ? null : h
      } catch {
        setMsg({ type: 'err', text: t9.saveCancelled, saveDirect: true })
        return
      }
    }
    setMsg({ type: 'ok', text: t9.saving })
    try {
    const file: ProjectFile = {
      app: 'nadir-photo-album',
      version: 4,
      durs: photos.map((p) => p.dur),
      length,
      data: NO_DATA,
      styles: NO_STYLES,
      texts,
      media: await Promise.all(mclips.filter((k) => mediaSrc(k.id)).map(async (k) => ({ clip: k, dataUrl: await blobToDataUrl(mediaSrc(k.id)!.blob) }))),
      audio: music ? { name: music.name, dataUrl: music.dataUrl, volume: music.volume, clips: aclips } : null,
      tplId,
      photos: photos.map((p) => photoToDataUrl(p.pic)),
      overlays: overlays.map((o) => (o.custom === undefined ? o : { ...o, custom: customs.findIndex((c) => c.id === o.custom) })),
      customs: customs.map((c) => overlayToDataUrl(c.pic)),
      transition,
    }
    await writeTo(handle, new Blob([JSON.stringify(file)], { type: 'application/json' }), fname)
    setMsg(handle ? { type: 'ok', text: t9.savedChosen } : pickerError() ? { type: 'err', text: `${t9.saved} (${pickerError()})` } : { type: 'ok', text: t9.saved })
    } catch (e) {
      setMsg({ type: 'err', text: `${t9.saveProject}: ${String((e as Error)?.message ?? e)}` })
    }
  }

  const openProject = async (f: File) => {
    try {
      const p = await parseProject(f)
      resetUntil.current = Date.now() + 2500
      setTexts(p.texts)
      clearMediaSrc()
      const mc: MediaClip[] = []
      for (const m of p.media) {
        try {
          setMediaSrc(m.clip.id, await loadMedia(m.blob, m.clip.name + (m.clip.kind === 'video' ? '.mp4' : '')))
          mc.push(m.clip)
        } catch {
          /* skip unreadable media */
        }
      }
      setMclips(mc)
      setSel(null)
      uidRef.current = Math.max(uidRef.current, ...p.texts.map((k) => k.id + 1), ...mc.map((k) => k.id + 1), ...(p.audio?.clips.map((c) => c.id + 1) ?? [0]))
      if (p.audio) {
        setMusic(await decodeDataUrl(p.audio.name, p.audio.dataUrl, p.audio.volume))
        setAclips(p.audio.clips)
      } else {
        setMusic(null)
        setAclips([])
      }
      const id = resolveId(p.tplId)
      const known = TEMPLATES.find((x) => x.id === id)
      setTplId(known ? id : 'wedding:1')
      setOccTab(known ? known.occasion : 'wedding')
      setLength(0)
      setPhotos(p.photos.map((x, i) => ({ id: idRef.current++, ...x, dur: p.durs[i] ?? DEFAULT_PHOTO_SEC })))
      const cs = p.customs.map((x) => ({ id: idRef.current++, ...x }))
      setCustoms(cs)
      setOverlays(
        p.overlays
          .filter((o) => o.custom === undefined || cs[o.custom])
          .map((o) => ({ ...o, uid: uidRef.current++, custom: o.custom === undefined ? undefined : cs[o.custom].id })),
      )
      setTransition(p.transition)
      setMsg(null)
    } catch {
      setMsg({ type: 'err', text: t9.loadFail })
    }
  }

  /** One overlay at a time: choosing a new one replaces the previous; choosing the active one again clears it. */
  const addOverlay = (o: Omit<OverlayItem, 'uid' | 'opacity' | 'scale' | 'count'>) =>
    setOverlays((l) => {
      const cur = l[0]
      if (cur && cur.preset === o.preset && cur.custom === o.custom) return []
      return [{ uid: uidRef.current++, opacity: cur?.opacity ?? 0.9, scale: cur?.scale ?? 1, count: cur?.count ?? 1, ...o }]
    })
  const patchOverlay = (uid: number, patch: Partial<OverlayItem>) => setOverlays((l) => l.map((o) => (o.uid === uid ? { ...o, ...patch } : o)))
  const addCustoms = async (files: FileList) => {
    const out: Custom[] = []
    for (const f of Array.from(files).filter((x) => x.type.startsWith('image/')).slice(0, 10)) {
      try {
        out.push({ id: idRef.current++, ...(await loadOverlayImage(f)) })
      } catch {
        /* skip unreadable file */
      }
    }
    if (out.length) setCustoms((c) => [...c, ...out])
  }

  const doExport = async (direct = false) => {
    setMsg(null)
    if (!webCodecsAvailable()) {
      setMsg({ type: 'err', text: t9.noWebcodecs })
      return
    }
    const fname = 'nadir-video.mp4'
    let handle: SaveHandle = null
    if (!direct) {
      try {
        const h = await pickPlace(fname, '.mp4')
        handle = h === 'DIRECT' ? null : h
      } catch {
        // offer a way out in case the dialog never showed up or was closed by mistake
        setMsg({ type: 'err', text: t9.saveCancelled, retry: true })
        return
      }
    }
    setMsg(null)
    setPlaying(false)
    setBusy(true)
    setProgress(0)
    abort.current = new AbortController()
    let lock: { release: () => Promise<void> } | null = null
    try {
      lock = (await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen')) ?? null
    } catch {
      /* optional */
    }
    const h = quality === '1080' ? 1080 : 720
    try {
      const audio = music && aclips.length ? await mixdown(music, aclips, dur) : null
      const { blob, codec } = await exportMp4({
        audio,
        tpl,
        rc,
        width: (h * 16) / 9,
        height: h,
        fps: 30,
        onProgress: setProgress,
        signal: abort.current.signal,
      })
      await writeTo(handle, blob, fname)
      const done = t9.exportDone((blob.size / 1e6).toFixed(1), codec)
      setMsg(handle ? { type: 'ok', text: `${t9.exportChosen} (${(blob.size / 1e6).toFixed(1)} MB, ${codec})` } : { type: pickerError() ? 'err' : 'ok', text: pickerError() ? `${done} [${pickerError()}]` : done })
    } catch (e) {
      const m = String((e as Error)?.message ?? e)
      if (m === 'ABORTED') setMsg({ type: 'err', text: t9.aborted })
      else if (m === 'NO_ENCODER') setMsg({ type: 'err', text: t9.noEncoder })
      else if (m === 'NO_AUDIO_ENCODER') setMsg({ type: 'err', text: t9.noAudioEnc })
      else setMsg({ type: 'err', text: t9.exportFail + m })
    } finally {
      void lock?.release().catch(() => {})
      setBusy(false)
      draw()
    }
  }

  const fontOpts = (script: 'ar' | 'lat') =>
    FONTS.filter((f) => f.script === script).map((f) => (
      <option key={f.id} value={f.id}>
        {f.label}
      </option>
    ))

  const seek = (v: number) => {
    setPlaying(false)
    tRef.current = Math.min(Math.max(0, v), dur)
    setT(tRef.current)
  }
  const setDur = (id: number, d: number) => setPhotos((l) => l.map((p) => (p.id === id ? { ...p, dur: d } : p)))
  const tabs: [Tab, string][] = [
    ['templates', t9.tabTemplates],
    ['text', t9.tabText],
    ['photos', t9.tabPhotos],
    ['overlays', t9.tabOverlays],
    ['motion', t9.tabMotion],
    ['music', t9.tabMusic],
    ['chroma', t9.tabChroma],
  ]
  const buildRc = useCallback(
    (tp: (typeof TEMPLATES)[number]) => makeRenderCtx(NO_DATA, photos.map((p) => p.pic), NO_STYLES, { transition, durs: photos.map((p) => p.dur), tpl: tp, length: 0 }),
    [photos, transition],
  )

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>Nadir Photo Album</h1>
          <p>{t9.tagline}</p>
        </div>
      </header>

      <aside className="panel">
        <div className="tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id)
                if (id === 'text') setModal('')
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="pane">
          {tab === 'templates' && (
            <>
              <TemplateStrip build={buildRc} active={tplId} occ={occTab} onOcc={setOccTab} onPick={pickTemplate} ready={ready} t9={t9} />
            </>
          )}

          {tab === 'text' && (
            <>
              <button className="go wide" onClick={() => setModal('')}>
                {t9.addText}
              </button>
              <b className="sub">{t9.textsList}</b>
              {texts.length === 0 && <small>{t9.noTexts}</small>}
              <ul className="tlist">
                {texts.map((k) => (
                  <li key={k.id}>
                    <button className={sel?.kind === 'text' && sel.id === k.id ? 'on' : ''} onClick={() => { setSel({ kind: 'text', id: k.id }); seek(k.start + 0.5) }}>
                      <span>{k.text.replace(/\n/g, ' ')}</span>
                      <small>
                        {fmt(k.start)} · {t9.tlTextLab} {k.track + 1}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
              {selText && (
                <div className="ov">
                  <label className="f">
                    <span>{t9.textEdit}</span>
                    <textarea rows={3} value={selText.text} onChange={(e) => patchText(selText.id, { text: e.target.value })} />
                  </label>
                  <label className="f">
                    <span>{t9.font}</span>
                    <select value={selText.font} onChange={(e) => patchText(selText.id, { font: e.target.value })}>
                      <optgroup label={t9.fontsAr}>{fontOpts('ar')}</optgroup>
                      <optgroup label={t9.fontsLat}>{fontOpts('lat')}</optgroup>
                    </select>
                  </label>
                  <div className="f">
                    <span>
                      {t9.size} ({Math.round(selText.size)})
                    </span>
                    <input type="range" min={20} max={400} step={2} value={selText.size} onChange={(e) => patchText(selText.id, { size: Number(e.target.value) })} />
                  </div>
                  <div className="row2">
                    <div className="f">
                      <span>{t9.color}</span>
                      <ColorPick value={selText.color} onChange={(c) => patchText(selText.id, { color: c })} />
                    </div>
                    <label className="chk">
                      <input type="checkbox" checked={selText.bold} onChange={(e) => patchText(selText.id, { bold: e.target.checked })} />
                      {t9.bold}
                    </label>
                    <div className="shbox">
                    <label className="chk">
                      <input type="checkbox" checked={selText.shadow !== false} onChange={(e) => patchText(selText.id, { shadow: e.target.checked })} />
                      {t9.shadow}
                    </label>
                    {selText.shadow !== false && (
                      <>
                      
                        <div className="f">
                          <span>{t9.shadowColor}</span>
                          <ColorPick value={selText.shadowColor ?? '#000000'} onChange={(c) => patchText(selText.id, { shadowColor: c })} />
                        </div>
                        <label className="f">
                          <span>
                            {t9.shadowBlur} ({Math.round((selText.shadowBlur ?? 0.12) * 100)})
                          </span>
                          <input type="range" min={0} max={1} step={0.02} value={selText.shadowBlur ?? 0.12} onChange={(e) => patchText(selText.id, { shadowBlur: Number(e.target.value) })} />
                        </label>
                        <label className="f">
                          <span>
                            {t9.shadowAmt} ({Math.round((selText.shadowAmt ?? 1) * 100)})
                          </span>
                          <input type="range" min={0.2} max={3} step={0.1} value={selText.shadowAmt ?? 1} onChange={(e) => patchText(selText.id, { shadowAmt: Number(e.target.value) })} />
                        </label>
                      
                      </>
                    )}
                    </div>
                  </div>
                  <button className="ghost" onClick={() => patchText(selText.id, { x: 960, y: 540 })}>
                    {t9.resetPos}
                  </button>
                  <button className="ghost danger" onClick={removeSel}>
                    {t9.delClip}
                  </button>
                </div>
              )}
              <small className="hint">{t9.textSelectHint}</small>
            </>
          )}

          {tab === 'photos' && (
            <>
              <div className="f">
                <span>
                  {t9.photos} ({photos.length}/{MAX_PHOTOS})
                </span>
                <label
                  className={'drop' + (drag ? ' on' : '')}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDrag(true)
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDrag(false)
                    addFiles(e.dataTransfer.files)
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                  {t9.drop}
                </label>
                {photos.length === 0 && <small>{t9.noPhotos}</small>}
              </div>
              {photos.length > 0 && (
                <div className="row2">
                  <label className="f">
                    <span>{t9.photoSec}</span>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      step={0.5}
                      value={allSec}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setAllSec(v)
                        // applies to every photo at once, as soon as the value is valid
                        if (v >= 2 && v <= 40) setPhotos((l) => l.map((p) => ({ ...p, dur: v })))
                      }}
                    />
                  </label>
                </div>
              )}
              <ul className="thumbs">
                {photos.map((p, i) => (
                  <li key={p.id}>
                    <img src={p.thumb} alt={`${i + 1}`} />
                    {(
                      <div className="dsec">
                        <button aria-label="-" onClick={() => setDur(p.id, Math.max(2, Math.round((p.dur - 0.5) * 2) / 2))} disabled={p.dur <= 2}>
                          −
                        </button>
                        <span>{p.dur}{t9.tlSeconds}</span>
                        <button aria-label="+" onClick={() => setDur(p.id, Math.min(40, Math.round((p.dur + 0.5) * 2) / 2))} disabled={p.dur >= 40}>
                          +
                        </button>
                      </div>
                    )}
                    <div>
                      <button aria-label={t9.up} onClick={() => move(i, -1)} disabled={i === 0}>
                        ‹
                      </button>
                      <button aria-label={t9.down} onClick={() => move(i, 1)} disabled={i === photos.length - 1}>
                        ›
                      </button>
                      <button aria-label={t9.remove} onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}>
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === 'overlays' && (
            <>
              <OverlayPicker t9={t9} active={overlays[0]?.preset} onPick={(preset) => addOverlay({ preset })} />
              <label className="btn wide">
                {t9.overlayUpload}
                <input
                  type="file"
                  accept="image/png,image/webp,image/svg+xml,image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files) addCustoms(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
              {customs.length > 0 && (
                <div className="cgrid">
                  {customs.map((c) => (
                    <button key={c.id} title={t9.overlays} className={overlays[0]?.custom === c.id ? 'on' : ''} onClick={() => addOverlay({ custom: c.id, motion: 'drift' })}>
                      <img src={c.thumb} alt="" />
                    </button>
                  ))}
                </div>
              )}
              <b className="sub">{t9.overlayActive}</b>
              {overlays.length === 0 && <small>{t9.overlayNone}</small>}
              {overlays.map((o) => {
                const pr = PRESETS.find((x) => x.id === o.preset)
                const label = pr ? `${t9.shapes[pr.shape]} ${t9.motions[pr.motion]}` : t9.overlays
                return (
                  <div className="ov" key={o.uid}>
                    <div className="ovhead">
                      <span>{label}</span>
                      <button aria-label={t9.clearOverlay} title={t9.clearOverlay} onClick={() => setOverlays([])}>
                        ✕
                      </button>
                    </div>
                    {o.custom !== undefined && (
                      <select value={o.motion ?? 'drift'} onChange={(e) => patchOverlay(o.uid, { motion: e.target.value as Motion | 'frame' })}>
                        {(['fall', 'rise', 'twinkle', 'drift', 'burst', 'frame'] as const).map((m) => (
                          <option key={m} value={m}>
                            {t9.motions[m]}
                          </option>
                        ))}
                      </select>
                    )}
                    <label className="f">
                      <span>{t9.opacity}</span>
                      <input type="range" min={0.1} max={1} step={0.05} value={o.opacity} onChange={(e) => patchOverlay(o.uid, { opacity: Number(e.target.value) })} />
                    </label>
                    {o.motion !== 'frame' && (
                      <>
                        <label className="f">
                          <span>{t9.ovSize}</span>
                          <input type="range" min={0.5} max={2.5} step={0.1} value={o.scale} onChange={(e) => patchOverlay(o.uid, { scale: Number(e.target.value) })} />
                        </label>
                        <label className="f">
                          <span>
                            {t9.ovCount} ({Math.round((o.count ?? 1) * 100)}%)
                          </span>
                          <input type="range" min={0.1} max={3} step={0.1} value={o.count ?? 1} onChange={(e) => patchOverlay(o.uid, { count: Number(e.target.value) })} />
                        </label>
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {tab === 'music' && (
            <>
              <label className="btn wide">
                {music ? t9.musicChange : t9.musicPick}
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) addMusic(f)
                    e.target.value = ''
                  }}
                />
              </label>
              {!music && <small>{t9.musicNone}</small>}
              {music && (
                <div className="ov">
                  <div className="ovhead">
                    <span>♪ {music.name}</span>
                    <button
                      aria-label={t9.musicRemove}
                      title={t9.musicRemove}
                      onClick={() => {
                        setMusic(null)
                        setAclips([])
                        setSel(null)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <small>
                    {fmt(music.buffer.duration)} · {aclips.length}
                  </small>
                  <label className="f">
                    <span>
                      {t9.musicVolume} ({Math.round(music.volume * 100)}%)
                    </span>
                    <input type="range" min={0} max={1} step={0.05} value={music.volume} onChange={(e) => setMusic({ ...music, volume: Number(e.target.value) })} />
                  </label>
                  <button className="ghost" onClick={fitAudio}>
                    {t9.musicFit}
                  </button>
                  <button className="ghost" onClick={splitAudio}>
                    {t9.musicSplit}
                  </button>
                  <button className="ghost danger" disabled={sel?.kind !== 'audio'} onClick={removeSel}>
                    {t9.musicDelClip}
                  </button>
                </div>
              )}
              <small className="hint">{t9.musicHint}</small>
            </>
          )}

          {tab === 'chroma' && (
            <>
              <label className="btn wide">
                {t9.chromaAdd}
                <input
                  type="file"
                  accept="image/*,video/*,.mp4,.webm,.mov,.png,.jpg,.jpeg,.webp,.gif"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) addMedia(f)
                    e.target.value = ''
                  }}
                />
              </label>
              <b className="sub">{t9.chromaList}</b>
              {mclips.length === 0 && <small>{t9.chromaNone}</small>}
              <ul className="tlist">
                {mclips.map((k) => (
                  <li key={k.id}>
                    <button className={sel?.kind === 'media' && sel.id === k.id ? 'on' : ''} onClick={() => { setSel({ kind: 'media', id: k.id }); seek(k.start + 0.3) }}>
                      <span>{k.kind === 'video' ? '▶ ' : ''}{k.name}</span>
                      <small>{fmt(k.start)}</small>
                    </button>
                  </li>
                ))}
              </ul>
              {selMedia && (
                <div className="ov">
                  <b className="sub">{t9.chromaKey}</b>
                  <div className="keys">
                    {([
                      ['', t9.chromaNoKey, '#888888'],
                      ['#00ff00', t9.chromaGreen, '#00ff00'],
                      ['#0000ff', t9.chromaBlue, '#0000ff'],
                      ['#00ffff', t9.chromaWater, '#00ffff'],
                      ['#000000', t9.chromaBlack, '#000000'],
                      ['#ffffff', t9.chromaWhite, '#ffffff'],
                    ] as const).map(([v, label, sw]) => (
                      <button key={label} className={selMedia.key === v ? 'on' : ''} onClick={() => patchMedia(selMedia.id, { key: v })}>
                        <i className="sw" style={{ background: sw }} />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="row2">
                    <div className="f">
                      <ColorPick value={selMedia.key || '#00ff00'} onChange={(c) => patchMedia(selMedia.id, { key: c })} />
                    </div>
                    <button className={'ghost' + (picking ? ' on' : '')} onClick={() => setPicking((v) => !v)}>
                      {t9.chromaPick}
                    </button>
                  </div>
                  {picking && <small>{t9.chromaPicking}</small>}
                  <label className="f">
                    <span>
                      {t9.chromaTol} ({Math.round(selMedia.tol * 100)})
                    </span>
                    <input type="range" min={0} max={1} step={0.01} value={selMedia.tol} onChange={(e) => patchMedia(selMedia.id, { tol: Number(e.target.value) })} />
                  </label>
                  <label className="f">
                    <span>
                      {t9.chromaFeather} ({Math.round(selMedia.feather * 100)})
                    </span>
                    <input type="range" min={0} max={0.6} step={0.01} value={selMedia.feather} onChange={(e) => patchMedia(selMedia.id, { feather: Number(e.target.value) })} />
                  </label>
                  <label className="f">
                    <span>
                      {t9.chromaLevel} ({Math.round(selMedia.opacity * 100)})
                    </span>
                    <input type="range" min={0} max={1} step={0.01} value={selMedia.opacity} onChange={(e) => patchMedia(selMedia.id, { opacity: Number(e.target.value) })} />
                  </label>
                  <button className="ghost danger" onClick={removeSel}>
                    {t9.chromaDel}
                  </button>
                </div>
              )}
              <small className="hint">{t9.chromaHint}</small>
            </>
          )}

          {tab === 'motion' && (
            <div className="trs" role="radiogroup" aria-label={t9.transition}>
              {TRANSITIONS.map((k) => (
                <button key={k} role="radio" aria-checked={transition === k} onClick={() => setTransition(k)}>
                  {t9.transitions[k]}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
      <footer className="legal">
        <a href="guides/">{t9.navGuides}</a>
        <a href="about.html">{t9.navAbout}</a>
        <a href="privacy.html">{t9.navPrivacy}</a>
        <a href="terms.html">{t9.navTerms}</a>
        <a href="contact.html">{t9.navContact}</a>
      </footer>

      <main className="main">
        <div className="stagerow">
          <div className="stage">
            <canvas ref={stage} width={960} height={540} onPointerDown={() => setSel(null)} />
            <div className="sel-layer">
              {mclips
                .filter((k) => activeMedia(k, t))
                .sort((x, y) => x.track - y.track)
                .map((k) => {
                  const on = sel?.kind === 'media' && sel.id === k.id
                  return (
                    <div
                      key={'m' + k.id}
                      className={'tbox' + (on ? ' on' : '') + (on && picking ? ' pick' : '')}
                      style={{ left: `${((k.x - k.w / 2) / 1920) * 100}%`, top: `${((k.y - k.h / 2) / 1080) * 100}%`, width: `${(k.w / 1920) * 100}%`, height: `${(k.h / 1080) * 100}%` }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        const r = stage.current!.getBoundingClientRect()
                        const kx = 1920 / r.width
                        if (on && picking) {
                          const b = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const col = sampleColor(k, (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height)
                          if (col) patchMedia(k.id, { key: col })
                          setPicking(false)
                          return
                        }
                        setSel({ kind: 'media', id: k.id })
                        const x0 = e.clientX, y0 = e.clientY, ox = k.x, oy = k.y
                        const mv = (ev: PointerEvent) => patchMedia(k.id, { x: Math.round(ox + (ev.clientX - x0) * kx), y: Math.round(oy + (ev.clientY - y0) * kx) })
                        const up = () => {
                          window.removeEventListener('pointermove', mv)
                          window.removeEventListener('pointerup', up)
                        }
                        window.addEventListener('pointermove', mv)
                        window.addEventListener('pointerup', up)
                      }}
                    >
                      {on &&
                        !picking &&
                        (['nw', 'ne', 'sw', 'se'] as const).map((c) => (
                          <i
                            key={c}
                            className={'h ' + c}
                            onPointerDown={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              const r = stage.current!.getBoundingClientRect()
                              const cx = r.left + (k.x / 1920) * r.width
                              const cy = r.top + (k.y / 1080) * r.height
                              const d0 = Math.max(10, Math.hypot(e.clientX - cx, e.clientY - cy))
                              const w0 = k.w, h0 = k.h
                              const mv = (ev: PointerEvent) => {
                                const f = Math.min(8, Math.max(0.05, Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0))
                                patchMedia(k.id, { w: Math.round(w0 * f), h: Math.round(h0 * f) })
                              }
                              const up = () => {
                                window.removeEventListener('pointermove', mv)
                                window.removeEventListener('pointerup', up)
                              }
                              window.addEventListener('pointermove', mv)
                              window.addEventListener('pointerup', up)
                            }}
                          />
                        ))}
                    </div>
                  )
                })}
              {texts
                .filter((k) => k.text.trim() && activeAt(k, t))
                .sort((x, y) => x.track - y.track)
                .map((k) => {
                  const bx = boxOf(k)
                  const on = sel?.kind === 'text' && sel.id === k.id
                  return (
                    <div
                      key={k.id}
                      className={'tbox' + (on ? ' on' : '')}
                      style={{ left: `${(bx.x / 1920) * 100}%`, top: `${(bx.y / 1080) * 100}%`, width: `${(bx.w / 1920) * 100}%`, height: `${(bx.h / 1080) * 100}%` }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setSel({ kind: 'text', id: k.id })
                        const r = stage.current!.getBoundingClientRect()
                        const kx = 1920 / r.width
                        const x0 = e.clientX, y0 = e.clientY, ox = k.x, oy = k.y
                        const mv = (ev: PointerEvent) => patchText(k.id, { x: Math.round(ox + (ev.clientX - x0) * kx), y: Math.round(oy + (ev.clientY - y0) * kx) })
                        const up = () => {
                          window.removeEventListener('pointermove', mv)
                          window.removeEventListener('pointerup', up)
                        }
                        window.addEventListener('pointermove', mv)
                        window.addEventListener('pointerup', up)
                      }}
                    >
                      {on &&
                        (['nw', 'ne', 'sw', 'se'] as const).map((c) => (
                          <i
                            key={c}
                            className={'h ' + c}
                            onPointerDown={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              const r = stage.current!.getBoundingClientRect()
                              const cx = r.left + (k.x / 1920) * r.width
                              const cy = r.top + (k.y / 1080) * r.height
                              const d0 = Math.max(10, Math.hypot(e.clientX - cx, e.clientY - cy))
                              const s0 = k.size
                              const mv = (ev: PointerEvent) => patchText(k.id, { size: Math.round(Math.min(500, Math.max(16, (s0 * Math.hypot(ev.clientX - cx, ev.clientY - cy)) / d0))) })
                              const up = () => {
                                window.removeEventListener('pointermove', mv)
                                window.removeEventListener('pointerup', up)
                              }
                              window.addEventListener('pointermove', mv)
                              window.addEventListener('pointerup', up)
                            }}
                          />
                        ))}
                    </div>
                  )
                })}
            </div>
            {!ready && <div className="loading">{t9.loadingFonts}</div>}
          </div>
          <div className="tools dock">
            <label className="btn">
              {t9.openProject}
              <input
                type="file"
                accept=".nadiralbum,application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) openProject(f)
                  e.target.value = ''
                }}
              />
            </label>
            <select value={lang} onChange={(e) => changeLang(e.target.value as Lang)} aria-label="Language">
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-pressed={theme === 'dark'}>
              {theme === 'light' ? t9.themeDark : t9.themeLight}
            </button>
            <i className="br" />
            <button className="pri" onClick={newProject}>{t9.newProject}</button>
            <button onClick={() => saveProject()}>{t9.saveProject}</button>
          </div>
        </div>
        <div className="bar">
          <button className="play" onClick={() => setPlaying((p) => !p)}>
            {playing ? t9.pause : t9.play}
          </button>
          <input type="range" min={0} max={dur} step={0.01} value={t} aria-label={t9.position} onChange={(e) => seek(Number(e.target.value))} />
          <span className="time">
            {fmt(t)} / {fmt(dur)}
          </span>
          {busy ? (
            <>
              <div className="prog" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
                <i style={{ width: `${progress * 100}%` }} />
              </div>
              <button className="ghost" onClick={() => abort.current?.abort()}>
                {t9.cancel}
              </button>
            </>
          ) : (
            <>
              <button className="ico" onClick={undo} disabled={undoN === 0} title={`${t9.undo} (Ctrl+Z)`} aria-label={t9.undo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
              </button>
              <button className="ico" onClick={splitAudio} disabled={!music} title={t9.musicSplit} aria-label={t9.musicSplit}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" /></svg>
              </button>
              <button className="ico" onClick={removeSel} disabled={!sel} title={t9.delClip} aria-label={t9.delClip}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" /></svg>
              </button>
              <select value={quality} onChange={(e) => setQuality(e.target.value as '1080' | '720')} aria-label={t9.quality} title={t9.quality}>
                <option value="1080">1080p</option>
                <option value="720">720p</option>
              </select>
              <button className="go" onClick={() => doExport()} disabled={!ready}>
                {t9.export}
              </button>
            </>
          )}
        </div>

        <Timeline
          t9={t9}
          total={dur}
          t={t}
          playing={playing}
          photos={photos.map((p) => ({ id: p.id, thumb: p.thumb, dur: p.dur }))}
          editable
          texts={texts}
          mclips={mclips}
          onMedia={patchMedia}
          onMediaSettle={settleMedia}
          audio={music && wave ? { name: music.name, duration: music.buffer.duration, peaks: wave, clips: aclips } : null}
          sel={sel}
          onSel={setSel}
          onText={patchText}
          onSettle={settle}
          onAudioClip={patchAudio}
          onSeek={seek}
          onDur={setDur}
          length={length}
          onLength={setLength}
          extra={rc.durs.slice(rc.real).map((d, i) => ({ dur: d, thumb: photos[(rc.real + i) % Math.max(1, photos.length)]?.thumb ?? '' }))}
          onDurAll={(d) => setPhotos((l) => l.map((p) => ({ ...p, dur: d })))}
          onRemove={(id) => setPhotos((l) => l.filter((p) => p.id !== id))}
        />

        {msg && (
          <p className={'msg ' + msg.type} onClick={() => !msg.retry && !msg.escape && !msg.saveDirect && setMsg(null)}>
            {msg.text}
            {msg.escape && (
              <button className="ghost" style={{ marginInlineStart: 10 }} onClick={() => escapeRef.current?.()}>
                {t9.directDl}
              </button>
            )}
            {msg.saveDirect && (
              <button className="ghost" style={{ marginInlineStart: 10 }} onClick={() => saveProject(true)}>
                {t9.directDl}
              </button>
            )}
            {msg.retry && (
              <button className="ghost" style={{ marginInlineStart: 10 }} onClick={() => doExport(true)}>
                {t9.exportDirect}
              </button>
            )}
          </p>
        )}
      </main>
      {modal !== null && (
        <div className="modal-bg" onPointerDown={() => setModal(null)}>
          <div className="modal" role="dialog" aria-label={t9.textModalTitle} onPointerDown={(e) => e.stopPropagation()}>
            <h3>{t9.textModalTitle}</h3>
            <textarea
              autoFocus
              value={modal}
              placeholder={t9.textPlaceholder}
              onChange={(e) => setModal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addText(modal)
                  setModal(null)
                } else if (e.key === 'Escape') setModal(null)
              }}
            />
            <div className="acts">
              <button onClick={() => setModal(null)}>{t9.cancel}</button>
              <button
                className="go"
                disabled={!modal.trim()}
                onClick={() => {
                  addText(modal)
                  setModal(null)
                }}
              >
                {t9.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Tab order: "simple" sits right after wedding (the order of OCCASIONS itself must not change: old designs depend on it). */
const TABS = ['wedding', 'simple', ...OCCASIONS.filter((o) => o !== 'wedding'), 'book']

function TemplateStrip(props: {
  build: (tp: (typeof TEMPLATES)[number]) => ReturnType<typeof makeRenderCtx>
  active: string
  occ: string
  onOcc: (o: string) => void
  onPick: (id: string) => void
  ready: boolean
  t9: (typeof DICT)['ar']
}) {
  const { build, ready, occ, t9 } = props
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const list = useMemo(() => TEMPLATES.filter((x) => x.occasion === occ), [occ])
  useEffect(() => {
    if (!ready) return
    const h = setTimeout(() => {
      for (const tp of list) {
        const cv = refs.current[tp.id]
        if (!cv) continue
        const r = build(tp)
        renderFrame(cv, tp, r, tp.kind === 'long' ? 8.5 : tp.duration(r) * 0.7)
      }
    }, 120)
    return () => clearTimeout(h)
  }, [build, ready, list])
  return (
    <div className="tpls">
      <div className="occs" role="tablist" aria-label={t9.occasions}>
        {TABS.map((o) => (
          <button key={o} role="tab" aria-selected={occ === o} onClick={() => props.onOcc(o)}>
            {t9.occ[o]}
          </button>
        ))}
      </div>
      <div className="strip" role="radiogroup">
        {list.map((tp) => (
          <button key={tp.id} title={tp.kind === 'long' ? tp.tag : undefined} role="radio" aria-checked={props.active === tp.id} onClick={() => props.onPick(tp.id)}>
            <canvas
              ref={(el) => {
                refs.current[tp.id] = el
              }}
              width={320}
              height={180}
            />
            <span className="nm">
              <i style={{ background: tp.swatch[0] }} />
              <i style={{ background: tp.swatch[1] }} />
              <i style={{ background: tp.swatch[2] }} />
              {tp.kind === 'legacy' ? `${t9.occ[tp.tag ?? 'general']} · ${t9.layouts[tp.layout]}` : `${t9.occ[tp.occasion]} ${tp.num} · ${tp.sec}${t9.tlSeconds}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function OverlayPicker(props: { t9: (typeof DICT)['ar']; active?: string; onPick: (id: string) => void }) {
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({})
  useEffect(() => {
    for (const p of PRESETS) {
      const cv = refs.current[p.id]
      if (!cv) continue
      const x = cv.getContext('2d')!
      x.setTransform(1, 0, 0, 1, 0, 0)
      x.fillStyle = '#15191c'
      x.fillRect(0, 0, cv.width, cv.height)
      drawPreset(x, 3.2, p, { W: cv.width, H: cv.height, opacity: 1, scale: 9, countMul: 0.2 })
    }
  }, [])
  return (
    <div className="ogrid">
      {PRESETS.map((p) => (
        <button key={p.id} className={props.active === p.id ? 'on' : ''} title={`${props.t9.shapes[p.shape]} ${props.t9.motions[p.motion]}`} onClick={() => props.onPick(p.id)}>
          <canvas
            ref={(el) => {
              refs.current[p.id] = el
            }}
            width={120}
            height={68}
          />
        </button>
      ))}
    </div>
  )
}
