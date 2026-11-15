import { useEffect, useRef, useState } from 'react'
import type { TextClip } from './engine'
import type { AudioClip } from './audio'
import { clipLen } from './audio'
import type { DICT } from './i18n'

const LAB = 74
const ROW = 30
const AROW = 45
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export interface TlPhoto {
  id: number
  thumb: string
  dur: number
}
export type Sel = { kind: 'text' | 'audio'; id: number } | null

export interface TlAudio {
  name: string
  duration: number
  peaks: Float32Array
  clips: AudioClip[]
}

interface Props {
  t9: (typeof DICT)['ar']
  total: number
  t: number
  playing: boolean
  photos: TlPhoto[]
  /** long templates let the user time every photo; short ones do it themselves */
  editable: boolean
  texts: TextClip[]
  audio: TlAudio | null
  sel: Sel
  onSel: (s: Sel) => void
  onSeek: (t: number) => void
  onDur: (id: number, d: number) => void
  length: number
  onLength: (n: number) => void
  extra: { dur: number; thumb: string }[]
  onDurAll: (d: number) => void
  onRemove: (id: number) => void
  onText: (id: number, patch: Partial<TextClip>) => void
  /** called when a drag ends so overlapping clips can be moved to a free track */
  onSettle: (id: number) => void
  onAudioClip: (id: number, patch: Partial<AudioClip>) => void
}

const VMAX = 2

function Wave({ peaks, duration, inPt, outPt, w }: { peaks: Float32Array; duration: number; inPt: number; outPt: number; w: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const cw = Math.max(1, Math.min(3000, Math.round(w)))
    cv.width = cw
    cv.height = AROW - 6
    const c = cv.getContext('2d')!
    c.clearRect(0, 0, cw, cv.height)
    c.fillStyle = 'rgba(255,255,255,.85)'
    const n = peaks.length
    for (let x = 0; x < cw; x++) {
      const tt = inPt + ((outPt - inPt) * x) / cw
      const v = peaks[Math.min(n - 1, Math.floor((tt / duration) * n))] ?? 0
      const h = Math.max(1, v * (cv.height - 2))
      c.fillRect(x, (cv.height - h) / 2, 1, h)
    }
  }, [peaks, duration, inPt, outPt, w])
  return <canvas ref={ref} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
}

