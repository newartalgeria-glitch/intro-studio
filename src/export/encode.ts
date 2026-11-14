import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import { renderFrame } from '../engine'
import type { RenderCtx, Template } from '../engine'

type Cand = { codec: string; mux: 'avc' | 'vp9'; label: string }

const CANDIDATES: Cand[] = [
  { codec: 'avc1.640028', mux: 'avc', label: 'H.264 High' },
  { codec: 'avc1.4d0028', mux: 'avc', label: 'H.264 Main' },
  { codec: 'avc1.42001f', mux: 'avc', label: 'H.264 Baseline' },
  { codec: 'vp09.00.40.08', mux: 'vp9', label: 'VP9' },
]

export const webCodecsAvailable = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'

export interface ExportOpts {
  tpl: Template
  rc: RenderCtx
  width: number
  height: number
  fps: number
  onProgress: (p: number) => void
  signal?: AbortSignal
  /** finished soundtrack (stereo, 44.1 kHz); omitted = silent video */
  audio?: AudioBuffer | null
}

export async function pickCodec(width: number, height: number, fps: number, bitrate: number) {
  for (const cand of CANDIDATES) {
    try {
      const s = await VideoEncoder.isConfigSupported({ codec: cand.codec, width, height, bitrate, framerate: fps })
      if (s.supported) return cand
    } catch {
      /* try next */
    }
  }
  return null
}

type ACand = { codec: string; mux: 'aac' | 'opus'; label: string }
const ACANDS: ACand[] = [
  { codec: 'mp4a.40.2', mux: 'aac', label: 'AAC' },
  { codec: 'opus', mux: 'opus', label: 'Opus' },
]

async function pickAudio(rate: number) {
  if (typeof AudioEncoder === 'undefined') return null
  for (const c of ACANDS) {
    try {
      const s = await AudioEncoder.isConfigSupported({ codec: c.codec, sampleRate: rate, numberOfChannels: 2, bitrate: 192_000 })
      if (s.supported) return c
    } catch {
      /* next */
    }
  }
  return null
}

export async function exportMp4(o: ExportOpts): Promise<{ blob: Blob; codec: string }> {
  if (!webCodecsAvailable()) throw new Error('NO_WEBCODECS')
  const { width, height, fps } = o
  const bitrate = width >= 1920 ? 10_000_000 : 5_000_000
  const cand = await pickCodec(width, height, fps, bitrate)
  if (!cand) throw new Error('NO_ENCODER')

  const dur = o.tpl.duration(o.rc)
  const total = Math.round(dur * fps)
  const target = new ArrayBufferTarget()
  const ac = o.audio ? await pickAudio(o.audio.sampleRate) : null
  if (o.audio && !ac) throw new Error('NO_AUDIO_ENCODER')
  const muxer = new Muxer({
    target,
    video: { codec: cand.mux, width, height },
    ...(o.audio && ac ? { audio: { codec: ac.mux, numberOfChannels: 2, sampleRate: o.audio.sampleRate } } : {}),
    fastStart: 'in-memory',
  })
  let failure: unknown = null
  if (o.audio && ac) {
    const buf = o.audio
    const aenc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => {
        failure = e
      },
    })
    aenc.configure({ codec: ac.codec, sampleRate: buf.sampleRate, numberOfChannels: 2, bitrate: 192_000 })
    const L = buf.getChannelData(0)
    const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L
    const CH = 4096
    for (let a = 0; a < buf.length; a += CH) {
      const n = Math.min(CH, buf.length - a)
      const planar = new Float32Array(n * 2)
      planar.set(L.subarray(a, a + n), 0)
      planar.set(R.subarray(a, a + n), n)
      const ad = new AudioData({ format: 'f32-planar', sampleRate: buf.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((a * 1e6) / buf.sampleRate), data: planar })
      aenc.encode(ad)
      ad.close()
      while (aenc.encodeQueueSize > 20) await new Promise((r) => setTimeout(r, 1))
    }
    await aenc.flush()
    aenc.close()
    if (failure) throw failure
  }
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      failure = e
    },
  })
  encoder.configure({ codec: cand.codec, width, height, bitrate, framerate: fps })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  for (let i = 0; i < total; i++) {
    if (o.signal?.aborted) {
      encoder.close()
      throw new Error('ABORTED')
    }
    if (failure) throw failure
    renderFrame(canvas, o.tpl, o.rc, i / fps)
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) })
    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 })
    frame.close()
    while (encoder.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 2))
    if (i % 3 === 0) {
      o.onProgress(i / total)
      await new Promise((r) => setTimeout(r, 0))
    }
  }
  await encoder.flush()
  if (failure) throw failure
  encoder.close()
  muxer.finalize()
  o.onProgress(1)
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), codec: cand.label + (ac ? ' + ' + ac.label : '') }
}
