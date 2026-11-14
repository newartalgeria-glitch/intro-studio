/** One piece of the music on the audio track: plays buffer[inPt..outPt] starting at `start` on the timeline. */
export interface AudioClip {
  id: number
  start: number
  inPt: number
  outPt: number
}

export interface Music {
  name: string
  buffer: AudioBuffer
  /** original file, kept for the project file */
  dataUrl: string
  volume: number
}

export const clipLen = (c: AudioClip) => c.outPt - c.inPt

export async function decodeFile(file: File): Promise<Music> {
  const bytes = await file.arrayBuffer()
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  try {
    const buffer = await ctx.decodeAudioData(bytes.slice(0))
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(String(r.result))
      r.onerror = () => rej(r.error)
      r.readAsDataURL(file)
    })
    return { name: file.name, buffer, dataUrl, volume: 1 }
  } finally {
    ctx.close()
  }
}

export async function decodeDataUrl(name: string, dataUrl: string, volume: number): Promise<Music> {
  const bytes = await (await fetch(dataUrl)).arrayBuffer()
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  try {
    return { name, buffer: await ctx.decodeAudioData(bytes), dataUrl, volume }
  } finally {
    ctx.close()
  }
}

/** Min/max-ish envelope for drawing the waveform, 0..1 per bucket. */
export function peaks(buf: AudioBuffer, n: number): Float32Array {
  const out = new Float32Array(n)
  const d = buf.getChannelData(0)
  const step = Math.max(1, Math.floor(d.length / n))
  for (let i = 0; i < n; i++) {
    let m = 0
    const a = i * step
    for (let j = 0; j < step; j += Math.max(1, Math.floor(step / 40))) m = Math.max(m, Math.abs(d[a + j] ?? 0))
    out[i] = m
  }
  return out
}

const FADE_OUT = 1.5

/** Schedules every clip on any (offline or live) context from timeline time `from`. */
function schedule(ctx: BaseAudioContext, dest: AudioNode, m: Music, clips: AudioClip[], from: number, at: number, dur: number) {
  const gain = ctx.createGain()
  gain.gain.value = m.volume
  // gentle fade at the very end of the video
  const endCtx = at + (dur - from)
  if (dur - from > FADE_OUT) {
    gain.gain.setValueAtTime(m.volume, at + Math.max(0, dur - FADE_OUT - from))
    gain.gain.linearRampToValueAtTime(0, endCtx)
  }
  gain.connect(dest)
  const srcs: AudioBufferSourceNode[] = []
  for (const c of clips) {
    const end = c.start + clipLen(c)
    if (end <= from || c.start >= dur) continue
    const s = ctx.createBufferSource()
    s.buffer = m.buffer
    s.connect(gain)
    const skip = Math.max(0, from - c.start)
    const when = at + Math.max(0, c.start - from)
    const len = Math.min(clipLen(c) - skip, dur - Math.max(c.start, from))
    if (len <= 0) continue
    s.start(when, c.inPt + skip, len)
    srcs.push(s)
  }
  return srcs
}

export class Player {
  private ctx: AudioContext | null = null
  private srcs: AudioBufferSourceNode[] = []
  play(m: Music | null, clips: AudioClip[], from: number, dur: number) {
    this.stop()
    if (!m || !clips.length) return
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = this.ctx ?? new Ctx()
    void this.ctx.resume()
    this.srcs = schedule(this.ctx, this.ctx.destination, m, clips, from, this.ctx.currentTime + 0.05, dur)
  }
  stop() {
    for (const s of this.srcs) {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    }
    this.srcs = []
  }
}

export const SAMPLE_RATE = 44100

/** Mixes the whole soundtrack for the export. */
export async function mixdown(m: Music, clips: AudioClip[], dur: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(dur * SAMPLE_RATE), SAMPLE_RATE)
  schedule(ctx, ctx.destination, m, clips, 0, 0, dur)
  return ctx.startRendering()
}
