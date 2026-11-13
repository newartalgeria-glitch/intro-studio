import { useEffect, useRef, useState } from 'react'
import type { FieldKey, Wins } from './engine'
import type { DICT } from './i18n'

const FIELDS: FieldKey[] = ['headline', 'name1', 'connector', 'name2', 'date', 'place', 'footer']
const LAB = 74
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export interface TlPhoto {
  id: number
  thumb: string
  dur: number
}

interface Props {
  t9: (typeof DICT)['ar']
  total: number
  t: number
  playing: boolean
  photos: TlPhoto[]
  /** long templates let the user time every photo; short ones do it themselves */
  editable: boolean
  wins: Wins
  texts: Record<FieldKey, string>
  field: FieldKey
  onField: (f: FieldKey) => void
  onSeek: (t: number) => void
  onDur: (id: number, d: number) => void
  onWin: (f: FieldKey, w: [number, number]) => void
}

export function Timeline(p: Props) {
  const { t9, total, t } = p
  const [zoom, setZoom] = useState(1)
  const box = useRef<HTMLDivElement>(null)
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

  const drag = (e: React.PointerEvent, move: (dt: number) => void) => {
    e.stopPropagation()
    e.preventDefault()
    const x0 = e.clientX
    const mv = (ev: PointerEvent) => move((ev.clientX - x0) / px)
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
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
        <div className="tlin" style={{ width: LAB + width + 8 }}>
          <div className="tlrow ruler">
            <div className="tllab" />
            <div className="tllane" style={{ width }} onPointerDown={seekAt}>
              {ticks.map((s) => (
                <span key={s} className="tick" style={{ left: s * px }}>
                  {fmt(s)}
                </span>
              ))}
            </div>
          </div>

          <div className="tlrow">
            <div className="tllab">{t9.tlPhotos}</div>
            <div className="tllane photo" style={{ width }} onPointerDown={seekAt}>
              {p.photos.length === 0 && <div className="clip ghost" style={{ left: 0, width }}>{t9.tlSample}</div>}
              {p.editable &&
                clips.map((c) => (
                  <div
                    key={c.id}
                    className="clip pic"
                    style={{ left: c.start * px, width: Math.max(4, c.dur * px - 1), backgroundImage: `url(${c.thumb})` }}
                    title={`${c.dur.toFixed(1)} ${t9.tlSeconds}`}
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
              {!p.editable &&
                p.photos.map((c, i) => (
                  <div key={c.id} className="clip pic dim" style={{ left: i * even * px, width: Math.max(4, even * px - 1), backgroundImage: `url(${c.thumb})` }} />
                ))}
            </div>
          </div>
          {!p.editable && p.photos.length > 0 && <div className="tlnote">{t9.tlLegacyNote}</div>}

          {FIELDS.map((f) => {
            const [s, e] = p.wins[f]
            return (
              <div key={f} className={'tlrow' + (p.field === f ? ' sel' : '')}>
                <div className="tllab" onClick={() => p.onField(f)}>
                  {t9[f].replace(/\s*\(.*\)/, '')}
                </div>
                <div className="tllane" style={{ width }} onPointerDown={seekAt}>
                  <div
                    className="clip txt"
                    style={{ left: s * px, width: Math.max(8, (e - s) * px) }}
                    onPointerDown={(ev) => {
                      p.onField(f)
                      const len = e - s
                      drag(ev, (dt) => {
                        const ns = clamp(s + dt, 0, total - len)
                        p.onWin(f, [ns, ns + len])
                      })
                    }}
                  >
                    <i className="grip l" onPointerDown={(ev) => { p.onField(f); drag(ev, (dt) => p.onWin(f, [clamp(s + dt, 0, e - 0.5), e])) }} />
                    <span>{p.texts[f] || t9[f]}</span>
                    <i className="grip" onPointerDown={(ev) => { p.onField(f); drag(ev, (dt) => p.onWin(f, [s, clamp(e + dt, s + 0.5, total)])) }} />
                  </div>
                </div>
              </div>
            )
          })}
          <div className="playhead" style={{ left: LAB + t * px }} />
        </div>
      </div>
    </div>
  )
}
