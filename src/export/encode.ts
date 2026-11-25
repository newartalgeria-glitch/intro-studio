import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import { prepareMedia, renderFrame } from '../engine'
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
  /** 9:16 phone layout: the 16:9 picture is centred over a blurred copy of itself (width x height = 1080 x 1920) */
  vertical?: boolean
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

/** Yields to the event loop without timers: timers are throttled to ~1/s in background tabs, messages are not. */
const yieldNow = () =>
  new Promise<void>((res) => {
    const ch = new MessageChannel()
    ch.port1.onmessage = () => {
      ch.port1.close()
      res()
    }
    ch.port2.postMessage(0)
  })

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
  const bitrate = width >= 1920 || height >= 1920 ? 10_000_000 : 5_000_000
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
      while (aenc.encodeQueueSize > 20) await yieldNow()
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
  // vertical: draw the normal 16:9 frame (at width 1920) on a hidden canvas, then lay it out for portrait
  const src = o.vertical ? document.createElement('canvas') : null
  const tiny = o.vertical ? document.createElement('canvas') : null
  if (src && tiny) {
    src.width = 1920
    src.height = Math.round((1920 * o.rc.H) / o.rc.W)
    tiny.width = 54
    tiny.height = 96
  }

  for (let i = 0; i < total; i++) {
    if (o.signal?.aborted) {
      encoder.close()
      throw new Error('ABORTED')
    }
    if (failure) throw failure
    if (o.rc.mclips.length) await prepareMedia(o.rc.mclips, i / fps)
    if (src && tiny) {
      renderFrame(src, o.tpl, o.rc, i / fps)
      const tc = tiny.getContext('2d')!
      const cover = Math.max(tiny.width / src.width, tiny.height / src.height)
      const tw = src.width * cover
      const th = src.height * cover
      tc.drawImage(src, (tiny.width - tw) / 2, (tiny.height - th) / 2, tw, th)
      const c = canvas.getContext('2d')!
      c.imageSmoothingEnabled = true
      c.imageSmoothingQuality = 'high'
      c.drawImage(tiny, 0, 0, width, height)
      c.fillStyle = 'rgba(0,0,0,0.35)'
      c.fillRect(0, 0, width, height)
      const fh = Math.round((width * src.height) / src.width)
      c.drawImage(src, 0, Math.round((height - fh) / 2), width, fh)
    } else {
      renderFrame(canvas, o.tpl, o.rc, i / fps)
    }
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) })
    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 })
    frame.close()
    while (encoder.encodeQueueSize > 6) await yieldNow()
    if (i % 3 === 0) {
      o.onProgress(i / total)
      await yieldNow()
    }
  }
  await encoder.flush()
  if (failure) throw failure
  encoder.close()
  muxer.finalize()
  o.onProgress(1)
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), codec: cand.label + (ac ? ' + ' + ac.label : '') }
}
