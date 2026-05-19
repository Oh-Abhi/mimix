'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useCallback } from 'react'
import { usePlayer } from '@/components/providers/PlayerProvider'
import { getSongGradient, gradientStyle } from '@/lib/songGradients'
import { X, SkipBack, SkipForward, Volume2, Minimize2, Maximize2 } from 'lucide-react'

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Shared controls bar — used in both views
function Controls({ isPlaying, onToggle, onPrev, onNext, size = 'md' }: {
  isPlaying: boolean; onToggle: () => void; onPrev: () => void; onNext: () => void; size?: 'md' | 'lg'
}) {
  const btnSize = size === 'lg' ? 28 : 22
  const playSize = size === 'lg' ? 'w-20 h-20' : 'w-14 h-14'
  return (
    <div className={`flex items-center justify-center ${size === 'lg' ? 'gap-10' : 'gap-7'}`}>
      <motion.button onClick={onPrev} whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.88 }}
        style={{ color: 'rgba(255,255,255,0.5)' }}>
        <SkipBack size={btnSize} strokeWidth={1.8} />
      </motion.button>
      <motion.button onClick={onToggle} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        className={`${playSize} rounded-full flex items-center justify-center`}
        style={{ background: 'var(--accent)', boxShadow: '0 0 40px var(--accent-glow)' }}>
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div key="p" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="flex gap-1.5">
              <span className={`${size === 'lg' ? 'w-2 h-7' : 'w-1.5 h-5'} rounded-full bg-white`} />
              <span className={`${size === 'lg' ? 'w-2 h-7' : 'w-1.5 h-5'} rounded-full bg-white`} />
            </motion.div>
          ) : (
            <motion.div key="pl" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
              style={{ width: 0, height: 0, borderTop: `${size === 'lg' ? 12 : 9}px solid transparent`, borderBottom: `${size === 'lg' ? 12 : 9}px solid transparent`, borderLeft: `${size === 'lg' ? 18 : 14}px solid white`, marginLeft: `${size === 'lg' ? 4 : 3}px` }} />
          )}
        </AnimatePresence>
      </motion.button>
      <motion.button onClick={onNext} whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.88 }}
        style={{ color: 'rgba(255,255,255,0.5)' }}>
        <SkipForward size={btnSize} strokeWidth={1.8} />
      </motion.button>
    </div>
  )
}

