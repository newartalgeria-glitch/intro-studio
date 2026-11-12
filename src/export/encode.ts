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

export async function exportMp4(o: ExportOpts): Promise<{ blob: Blob; codec: string }> {
  if (!webCodecsAvailable()) throw new Error('NO_WEBCODECS')
  const { width, height, fps } = o
  const bitrate = width >= 1920 ? 10_000_000 : 5_000_000
  const cand = await pickCodec(width, height, fps, bitrate)
  if (!cand) throw new Error('NO_ENCODER')

  const dur = o.tpl.duration(o.rc)
  const total = Math.round(dur * fps)
  const target = new ArrayBufferTarget()
  const muxer = new Muxer({ target, video: { codec: cand.mux, width, height }, fastStart: 'in-memory' })
  let failure: unknown = null
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
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), codec: cand.label }
}
