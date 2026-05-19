'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Song } from '@/lib/types'

export interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
}

export function useAudioPlayer(songs: Song[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [state, setState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.85,
  })

  const clearFade = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
  }

  const fadeOut = useCallback((audio: HTMLAudioElement, cb: () => void) => {
    clearFade()
    const start = audio.volume
    let v = start
    fadeIntervalRef.current = setInterval(() => {
      v = Math.max(0, v - start / 15)
      audio.volume = v
      if (v <= 0) {
        clearFade()
        cb()
      }
    }, 30)
  }, [])

  const fadeIn = useCallback((audio: HTMLAudioElement, targetVol: number) => {
    clearFade()
    audio.volume = 0
    let v = 0
    fadeIntervalRef.current = setInterval(() => {
      v = Math.min(targetVol, v + targetVol / 20)
      audio.volume = v
      if (v >= targetVol) clearFade()
    }, 30)
  }, [])

  const playSong = useCallback((song: Song, vol?: number) => {
    const volume = vol ?? state.volume
    const doPlay = () => {
      const audio = new Audio(song.audioUrl)
      audio.volume = 0
      audioRef.current = audio
      audio.currentTime = song.clipStart

      const clipDuration = song.clipEnd - song.clipStart
      setState(s => ({ ...s, currentSong: song, isPlaying: true, progress: 0, duration: clipDuration }))

      audio.play().then(() => fadeIn(audio, volume)).catch(() => {})

      audio.ontimeupdate = () => {
        const elapsed = audio.currentTime - song.clipStart
        const frac = Math.min(elapsed / clipDuration, 1)
        setState(s => ({ ...s, progress: frac }))

        // Crossfade out 1.5s before end
        if (audio.currentTime >= song.clipEnd - 1.5 && audio.volume > 0) {
          clearFade()
          fadeOut(audio, () => {
            audio.pause()
            autoAdvance(song)
          })
        }
        if (audio.currentTime >= song.clipEnd) {
          audio.pause()
        }
      }

      audio.onerror = () => setState(s => ({ ...s, isPlaying: false }))
    }

    if (audioRef.current && !audioRef.current.paused) {
      fadeOut(audioRef.current, doPlay)
    } else {
      doPlay()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fadeIn, fadeOut, state.volume])

  const autoAdvance = useCallback((current: Song) => {
    const idx = songs.findIndex(s => s.id === current.id)
    const next = songs[(idx + 1) % songs.length]
    if (next) playSong(next)
  }, [songs, playSong])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
      fadeIn(audio, state.volume)
      setState(s => ({ ...s, isPlaying: true }))
    } else {
      fadeOut(audio, () => {
        audio.pause()
        setState(s => ({ ...s, isPlaying: false }))
      })
    }
  }, [fadeIn, fadeOut, state.volume])

  const seekTo = useCallback((frac: number) => {
    if (!audioRef.current || !state.currentSong) return
    const { clipStart, clipEnd } = state.currentSong
    audioRef.current.currentTime = clipStart + frac * (clipEnd - clipStart)
    setState(s => ({ ...s, progress: frac }))
  }, [state.currentSong])

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol
    setState(s => ({ ...s, volume: vol }))
  }, [])

  const skipNext = useCallback(() => {
    if (!state.currentSong) return
    autoAdvance(state.currentSong)
  }, [state.currentSong, autoAdvance])

  const skipPrev = useCallback(() => {
    if (!state.currentSong) return
    const idx = songs.findIndex(s => s.id === state.currentSong!.id)
    const prev = songs[(idx - 1 + songs.length) % songs.length]
    if (prev) playSong(prev)
  }, [state.currentSong, songs, playSong])

  const close = useCallback(() => {
    if (audioRef.current) {
      fadeOut(audioRef.current, () => audioRef.current?.pause())
    }
    setState(s => ({ ...s, currentSong: null, isPlaying: false, progress: 0 }))
  }, [fadeOut])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!state.currentSong) return
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowRight') skipNext()
      if (e.key === 'ArrowLeft') skipPrev()
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.currentSong, togglePlay, skipNext, skipPrev, close])

  useEffect(() => () => {
    clearFade()
    audioRef.current?.pause()
  }, [])

  return { state, playSong, togglePlay, seekTo, setVolume, skipNext, skipPrev, close }
}
