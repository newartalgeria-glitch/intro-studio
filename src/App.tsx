import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FONTS, LAYOUT_IDS, LEGACY_IDS, OCCASIONS, PRESETS, TEMPLATES, TRANSITIONS, drawPreset, loadFonts, makeRenderCtx, renderFrame } from './engine'
import type { FieldKey, FieldStyle, FieldStyles, IntroData, Kind, Motion, OverlayItem, Pic, Transition } from './engine'
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
}
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
  const [tplId, setTplId] = useState('wedding:arch:0')
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

  const rc = useMemo(
    () =>
      makeRenderCtx(data, photos.map((p) => p.pic), styles, {
        overlays,
        customs: Object.fromEntries(customs.map((c) => [c.id, c.pic])),
        transition,
      }),
    [data, photos, styles, overlays, customs, transition],
  )
  const tpl = TEMPLATES.find((x) => x.id === tplId) ?? TEMPLATES[0]
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
      const s = Math.min(dur * 0.7, dur - 1)
      tRef.current = s
      setT(s)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tplId])

  const draw = useCallback(() => {
    if (!ready || !stage.current) return
    renderFrame(stage.current, tpl, rc, tRef.current)
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
    setTplId(id)
    setOccTab(next.occasion)
  }

  const setStyle = (f: FieldKey, patch: Partial<FieldStyle>) => setStyles((s) => ({ ...s, [f]: { ...s[f], ...patch } }))
  const st = styles[field] ?? {}

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const room = 8 - photos.length
    const out: Photo[] = []
    for (const f of list.slice(0, Math.max(0, room))) {
      try {
        const r = await loadPhoto(f)
        out.push({ id: idRef.current++, ...r })
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
    setTplId('wedding:arch:0')
    setOccTab('wedding')
    setMsg(null)
  }

  const saveProject = () => {
    const file: ProjectFile = {
      app: 'nadir-photo-album',
      version: 1,
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
      const id = LEGACY_IDS[p.tplId] ?? p.tplId
      const known = TEMPLATES.find((x) => x.id === id)
      setTplId(known ? id : 'wedding:arch:0')
      setOccTab(known ? known.occasion : 'wedding')
      setPhotos(p.photos.map((x) => ({ id: idRef.current++, ...x })))
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

  const addOverlay = (o: Omit<OverlayItem, 'uid' | 'opacity' | 'scale'>) =>
    setOverlays((l) => [...l, { uid: uidRef.current++, opacity: 0.9, scale: 1, ...o }])
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
        <div className="seg" role="tablist">
          {(['intro', 'outro'] as Kind[]).map((k) => (
            <button key={k} role="tab" aria-selected={data.kind === k} onClick={() => setKind(k)}>
              {t9[k]}
            </button>
          ))}
        </div>

        <label className="f">
          <span>{t9.headline}</span>
          <input value={data.headline} onChange={set('headline')} />
        </label>
        <div className="row3">
          <label className="f">
            <span>{t9.name1}</span>
            <input value={data.name1} onChange={set('name1')} />
          </label>
          <label className="f narrow">
            <span>{t9.connector}</span>
            <input value={data.connector} onChange={set('connector')} />
          </label>
          <label className="f">
            <span>{t9.name2}</span>
            <input value={data.name2} onChange={set('name2')} />
          </label>
        </div>
        <label className="f">
          <span>{t9.date}</span>
          <input value={data.date} onChange={set('date')} />
        </label>
        <label className="f">
          <span>{t9.place}</span>
          <input value={data.place} onChange={set('place')} />
        </label>
        <label className="f">
          <span>{t9.footer}</span>
          <input value={data.footer} onChange={set('footer')} />
        </label>

        <details className="sect" open>
          <summary>{t9.textStyle}</summary>
          <label className="f">
            <span>{t9.field}</span>
            <select value={field} onChange={(e) => setField(e.target.value as FieldKey)}>
              {FIELDS.map((k) => (
                <option key={k} value={k}>
                  {t9[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            <span>{t9.font}</span>
            <select value={st.font ?? ''} onChange={(e) => setStyle(field, { font: e.target.value })}>
              <option value="">{t9.fontDefault}</option>
              <optgroup label={t9.fontsAr}>{fontOpts('ar')}</optgroup>
              <optgroup label={t9.fontsLat}>{fontOpts('lat')}</optgroup>
            </select>
          </label>
          <label className="f">
            <span>
              {t9.size} ({Math.round((st.scale ?? 1) * 100)}%)
            </span>
            <input type="range" min={0.4} max={1.8} step={0.05} value={st.scale ?? 1} onChange={(e) => setStyle(field, { scale: Number(e.target.value) })} />
          </label>
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
            <input type="range" min={-700} max={700} step={5} value={st.dx ?? 0} onChange={(e) => setStyle(field, { dx: Number(e.target.value) })} />
          </label>
          <label className="f">
            <span>{t9.offY}</span>
            <input type="range" min={-400} max={400} step={5} value={st.dy ?? 0} onChange={(e) => setStyle(field, { dy: Number(e.target.value) })} />
          </label>
          <button className="ghost" onClick={() => setStyles((s) => ({ ...s, [field]: {} }))}>
            {t9.reset}
          </button>
        </details>

        <details className="sect">
          <summary>{t9.overlays}</summary>
          <OverlayPicker t9={t9} onPick={(preset) => addOverlay({ preset })} />
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
                <button key={c.id} title={t9.overlays} onClick={() => addOverlay({ custom: c.id, motion: 'drift' })}>
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
                  <button aria-label={t9.remove} onClick={() => setOverlays((l) => l.filter((x) => x.uid !== o.uid))}>
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
        </details>

        <label className="f">
          <span>{t9.transition}</span>
          <select value={transition} onChange={(e) => setTransition(e.target.value as Transition)}>
            {TRANSITIONS.map((k) => (
              <option key={k} value={k}>
                {t9.transitions[k]}
              </option>
            ))}
          </select>
        </label>

        <div className="f">
          <span>
            {t9.photos} ({photos.length}/8)
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
        </div>
      </aside>

      <main className="main">
        <div className="stage">
          <canvas ref={stage} width={960} height={540} />
          {!ready && <div className="loading">{t9.loadingFonts}</div>}
        </div>
        <div className="bar">
          <button className="play" onClick={() => setPlaying((p) => !p)}>
            {playing ? t9.pause : t9.play}
          </button>
          <input
            type="range"
            min={0}
            max={dur}
            step={0.01}
            value={t}
            aria-label={t9.position}
            onChange={(e) => {
              setPlaying(false)
              tRef.current = Number(e.target.value)
              setT(tRef.current)
            }}
          />
          <span className="time">
            {fmt(t)} / {fmt(dur)}
          </span>
        </div>

        <TemplateStrip rc={rc} active={tplId} occ={occTab} onOcc={setOccTab} onPick={pickTemplate} ready={ready} t9={t9} />

        <div className="export">
          <label>
            <span>{t9.quality}</span>
            <select value={quality} onChange={(e) => setQuality(e.target.value as '1080' | '720')} disabled={busy}>
              <option value="1080">{t9.q1080}</option>
              <option value="720">{t9.q720}</option>
            </select>
          </label>
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
            <button className="go" onClick={doExport} disabled={!ready}>
              {t9.export}
            </button>
          )}
        </div>
        {msg && <p className={'msg ' + msg.type}>{msg.text}</p>}
      </main>
    </div>
  )
}

function TemplateStrip(props: {
  rc: ReturnType<typeof makeRenderCtx>
  active: string
  occ: string
  onOcc: (o: string) => void
  onPick: (id: string) => void
  ready: boolean
  t9: (typeof DICT)['ar']
}) {
  const { rc, ready, occ, t9 } = props
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const list = useMemo(() => TEMPLATES.filter((x) => x.occasion === occ), [occ])
  useEffect(() => {
    if (!ready) return
    const h = setTimeout(() => {
      for (const tp of list) {
        const cv = refs.current[tp.id]
        if (cv) renderFrame(cv, tp, rc, tp.duration(rc) * 0.7)
      }
    }, 120)
    return () => clearTimeout(h)
  }, [rc, ready, list])
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
          <button key={tp.id} role="radio" aria-checked={props.active === tp.id} onClick={() => props.onPick(tp.id)}>
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
              {t9.layouts[tp.layout]} {tp.variant + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function OverlayPicker(props: { t9: (typeof DICT)['ar']; onPick: (id: string) => void }) {
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
        <button key={p.id} title={`${props.t9.shapes[p.shape]} ${props.t9.motions[p.motion]}`} onClick={() => props.onPick(p.id)}>
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