export default function PlayerModal() {
  const { state, togglePlay, seekTo, setVolume, skipNext, skipPrev, minimize, closePlayer, toggleFullscreen } = usePlayer()
  const { currentSong: song, isPlaying, progress, duration, volume, minimized, fullscreen } = state

  const elapsed = duration * progress
  const remaining = duration - elapsed

  const gradient = song ? getSongGradient(song.id) : null
  const coverSrc = song
    ? (song.coverUrl || `https://img.youtube.com/vi/${song.youtubeId}/maxresdefault.jpg`)
    : ''

  useEffect(() => {
    const open = !!song && !minimized
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [song, minimized])

  const handleBar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)))
  }, [seekTo])

  if (!song || minimized) return null

  // ── FULLSCREEN MODE ────────────────────────────────────────────────────────
  if (fullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          key="fullscreen"
          className="fixed inset-0 z-[110] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: '#000' }}
        >
          {/* Immersive blurred cover background */}
          <div className="absolute inset-0">
            <Image src={coverSrc} alt="" fill className="object-cover scale-110 blur-3xl opacity-40" sizes="100vw" onError={() => {}} />
            {gradient && <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(${gradient.glowRgb},0.5), transparent 60%)` }} />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)' }} />
          </div>

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-8 pt-8">
            <motion.button onClick={toggleFullscreen} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Minimize2 size={16} color="rgba(255,255,255,0.7)" />
            </motion.button>
            <span className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Now Playing</span>
            <motion.button onClick={closePlayer} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <X size={16} color="rgba(255,255,255,0.7)" />
            </motion.button>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-8">
            {/* Huge album art */}
            <motion.div className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{ width: 'min(380px, 60vmin)', height: 'min(380px, 60vmin)', boxShadow: gradient ? `0 40px 100px rgba(${gradient.glowRgb},0.5)` : '0 40px 80px rgba(0,0,0,0.8)' }}
              animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Image src={coverSrc} alt={song.title} fill className="object-cover" sizes="400px" onError={() => {}} />
              {gradient && <div className="absolute inset-0" style={{ background: gradientStyle(gradient), opacity: 0.3 }} />}
            </motion.div>

            {/* Song info */}
            <div className="text-center">
              <motion.h1 key={song.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl font-medium text-white mb-1">{song.title}</motion.h1>
              <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>{song.artist}</p>
              {song.emotionalTag && (
                <span className="inline-block mt-3 text-[11px] uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: gradient ? `rgba(${gradient.glowRgb},0.2)` : 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: `1px solid ${gradient ? `rgba(${gradient.glowRgb},0.3)` : 'rgba(255,255,255,0.1)'}` }}>
                  {song.emotionalTag}
                </span>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 px-8 pb-12 space-y-6">
            {/* Waveform */}
            <div className="flex justify-center h-8 items-end gap-1">
              {isPlaying ? [1,2,3,4,5,6,7].map(i => <span key={i} className="wave-bar" style={{ height: '14px', width: '3px' }} />) : null}
            </div>

            {/* Progress */}
            <div>
              <div className="relative h-1.5 rounded-full overflow-hidden cursor-pointer mb-2"
                style={{ background: 'rgba(255,255,255,0.12)' }} onClick={handleBar}>
                <div className="h-full rounded-full liquid-bar" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span>{fmt(elapsed)}</span><span>-{fmt(remaining)}</span>
              </div>
            </div>

            {/* Controls */}
            <Controls isPlaying={isPlaying} onToggle={togglePlay} onPrev={skipPrev} onNext={skipNext} size="lg" />

            {/* Volume */}
            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)' }} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── MODAL (mid-screen) MODE ────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {song && (
        <>
          <motion.div key="bd" className="fixed inset-0 z-[100] modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }} onClick={minimize}
          />
          <motion.div key="modal" className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-3xl"
              initial={{ scale: 0.88, y: 50, filter: 'blur(20px)', opacity: 0 }}
              animate={{ scale: 1, y: 0, filter: 'blur(0px)', opacity: 1 }}
              exit={{ scale: 0.88, y: 50, filter: 'blur(20px)', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Blurred cover bg */}
              <div className="absolute inset-0 -z-10">
                <Image src={coverSrc} alt="" fill className="object-cover scale-125 blur-2xl" sizes="400px" onError={() => {}} />
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
                {gradient && <div className="absolute inset-0" style={{ background: `rgba(${gradient.glowRgb},0.15)` }} />}
              </div>

              <div className="relative p-6" style={{ backdropFilter: 'blur(40px)' }}>
                {/* Top actions */}
                <div className="flex items-center justify-between mb-5">
                  <motion.button onClick={minimize} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
                    title="Minimise (Esc)">
                    <Minimize2 size={14} />
                  </motion.button>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Now Playing
                  </span>
                  <div className="flex gap-1">
                    <motion.button onClick={toggleFullscreen} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
                      title="Full screen">
                      <Maximize2 size={14} />
                    </motion.button>
                    <motion.button onClick={closePlayer} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                      <X size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Album art */}
                <div className="flex justify-center mb-5">
                  <motion.div className="relative w-48 h-48 rounded-2xl overflow-hidden"
                    style={{ boxShadow: gradient ? `0 20px 60px rgba(${gradient.glowRgb},0.6), 0 0 0 1px rgba(255,255,255,0.08)` : '0 20px 60px rgba(0,0,0,0.7)' }}
                    animate={isPlaying ? { scale: [1, 1.025, 1] } : {}}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                    <Image src={coverSrc} alt={song.title} fill className="object-cover" sizes="192px" onError={() => {}} />
                    {gradient && <div className="absolute inset-0 -z-10" style={{ background: gradientStyle(gradient) }} />}
                  </motion.div>
                </div>

                {/* Waveform */}
                <div className="flex justify-center mb-4 h-8 items-end gap-1">
                  {isPlaying
                    ? [1,2,3,4,5].map(i => <span key={i} className="wave-bar" style={{ height: '12px' }} />)
                    : <div className="h-px w-20" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  }
                </div>

                {/* Info */}
                <div className="text-center mb-5">
                  <motion.h2 key={song.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="font-display text-xl font-medium text-white">
                    {song.title}
                  </motion.h2>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{song.artist}</p>
                  {song.emotionalTag && (
                    <span className="inline-block mt-2 text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {song.emotionalTag}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="relative h-1.5 rounded-full overflow-hidden cursor-pointer mb-1.5"
                    style={{ background: 'rgba(255,255,255,0.12)' }} onClick={handleBar}>
                    <div className="h-full rounded-full liquid-bar" style={{ width: `${progress * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span>{fmt(elapsed)}</span><span>-{fmt(remaining)}</span>
                  </div>
                </div>

                <Controls isPlaying={isPlaying} onToggle={togglePlay} onPrev={skipPrev} onNext={skipNext} />

                {/* Volume */}
                <div className="flex items-center gap-3 mt-5">
                  <Volume2 size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input type="range" min={0} max={1} step={0.01} value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                    className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }} />
                </div>
                <p className="text-center mt-4 text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Esc to minimise · Space play · ← → skip
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