export function Timeline(p: Props) {
  const { t9, total, t } = p
  const [zoom, setZoom] = useState(1)
  const [menu, setMenu] = useState<{ id: number; x: number; y: number } | null>(null)
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [menu])
  const menuPhoto = menu ? p.photos.find((x) => x.id === menu.id) : undefined
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [vw, setVw] = useState(520)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setVw(Math.max(200, el.clientWidth - LAB - 8)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const px = (vw / total) * zoom
  const width = total * px
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

  // keep the playhead in view while playing
  useEffect(() => {
    const el = box.current
    if (!el || zoom <= 1 || !p.playing) return
    const x = t * px
    if (x < el.scrollLeft || x > el.scrollLeft + vw - 40) el.scrollLeft = Math.max(0, x - 60)
  }, [t, px, vw, zoom, p.playing])

  const drag = (e: React.PointerEvent, move: (dt: number, dy: number) => void, done?: () => void) => {
    e.stopPropagation()
    e.preventDefault()
    const x0 = e.clientX
    const y0 = e.clientY
    const mv = (ev: PointerEvent) => move((ev.clientX - x0) / px, ev.clientY - y0)
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
      done?.()
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  const seekAt = (e: React.PointerEvent<HTMLElement>) => {
    const lane = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const go = (cx: number) => p.onSeek(clamp((cx - lane.left) / px, 0, total))
    go(e.clientX)
    const mv = (ev: PointerEvent) => go(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  const step = [1, 2, 5, 10, 15, 30, 60].find((s) => s * px >= 64) ?? 120
  const ticks: number[] = []
  for (let s = 0; s <= total; s += step) ticks.push(s)

  const maxTr = p.texts.reduce((m, k) => Math.max(m, k.track), -1)
  const nTracks = Math.max(3, maxTr + 2)
  let acc = 0
  const clips = p.photos.map((ph) => {
    const start = acc
    acc += ph.dur
    return { ...ph, start }
  })
  // short templates: show photos evenly across the template, read-only
  const even = !p.editable && p.photos.length > 0 ? total / p.photos.length : 0

  return (
    <div className="tl" dir="ltr">
      <div className="tlbar">
        <small>{t9.tlHint}</small>
        <label>
          <span>{t9.tlZoom}</span>
          <input type="range" min={1} max={10} step={0.5} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
      </div>
      <div className="tlscroll" ref={box}>
        <div className="tlin" ref={inner} style={{ width: LAB + width + 8 }}>
          <div className="tlrow ruler">
            <div className="tllab" />
            <div className="tllane" style={{ width }} onPointerDown={seekAt}>
              {ticks.map((s) => (
                <span key={s} className="tick" style={{ left: s * px }}>
                  {fmt(s)}
                </span>
              ))}
              <i
              className="knob" style={{ left: t * px }}
              onPointerDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                const el = inner.current!
                const go = (cx: number) => p.onSeek(clamp((cx - el.getBoundingClientRect().left - LAB) / px, 0, total))
                const mv = (ev: PointerEvent) => go(ev.clientX)
                const up = () => {
                  window.removeEventListener('pointermove', mv)
                  window.removeEventListener('pointerup', up)
                }
                window.addEventListener('pointermove', mv)
                window.addEventListener('pointerup', up)
              }}
            />
            </div>
          </div>

          <div className="tlrow">
            <div className="tllab">{t9.tlTrack} 1</div>
            <div className="tllane photo" style={{ width }} onPointerDown={seekAt}>
              {p.photos.length === 0 && <div className="clip ghost" style={{ left: 0, width }}>{t9.tlSample}</div>}
              {p.editable &&
                clips.map((c) => (
                  <div
                    key={c.id}
                    className="clip pic"
                    style={{ left: c.start * px, width: Math.max(4, c.dur * px - 1), backgroundImage: `url(${c.thumb})` }}
                    title={`${c.dur.toFixed(1)} ${t9.tlSeconds}`}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setMenu({ id: c.id, x: e.clientX, y: e.clientY })
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      p.onSeek(c.start)
                    }}
                  >
                    <i
                      className="grip"
                      onPointerDown={(e) => {
                        const d0 = c.dur
                        drag(e, (dt) => p.onDur(c.id, clamp(Math.round((d0 + dt) * 2) / 2, 2, 40)))
                      }}
                    />
                  </div>
                ))}
              {p.editable &&
                p.extra.map((c, i) => {
                  const start = acc + p.extra.slice(0, i).reduce((a, b) => a + b.dur, 0)
                  return <div key={'x' + i} className="clip pic dim" title={t9.tlLoop} style={{ left: start * px, width: Math.max(4, c.dur * px - 1), backgroundImage: `url(${c.thumb})` }} />
                })}
              {!p.editable &&
                p.photos.map((c, i) => (
                  <div key={c.id} className="clip pic dim" style={{ left: i * even * px, width: Math.max(4, even * px - 1), backgroundImage: `url(${c.thumb})` }} />
                ))}
            </div>
          </div>
          {!p.editable && p.photos.length > 0 && <div className="tlnote">{t9.tlLegacyNote}</div>}

          {Array.from({ length: nTracks }, (_, tr) => (
            <div key={'tt' + tr} className="tlrow">
              <div className="tllab">
                {t9.tlTrack} {tr + 2}
              </div>
              <div className="tllane" style={{ width }} onPointerDown={(e) => { p.onSel(null); seekAt(e) }}>
                {p.texts
                  .filter((k) => k.track === tr)
                  .map((k) => {
                    const on = p.sel?.kind === 'text' && p.sel.id === k.id
                    return (
                      <div
                        key={k.id}
                        className={'clip txt' + (on ? ' on' : '')}
                        style={{ left: k.start * px, width: Math.max(10, k.dur * px) }}
                        title={`${fmt(k.start)} → ${fmt(k.start + k.dur)}`}
                        onPointerDown={(ev) => {
                          p.onSel({ kind: 'text', id: k.id })
                          const s0 = k.start
                          const tr0 = k.track
                          drag(
                            ev,
                            (dt, dy) =>
                              p.onText(k.id, {
                                start: clamp(Math.round((s0 + dt) * 10) / 10, 0, Math.max(0, total - k.dur)),
                                track: Math.max(0, tr0 + Math.round(dy / ROW)),
                              }),
                            () => p.onSettle(k.id),
                          )
                        }}
                      >
                        <i className="grip l" onPointerDown={(ev) => { p.onSel({ kind: 'text', id: k.id }); const s0 = k.start, e0 = k.start + k.dur; drag(ev, (dt) => { const ns = clamp(Math.round((s0 + dt) * 10) / 10, 0, e0 - 0.5); p.onText(k.id, { start: ns, dur: e0 - ns }) }, () => p.onSettle(k.id)) }} />
                        <span>{k.text.replace(/\n/g, ' ')}</span>
                        <i className="grip" onPointerDown={(ev) => { p.onSel({ kind: 'text', id: k.id }); const d0 = k.dur; drag(ev, (dt) => p.onText(k.id, { dur: clamp(Math.round((d0 + dt) * 10) / 10, 0.5, total - k.start) }), () => p.onSettle(k.id)) }} />
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}

          <div className="tlrow aud" style={{ height: AROW }}>
            <div className="tllab note" title={t9.tlAudio}>♪</div>
            <div className="tllane" style={{ width }} onPointerDown={(e) => { p.onSel(null); seekAt(e) }}>
              {!p.audio && <div className="clip ghost" style={{ left: 0, width: Math.min(width, 340) }}>{t9.tlAudio}: {t9.musicNone}</div>}
              {p.audio?.clips.map((c) => {
                const on = p.sel?.kind === 'audio' && p.sel.id === c.id
                const a = p.audio!
                const w = clipLen(c) * px
                return (
                  <div
                    key={c.id}
                    className={'clip aud' + (on ? ' on' : '')}
                    style={{ left: c.start * px, width: Math.max(10, w) }}
                    title={`${a.name} · ${fmt(c.start)} → ${fmt(c.start + clipLen(c))}`}
                    onPointerDown={(ev) => {
                      p.onSel({ kind: 'audio', id: c.id })
                      const s0 = c.start
                      drag(ev, (dt) => p.onAudioClip(c.id, { start: clamp(Math.round((s0 + dt) * 10) / 10, 0, Math.max(0, total - 0.5)) }))
                    }}
                  >
                    <Wave peaks={a.peaks} duration={a.duration} inPt={c.inPt} outPt={c.outPt} w={w} />
                    {(() => {
                      const vol = c.vol ?? 1
                      const fade = Math.min(c.fade ?? 0, clipLen(c))
                      const ly = (1 - vol / VMAX) * (AROW - 6)
                      const fx = Math.max(0, w - 16 - fade * px)
                      return (
                        <>
                          <svg className="vline" width={Math.max(10, w)} height={AROW - 6} style={{ pointerEvents: 'none' }}>
                            <polyline points={`0,${ly} ${fx},${ly} ${Math.max(10, w)},${AROW - 6}`} fill="none" stroke="#ff2d2d" strokeWidth="3" strokeLinejoin="round" />
                          </svg>
                          <i
                            className="vhit"
                            title={t9.musicVolume}
                            style={{ top: ly - 6, width: Math.max(0, fx) }}
                            onPointerDown={(ev) => {
                              p.onSel({ kind: 'audio', id: c.id })
                              const v0 = vol
                              drag(ev, (_dt, dy) => p.onAudioClip(c.id, { vol: Math.round(clamp(v0 - (dy / (AROW - 6)) * VMAX, 0, VMAX) * 20) / 20 }))
                            }}
                          />
                          <i
                            className="fpt"
                            title={t9.musicFade}
                            style={{ left: fx - 6, top: ly - 6 }}
                            onPointerDown={(ev) => {
                              p.onSel({ kind: 'audio', id: c.id })
                              const f0 = fade
                              drag(ev, (dt) => p.onAudioClip(c.id, { fade: Math.round(clamp(f0 - dt, 0, Math.max(0, clipLen(c) - 16 / px)) * 10) / 10 }))
                            }}
                          />
                        </>
                      )
                    })()}
                    <i
                      className="grip l"
                      onPointerDown={(ev) => {
                        p.onSel({ kind: 'audio', id: c.id })
                        const i0 = c.inPt, s0 = c.start, o0 = c.outPt
                        drag(ev, (dt) => {
                          const d = clamp(dt, -Math.min(i0, s0), o0 - i0 - 0.5)
                          p.onAudioClip(c.id, { inPt: i0 + d, start: s0 + d })
                        })
                      }}
                    />
                    <i
                      className="grip"
                      onPointerDown={(ev) => {
                        p.onSel({ kind: 'audio', id: c.id })
                        const o0 = c.outPt
                        drag(ev, (dt) => p.onAudioClip(c.id, { outPt: clamp(o0 + dt, c.inPt + 0.5, a.duration) }))
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="playhead" style={{ left: LAB + t * px }} />
        </div>
      </div>
      {menu && menuPhoto && (
        <div className="ctx" style={{ left: Math.min(menu.x, window.innerWidth - 230), top: Math.min(menu.y, window.innerHeight - 320) }} onPointerDown={(e) => e.stopPropagation()}>
          <b>
            {t9.photoSec}: {menuPhoto.dur}
          </b>
          <div className="presets">
            {[2, 3, 4, 5, 6, 8, 10, 15].map((d) => (
              <button key={d} onClick={() => { p.onDur(menu.id, d); setMenu(null) }}>
                {d}
              </button>
            ))}
          </div>
          <input type="number" min={2} max={40} step={0.5} defaultValue={menuPhoto.dur} onChange={(e) => { const v = Number(e.target.value); if (v >= 2 && v <= 40) p.onDur(menu.id, v) }} />
          <button onClick={() => { p.onDurAll(menuPhoto.dur); setMenu(null) }}>{t9.applyAll}</button>
          <button className="danger" onClick={() => { p.onRemove(menu.id); setMenu(null) }}>✕</button>
        </div>
      )}
    </div>
  )
}
