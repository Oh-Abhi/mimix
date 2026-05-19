'use client'
import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react'
import { Song, PlayerState } from '@/lib/types'

interface PlayerContextType {
  state: PlayerState
  songs: Song[]
  setSongs: (s: Song[]) => void
  playSong: (song: Song) => void
  playSongList: (list: Song[], shuffle?: boolean) => void
  togglePlay: () => void
  seekTo: (frac: number) => void
  setVolume: (v: number) => void
  skipNext: () => void
  skipPrev: () => void
  minimize: () => void
  maximize: () => void
  toggleFullscreen: () => void
  closePlayer: () => void
}

const Ctx = createContext<PlayerContextType | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { YT: any; onYouTubeIframeAPIReady: (() => void) | undefined } }

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([])
  const [state, setState] = useState<PlayerState>({
    currentSong: null, isPlaying: false, progress: 0, duration: 0, volume: 0.85, minimized: false, fullscreen: false,
  })

  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const songRef = useRef<Song | null>(null)
  // "Active queue" for Play Collection / Play All — controls what skipNext/skipPrev navigate
  const queueRef = useRef<Song[]>([])
  const volumeRef = useRef(0.85)

  useEffect(() => {
    if (document.getElementById('yt-api-script')) return
    const tag = document.createElement('script')
    tag.id = 'yt-api-script'
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => {}
  }, [])

  const clearPoll = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  // Keep volume ref in sync
  useEffect(() => { volumeRef.current = state.volume }, [state.volume])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startPoll = useCallback((clipStart: number, clipEnd: number) => {
    clearPoll()
    intervalRef.current = setInterval(() => {
      const p = playerRef.current
      if (!p || typeof p.getCurrentTime !== 'function') return
      const cur = p.getCurrentTime()
      const elapsed = cur - clipStart
      const dur = clipEnd - clipStart
      const frac = Math.max(0, Math.min(1, elapsed / dur))
      setState(s => ({ ...s, progress: frac }))

      if (cur >= clipEnd - 1.5) {
        clearPoll()
        try { p.stopVideo() } catch {}
        // Auto-advance through queue
        const queue = queueRef.current
        const idx = queue.findIndex(s => s.id === songRef.current?.id)
        if (idx >= 0 && idx < queue.length - 1) {
          playSongInner(queue[idx + 1])
        }
      }
    }, 250)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const destroyPlayer = () => {
    clearPoll()
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch {}
      playerRef.current = null
    }
  }

  const ensureContainer = () => {
    if (containerRef.current && document.getElementById('yt-player')) return
    const existing = document.getElementById('yt-player-container')
    if (existing) { containerRef.current = existing as HTMLDivElement; return }
    const div = document.createElement('div')
    div.id = 'yt-player-container'
    div.style.cssText = 'position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;'
    document.body.appendChild(div)
    const inner = document.createElement('div')
    inner.id = 'yt-player'
    div.appendChild(inner)
    containerRef.current = div
  }

  const playSongInner = useCallback((song: Song) => {
    if (!song.youtubeId) return
    songRef.current = song
    const clipDur = song.clipEnd - song.clipStart
    setState(s => ({ ...s, currentSong: song, isPlaying: true, progress: 0, duration: clipDur }))
    clearPoll()

    const doPlay = () => {
      if (!window.YT?.Player) { setTimeout(doPlay, 350); return }
      destroyPlayer()
      ensureContainer()
      playerRef.current = new window.YT.Player('yt-player', {
        height: '1', width: '1',
        videoId: song.youtubeId,
        playerVars: { start: Math.floor(song.clipStart), autoplay: 1, controls: 0 },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(volumeRef.current * 100)
            e.target.seekTo(song.clipStart, true)
            e.target.playVideo()
            startPoll(song.clipStart, song.clipEnd)
          },
          onStateChange: (e: any) => {
            setState(s => ({ ...s, isPlaying: e.data === 1 }))
          },
        },
      })
    }
    doPlay()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startPoll])

  // Public playSong — uses global songs queue
  const playSong = useCallback((song: Song) => {
    // If no active queue yet, set queue to global songs
    if (!queueRef.current.length) queueRef.current = songs
    playSongInner(song)
  }, [songs, playSongInner])

  // Play a specific ordered/shuffled list
  const playSongList = useCallback((list: Song[], shuffle = false) => {
    if (!list.length) return
    const queue = shuffle ? [...list].sort(() => Math.random() - 0.5) : [...list]
    queueRef.current = queue
    playSongInner(queue[0])
  }, [playSongInner])

  const togglePlay = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (state.isPlaying) { p.pauseVideo(); clearPoll() }
    else {
      p.playVideo()
      if (songRef.current) startPoll(songRef.current.clipStart, songRef.current.clipEnd)
    }
  }, [state.isPlaying, startPoll])

  const seekTo = useCallback((frac: number) => {
    const p = playerRef.current; const s = songRef.current
    if (!p || !s) return
    p.seekTo(s.clipStart + frac * (s.clipEnd - s.clipStart), true)
    setState(st => ({ ...st, progress: frac }))
  }, [])

  const setVolume = useCallback((v: number) => {
    volumeRef.current = v
    playerRef.current?.setVolume(v * 100)
    setState(s => ({ ...s, volume: v }))
  }, [])

  const skipNext = useCallback(() => {
    const queue = queueRef.current.length ? queueRef.current : songs
    const idx = queue.findIndex(s => s.id === songRef.current?.id)
    const next = queue[(idx + 1) % queue.length]
    if (next) playSongInner(next)
  }, [songs, playSongInner])

  const skipPrev = useCallback(() => {
    const queue = queueRef.current.length ? queueRef.current : songs
    const idx = queue.findIndex(s => s.id === songRef.current?.id)
    const prev = queue[(idx - 1 + queue.length) % queue.length]
    if (prev) playSongInner(prev)
  }, [songs, playSongInner])

  const minimize = useCallback(() => setState(s => ({ ...s, minimized: true, fullscreen: false })), [])
  const maximize = useCallback(() => setState(s => ({ ...s, minimized: false })), [])
  const toggleFullscreen = useCallback(() => setState(s => ({ ...s, fullscreen: !s.fullscreen, minimized: false })), [])
  const closePlayer = useCallback(() => {
    destroyPlayer()
    queueRef.current = []
    songRef.current = null
    setState({ currentSong: null, isPlaying: false, progress: 0, duration: 0, volume: volumeRef.current, minimized: false, fullscreen: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (!state.currentSong) return
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowRight') skipNext()
      if (e.key === 'ArrowLeft') skipPrev()
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === 'Escape') { if (state.fullscreen) toggleFullscreen(); else if (state.minimized) closePlayer(); else minimize() }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [state, togglePlay, skipNext, skipPrev, minimize, closePlayer])

  useEffect(() => () => { destroyPlayer() }, [])

  return (
    <Ctx.Provider value={{ state, songs, setSongs, playSong, playSongList, togglePlay, seekTo, setVolume, skipNext, skipPrev, minimize, maximize, toggleFullscreen, closePlayer }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePlayer = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}
