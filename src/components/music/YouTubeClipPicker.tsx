'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, Scissors, Play, Pause } from 'lucide-react'

interface YTPlayer {
  getCurrentTime(): number
  getDuration(): number
  seekTo(t: number, allow: boolean): void
  playVideo(): void
  pauseVideo(): void
  destroy(): void
  getPlayerState(): number
}

interface Props {
  videoId: string
  initialStart?: number
  initialEnd?: number
  onClipChange: (start: number, end: number) => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function YouTubeClipPicker({ videoId, initialStart = 0, initialEnd = 30, onClipChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const tickRef = useRef<number | null>(null)

  const [ready, setReady] = useState(false)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)  // 0-1
  const [isPlaying, setIsPlaying] = useState(false)
  const [clipStart, setClipStart] = useState(initialStart)
  const [clipEnd, setClipEnd] = useState(initialEnd)
  const [previewingClip, setPreviewingClip] = useState(false)
  const idRef = useRef(`yt-${Math.random().toString(36).slice(2)}`)

  // Load YT API once
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const initPlayer = () => {
      if (!containerRef.current) return
      playerRef.current = new w.YT.Player(idRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, controls: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setDuration(e.target.getDuration())
            setReady(true)
          },
          onStateChange: (e: { data: number }) => {
            setIsPlaying(e.data === w.YT.PlayerState.PLAYING)
          },
        },
      })
    }

    if (w.YT?.Player) {
      initPlayer()
    } else {
      w.onYouTubeIframeAPIReady = initPlayer
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }
    return () => {
      playerRef.current?.destroy()
      if (tickRef.current) cancelAnimationFrame(tickRef.current)
    }
  }, [videoId])

  // Progress ticker
  useEffect(() => {
    const tick = () => {
      if (playerRef.current && duration > 0) {
        const t = playerRef.current.getCurrentTime()
        setProgress(t / duration)
        // Stop at clip end during preview
        if (previewingClip && t >= clipEnd) {
          playerRef.current.pauseVideo()
          setPreviewingClip(false)
        }
      }
      tickRef.current = requestAnimationFrame(tick)
    }
    tickRef.current = requestAnimationFrame(tick)
    return () => { if (tickRef.current) cancelAnimationFrame(tickRef.current) }
  }, [duration, clipEnd, previewingClip])

  const markStart = useCallback(() => {
    const t = playerRef.current?.getCurrentTime() ?? 0
    const newStart = Math.min(t, clipEnd - 1)
    setClipStart(newStart)
    onClipChange(newStart, clipEnd)
  }, [clipEnd, onClipChange])

  const markEnd = useCallback(() => {
    const t = playerRef.current?.getCurrentTime() ?? 0
    const newEnd = Math.max(t, clipStart + 1)
    setClipEnd(newEnd)
    onClipChange(clipStart, newEnd)
  }, [clipStart, onClipChange])

  const previewClip = useCallback(() => {
    if (!playerRef.current) return
    playerRef.current.seekTo(clipStart, true)
    playerRef.current.playVideo()
    setPreviewingClip(true)
  }, [clipStart])

  // Scrub bar click/drag — seeks video
  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !playerRef.current || duration === 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t = ratio * duration
    playerRef.current.seekTo(t, true)
  }, [duration])

  // Marker drag
  const dragMarker = useCallback((marker: 'start' | 'end') => (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const bar = progressRef.current
    if (!bar || !playerRef.current || duration === 0) return
    const onMove = (mv: MouseEvent) => {
      const rect = bar.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (mv.clientX - rect.left) / rect.width))
      const t = ratio * duration
      playerRef.current?.seekTo(t, true)
      if (marker === 'start') {
        const s = Math.min(t, clipEnd - 1)
        setClipStart(s); onClipChange(s, clipEnd)
      } else {
        const end = Math.max(t, clipStart + 1)
        setClipEnd(end); onClipChange(clipStart, end)
      }
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [duration, clipStart, clipEnd, onClipChange])

  const startPct = duration > 0 ? (clipStart / duration) * 100 : 0
  const endPct = duration > 0 ? (clipEnd / duration) * 100 : 30

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* YouTube player */}
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#818cf8' }} />
          </div>
        )}
        <div id={idRef.current} ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Clip scrubber */}
      {ready && duration > 0 && (
        <div className="px-4 pt-3 pb-4 space-y-3">
          <div className="text-xs text-center font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Scrub video → click <span style={{ color: '#a78bfa' }}>Mark Start</span> / <span style={{ color: '#f472b6' }}>Mark End</span>
          </div>

          {/* Timeline bar */}
          <div className="relative h-10 flex items-center" ref={progressRef}>
            {/* Full track */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center">
              <div className="w-full h-2 rounded-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.1)' }}
                onClick={handleBarClick} />
            </div>

            {/* Selected clip range */}
            <div className="absolute h-2 rounded-full pointer-events-none"
              style={{ left: `${startPct}%`, width: `${endPct - startPct}%`, background: 'linear-gradient(90deg, #7c3aed, #db2777)' }} />

            {/* Playhead */}
            <div className="absolute w-0.5 h-4 rounded-full pointer-events-none"
              style={{ left: `${progress * 100}%`, background: 'white', transform: 'translateX(-50%)' }} />

            {/* Start marker */}
            <div className="absolute w-4 h-6 cursor-ew-resize z-10 flex items-center justify-center"
              style={{ left: `${startPct}%`, transform: 'translateX(-50%)' }}
              onMouseDown={dragMarker('start')}>
              <div className="w-2 h-6 rounded-sm" style={{ background: '#7c3aed', boxShadow: '0 0 8px #7c3aed' }} />
            </div>

            {/* End marker */}
            <div className="absolute w-4 h-6 cursor-ew-resize z-10 flex items-center justify-center"
              style={{ left: `${endPct}%`, transform: 'translateX(-50%)' }}
              onMouseDown={dragMarker('end')}>
              <div className="w-2 h-6 rounded-sm" style={{ background: '#db2777', boxShadow: '0 0 8px #db2777' }} />
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#a78bfa' }}>▶ {fmt(clipStart)}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>{Math.round(clipEnd - clipStart)}s clip</span>
            <span style={{ color: '#f472b6' }}>⏹ {fmt(clipEnd)}</span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={markStart}
              className="py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }}>
              <Scissors size={11} className="inline mr-1" />Mark Start
            </button>
            <button onClick={previewClip}
              className="py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {isPlaying && previewingClip
                ? <Pause size={11} className="inline mr-1" />
                : <Play size={11} className="inline mr-1" />
              }
              Preview Clip
            </button>
            <button onClick={markEnd}
              className="py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(219,39,119,0.25)', color: '#f9a8d4', border: '1px solid rgba(219,39,119,0.4)' }}>
              <Scissors size={11} className="inline mr-1" />Mark End
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
