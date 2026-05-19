'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { usePlayer } from '@/components/providers/PlayerProvider'
import { Maximize2, X, SkipForward, Shuffle } from 'lucide-react'
import AddToCollectionButton from '@/components/social/AddToCollectionButton'

export default function MiniPlayer() {
  const { state, maximize, closePlayer, togglePlay, skipNext, toggleShuffle, shuffle } = usePlayer()
  const { currentSong, isPlaying, progress, minimized } = state

  return (
    <AnimatePresence>
      {currentSong && minimized && (
        <motion.div
          key="mini"
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-6 z-[200] flex items-center gap-3 pr-3 pl-1.5 py-1.5 rounded-2xl cursor-pointer"
          style={{
            background: 'var(--surface)',
            backdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--card-shadow-hover)',
            minWidth: '240px',
            maxWidth: '320px',
          }}
        >
          {/* Progress line at bottom of pill */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden"
            style={{ background: 'var(--border)' }}>
            <div className="h-full liquid-bar transition-none rounded-b-2xl"
              style={{ width: `${progress * 100}%` }} />
          </div>

          {/* Thumbnail */}
          <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            <Image
              src={currentSong.coverUrl || `https://img.youtube.com/vi/${currentSong.youtubeId}/mqdefault.jpg`}
              alt={currentSong.title} fill className="object-cover"
              onError={() => {}}
            />
            <div className="absolute inset-0 -z-10" style={{ background: 'var(--aurora1)' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={maximize}>
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {currentSong.title}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              {currentSong.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <motion.button
              onClick={e => { e.stopPropagation(); togglePlay() }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
            >
              {isPlaying ? (
                <span className="flex gap-0.5">
                  <span className="w-0.5 h-3 rounded-full bg-white" />
                  <span className="w-0.5 h-3 rounded-full bg-white" />
                </span>
              ) : (
                <span style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid white', marginLeft: '1px' }} />
              )}
            </motion.button>

            {/* Skip */}
            <motion.button onClick={e => { e.stopPropagation(); skipNext() }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} style={{ color: 'var(--text-muted)' }}>
              <SkipForward size={14} strokeWidth={2} />
            </motion.button>

            {/* Shuffle */}
            <motion.button onClick={e => { e.stopPropagation(); toggleShuffle() }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} title={shuffle ? 'Shuffle on' : 'Shuffle off'}
              style={{ color: shuffle ? 'var(--accent)' : 'rgba(255,255,255,0.35)' }}>
              <Shuffle size={12} strokeWidth={2} />
            </motion.button>

            {/* Add to collection */}
            <div onClick={e => e.stopPropagation()}>
              <AddToCollectionButton songId={currentSong.id} variant="icon" />
            </div>

            {/* Maximize */}
            <motion.button onClick={e => { e.stopPropagation(); maximize() }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} style={{ color: 'var(--text-muted)' }}>
              <Maximize2 size={13} strokeWidth={2} />
            </motion.button>

            {/* Close */}
            <motion.button onClick={e => { e.stopPropagation(); closePlayer() }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} style={{ color: 'var(--text-muted)' }}>
              <X size={13} strokeWidth={2} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
