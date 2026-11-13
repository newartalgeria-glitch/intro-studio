import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_PHOTO_SEC, FONTS, OCCASIONS, PRESETS, TEMPLATES, TRANSITIONS, drawPreset, loadFonts, makeRenderCtx, renderFrame, resolveId, setHitSink } from './engine'
import type { FieldKey, FieldStyle, FieldStyles, Hit, IntroData, Kind, Motion, OverlayItem, Pic, Transition, Wins } from './engine'
import { Timeline } from './Timeline'
import { loadOverlayImage, loadPhoto } from './engine/pics'
import { exportMp4, webCodecsAvailable } from './export/encode'
import { DICT, LANGS, sample } from './i18n'
import type { Lang } from './i18n'
import { download, overlayToDataUrl, parseProject, photoToDataUrl } from './project'
import type { ProjectFile } from './project'

interface Photo {
  id: number
  pic: Pic
  thumb: string
  dur: number
}
type Tab = 'templates' | 'text' | 'photos' | 'overlays' | 'motion'
const MAX_PHOTOS = 40
interface Custom {
  id: number
  pic: Pic
  thumb: string
}
type Theme = 'light' | 'dark'

const FIELDS: FieldKey[] = ['headline', 'name1', 'connector', 'name2', 'date', 'place', 'footer']

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

  const [data, setData] = useState<IntroData>(() => ({ kind: 'intro', ...sample('ar', 'intro', 'wedding') }))
  const [styles, setStyles] = useState<FieldStyles>({})
  const [photos, setPhotos] = useState<Photo[]>([])
  const [overlays, setOverlays] = useState<OverlayItem[]>([])
  const [customs, setCustoms] = useState<Custom[]>([])
  const [transition, setTransition] = useState<Transition>('fade')
  const [tplId, setTplId] = useState('wedding:1')
  const [tab, setTab] = useState<Tab>('templates')
  const [wins, setWins] = useState<Partial<Wins>>({})
  const [occTab, setOccTab] = useState('wedding')
  const [field, setField] = useState<FieldKey>('name1')
  const [ready, setReady] = useState(false)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [quality, setQuality] = useState<'1080' | '720'>('1080')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [drag, setDrag] = useState(false)
  const [allSec, setAllSec] = useState(DEFAULT_PHOTO_SEC)

  const stage = useRef<HTMLCanvasElement>(null)
  const idRef = useRef(1)
  const uidRef = useRef(1)
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
      makeRenderCtx(data, photos.map((p) => p.pic), styles, {
        overlays,
        customs: Object.fromEntries(customs.map((c) => [c.id, c.pic])),
        transition,
        durs: photos.map((p) => p.dur),
        wins,
        tpl,
      }),
    [data, photos, styles, overlays, customs, transition, wins, tpl],
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

  const hits = useRef<Hit[]>([])
  const draw = useCallback(() => {
    if (!ready || !stage.current) return
    const sink: Hit[] = []
    setHitSink(sink)
    renderFrame(stage.current, tpl, rc, tRef.current)
    setHitSink(null)
    hits.current = sink
  }, [ready, tpl, rc])
  useEffect(draw, [draw, t])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      let n = tRef.current + dt
      if (n >= dur) n = 0
      tRef.current = n
      setT(n)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, dur])

  const set = (k: keyof IntroData) => (e: { target: { value: string } }) => setData((d) => ({ ...d, [k]: e.target.value }))

  /** Switching UI language also swaps sample text the user has not edited. */
  const changeLang = (next: Lang) => {
    setData((d) => {
      const from = sample(lang, d.kind, occ)
      const to = sample(next, d.kind, occ)
      const out = { ...d }
      for (const k of FIELDS) if (d[k] === from[k]) out[k] = to[k]
      return out
    })
    setLang(next)
  }

  const setKind = (kind: Kind) =>
    setData((d) => {
      const from = sample(lang, d.kind, occ)
      const to = sample(lang, kind, occ)
      const out = { ...d, kind }
      for (const k of ['headline', 'footer'] as const) if (d[k] === from[k]) out[k] = to[k]
      return out
    })

  /** Choosing a template from another occasion also swaps the sample text the user has not edited. */
  const pickTemplate = (id: string) => {
    const next = TEMPLATES.find((x) => x.id === id)
    if (!next) return
    if (next.occasion !== occ) {
      setData((d) => {
        const from = sample(lang, d.kind, occ)
        const to = sample(lang, d.kind, next.occasion)
        const out = { ...d }
        for (const k of ['headline', 'name1', 'connector', 'name2'] as const) if (d[k] === from[k]) out[k] = to[k]
        return out
      })
    }
    if (next.sec) {
      setPhotos((l) => l.map((p) => ({ ...p, dur: next.sec! })))
      setAllSec(next.sec)
    }
    setTplId(id)
    setOccTab(next.occasion)
  }

  const setStyle = (f: FieldKey, patch: Partial<FieldStyle>) => setStyles((s) => ({ ...s, [f]: { ...s[f], ...patch } }))
  const st = styles[field] ?? {}

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
    setData({ kind: 'intro', ...sample(lang, 'intro', 'wedding') })
    setStyles({})
    setPhotos([])
    setOverlays([])
    setCustoms([])
    setTransition('fade')
    setTplId('wedding:1')
    setOccTab('wedding')
    setWins({})
    setMsg(null)
  }

  const saveProject = () => {
    const file: ProjectFile = {
      app: 'nadir-photo-album',
      version: 2,
      durs: photos.map((p) => p.dur),
      wins,
      data,
      styles,
      tplId,
      photos: photos.map((p) => photoToDataUrl(p.pic)),
      overlays: overlays.map((o) => (o.custom === undefined ? o : { ...o, custom: customs.findIndex((c) => c.id === o.custom) })),
      customs: customs.map((c) => overlayToDataUrl(c.pic)),
      transition,
    }
    download(new Blob([JSON.stringify(file)], { type: 'application/json' }), `${data.name1 || 'project'}-${data.name2 || ''}.nadiralbum`)
    setMsg({ type: 'ok', text: t9.saved })
  }

  const openProject = async (f: File) => {
    try {
      const p = await parseProject(f)
      setData(p.data)
      setStyles(p.styles)
      const id = resolveId(p.tplId)
      const known = TEMPLATES.find((x) => x.id === id)
      setTplId(known ? id : 'wedding:1')
      setOccTab(known ? known.occasion : 'wedding')
      setWins(p.wins)
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
  const addOverlay = (o: Omit<OverlayItem, 'uid' | 'opacity' | 'scale'>) =>
    setOverlays((l) => {
      const cur = l[0]
      if (cur && cur.preset === o.preset && cur.custom === o.custom) return []
      return [{ uid: uidRef.current++, opacity: cur?.opacity ?? 0.9, scale: cur?.scale ?? 1, ...o }]
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

  const doExport = async () => {
    setMsg(null)
    if (!webCodecsAvailable()) {
      setMsg({ type: 'err', text: t9.noWebcodecs })
      return
    }
    setPlaying(false)
    setBusy(true)
    setProgress(0)
    abort.current = new AbortController()
    const h = quality === '1080' ? 1080 : 720
    try {
      const { blob, codec } = await exportMp4({
        tpl,
        rc,
        width: (h * 16) / 9,
        height: h,
        fps: 30,
        onProgress: setProgress,
        signal: abort.current.signal,
      })
      download(blob, `${data.kind}-${data.name1 || 'video'}-${data.name2 || ''}.mp4`)
      setMsg({ type: 'ok', text: t9.exportDone((blob.size / 1e6).toFixed(1), codec) })
    } catch (e) {
      const m = String((e as Error)?.message ?? e)
      if (m === 'ABORTED') setMsg({ type: 'err', text: t9.aborted })
      else if (m === 'NO_ENCODER') setMsg({ type: 'err', text: t9.noEncoder })
      else setMsg({ type: 'err', text: t9.exportFail + m })
    } finally {
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

  const hitAt = (e: React.PointerEvent) => {
    const cv = stage.current
    if (!cv) return null
    const b = cv.getBoundingClientRect()
    const px = ((e.clientX - b.left) * cv.width) / b.width
    const py = ((e.clientY - b.top) * cv.height) / b.height
    for (let i = hits.current.length - 1; i >= 0; i--) {
      const h = hits.current[i]
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) return h
    }
    return null
  }
  const dragText = useRef<{ f: FieldKey; x: number; y: number; dx: number; dy: number } | null>(null)

  const seek = (v: number) => {
    setPlaying(false)
    tRef.current = Math.min(Math.max(0, v), dur)
    setT(tRef.current)
  }
  const setDur = (id: number, d: number) => setPhotos((l) => l.map((p) => (p.id === id ? { ...p, dur: d } : p)))
  const long = tpl.kind === 'long'
  const tabs: [Tab, string][] = [
    ['templates', t9.tabTemplates],
    ['text', t9.tabText],
    ['photos', t9.tabPhotos],
    ['overlays', t9.tabOverlays],
    ['motion', t9.tabMotion],
  ]
  const buildRc = useCallback(
    (tp: (typeof TEMPLATES)[number]) => makeRenderCtx(data, photos.map((p) => p.pic), styles, { transition, durs: photos.map((p) => p.dur), tpl: tp }),
    [data, photos, styles, transition],
  )

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>Nadir Photo Album</h1>
          <p>{t9.tagline}</p>
        </div>
        <div className="tools">
          <button onClick={newProject}>{t9.newProject}</button>
          <button onClick={saveProject}>{t9.saveProject}</button>
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
        </div>
      </header>

      <aside className="panel">
        <div className="tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="pane">
          {tab === 'templates' && (
            <>
              <div className="seg" role="tablist">
                {(['intro', 'outro'] as Kind[]).map((k) => (
                  <button key={k} role="tab" aria-selected={data.kind === k} onClick={() => setKind(k)}>
                    {t9[k]}
                  </button>
                ))}
              </div>
              <TemplateStrip build={buildRc} active={tplId} occ={occTab} onOcc={setOccTab} onPick={pickTemplate} ready={ready} t9={t9} />
            </>
          )}

          {tab === 'text' && (
            <>
              <div className="chips" role="tablist">
                {FIELDS.map((k) => (
                  <button key={k} role="tab" aria-selected={field === k} onClick={() => setField(k)}>
                    {t9[k].replace(/\s*\(.*\)/, '')}
                  </button>
                ))}
              </div>
              <label className="f">
                <span>{t9[field]}</span>
                <input value={data[field]} onChange={set(field)} />
              </label>
              <label className="f">
                <span>{t9.font}</span>
                <select value={st.font ?? ''} onChange={(e) => setStyle(field, { font: e.target.value })}>
                  <option value="">{t9.fontDefault}</option>
                  <optgroup label={t9.fontsAr}>{fontOpts('ar')}</optgroup>
                  <optgroup label={t9.fontsLat}>{fontOpts('lat')}</optgroup>
                </select>
              </label>
              <div className="f">
                <span>
                  {t9.size} ({Math.round((st.scale ?? 1) * 100)}%)
                </span>
                <div className="sizerow">
                  <button onClick={() => setStyle(field, { scale: Math.max(0.3, +((st.scale ?? 1) - 0.1).toFixed(2)) })} aria-label={t9.smaller}>
                    A−
                  </button>
                  <input type="range" min={0.3} max={2.5} step={0.05} value={st.scale ?? 1} onChange={(e) => setStyle(field, { scale: Number(e.target.value) })} />
                  <button onClick={() => setStyle(field, { scale: Math.min(2.5, +((st.scale ?? 1) + 0.1).toFixed(2)) })} aria-label={t9.bigger}>
                    A+
                  </button>
                </div>
              </div>
              <div className="row2">
                <label className="f">
                  <span>{t9.color}</span>
                  <input type="color" value={st.color || '#ffffff'} onChange={(e) => setStyle(field, { color: e.target.value })} />
                </label>
                <label className="chk">
                  <input type="checkbox" checked={!!st.bold} onChange={(e) => setStyle(field, { bold: e.target.checked })} />
                  {t9.bold}
                </label>
              </div>
              <label className="f">
                <span>{t9.offX}</span>
                <input type="range" min={-1000} max={1000} step={5} value={st.dx ?? 0} onChange={(e) => setStyle(field, { dx: Number(e.target.value) })} />
              </label>
              <label className="f">
                <span>{t9.offY}</span>
                <input type="range" min={-600} max={600} step={5} value={st.dy ?? 0} onChange={(e) => setStyle(field, { dy: Number(e.target.value) })} />
              </label>
              <small className="hint">{t9.textHint}</small>
              <div className="row2">
                <button className="ghost" onClick={() => setStyle(field, { dx: 0, dy: 0 })}>
                  {t9.resetPos}
                </button>
                <button className="ghost" onClick={() => setStyles((s) => ({ ...s, [field]: {} }))}>
                  {t9.reset}
                </button>
              </div>
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
              {long && photos.length > 0 && (
                <div className="row2">
                  <label className="f">
                    <span>{t9.photoSec}</span>
                    <input type="number" min={2} max={40} step={0.5} value={allSec} onChange={(e) => setAllSec(Number(e.target.value))} />
                  </label>
                  <button className="ghost" onClick={() => setPhotos((l) => l.map((p) => ({ ...p, dur: Math.min(40, Math.max(2, allSec || 2)) })))}>
                    {t9.applyAll}
                  </button>
                </div>
              )}
              <ul className="thumbs">
                {photos.map((p, i) => (
                  <li key={p.id}>
                    <img src={p.thumb} alt={`${i + 1}`} />
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
                      <label className="f">
                        <span>{t9.ovSize}</span>
                        <input type="range" min={0.5} max={2.5} step={0.1} value={o.scale} onChange={(e) => patchOverlay(o.uid, { scale: Number(e.target.value) })} />
                      </label>
                    )}
                  </div>
                )
              })}
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

      <main className="main">
        <div className="stage">
          <canvas
            ref={stage}
            width={960}
            height={540}
            onPointerDown={(e) => {
              const h = hitAt(e)
              if (!h) return
              setField(h.f)
              const s0 = styles[h.f]
              dragText.current = { f: h.f, x: e.clientX, y: e.clientY, dx: s0?.dx ?? 0, dy: s0?.dy ?? 0 }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              const d = dragText.current
              const cv = e.currentTarget
              if (d) {
                const k = 1920 / cv.getBoundingClientRect().width
                setStyle(d.f, { dx: Math.round(d.dx + (e.clientX - d.x) * k), dy: Math.round(d.dy + (e.clientY - d.y) * k) })
              } else cv.style.cursor = hitAt(e) ? 'move' : 'default'
            }}
            onPointerUp={() => {
              dragText.current = null
            }}
          />
          {!ready && <div className="loading">{t9.loadingFonts}</div>}
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
              <select value={quality} onChange={(e) => setQuality(e.target.value as '1080' | '720')} aria-label={t9.quality} title={t9.quality}>
                <option value="1080">{t9.q1080}</option>
                <option value="720">{t9.q720}</option>
              </select>
              <button className="go" onClick={doExport} disabled={!ready}>
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
          editable={long}
          wins={rc.win}
          texts={data}
          field={field}
          onField={setField}
          onSeek={seek}
          onDur={setDur}
          onDurAll={(d) => setPhotos((l) => l.map((p) => ({ ...p, dur: d })))}
          onRemove={(id) => setPhotos((l) => l.filter((p) => p.id !== id))}
          onWin={(f, w) => setWins((x) => ({ ...x, [f]: w }))}
        />

        {msg && <p className={'msg ' + msg.type}>{msg.text}</p>}
      </main>
    </div>
  )
}

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
        {OCCASIONS.map((o) => (
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
      drawPreset(x, 2.6, p, { W: cv.width, H: cv.height, opacity: 1, scale: 4.2, countMul: 0.3 })
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
