'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Song } from '@/lib/types'
import { getSongGradient, gradientStyle } from '@/lib/songGradients'
import { Play, Clock } from 'lucide-react'

type CoverMode = 'gradient' | 'photo'

function useCoverMode(songId: string, hasPhoto: boolean): [CoverMode, () => void] {
  const key = `avi-cover-${songId}`
  const [mode, setMode] = useState<CoverMode>('photo')
  useEffect(() => {
    if (!hasPhoto) { setMode('gradient'); return }
    const saved = localStorage.getItem(key) as CoverMode | null
    setMode(saved ?? 'photo')
  }, [songId, hasPhoto, key])
  const toggle = () => {
    if (!hasPhoto) return
    const next: CoverMode = mode === 'photo' ? 'gradient' : 'photo'
    setMode(next)
    localStorage.setItem(key, next)
  }
  return [mode, toggle]
}

interface SongCardProps {
  song: Song
  onClick: () => void
  index: number
  view?: 'grid' | 'list'
  isPlaying?: boolean
}

const heights: Record<string, string> = { xs: '100px', sm: '160px', md: '220px', lg: '280px' }

export default function SongCard({ song, onClick, index, view = 'grid', isPlaying = false }: SongCardProps) {
  const gradient = getSongGradient(song.id)
  const glowColor = `rgba(${gradient.glowRgb}, 0.55)`
  const glowHover = `rgba(${gradient.glowRgb}, 0.75)`
  const hasCover = !!song.coverUrl
  const [coverMode, toggleCover] = useCoverMode(song.id, hasCover)
  const showPhoto = hasCover && coverMode === 'photo'
  const h = heights[song.cardSize] ?? '260px'

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.04 }}
        onClick={onClick}
        className="song-list-item group"
        style={isPlaying ? { borderColor: `rgba(${gradient.glowRgb}, 0.5)`, background: `rgba(${gradient.glowRgb}, 0.08)` } : {}}
      >
        {/* Mini gradient thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
          style={{ boxShadow: `0 4px 16px ${glowColor}` }}>
          {hasCover
            ? <Image src={song.coverUrl} alt={song.title} fill className="object-cover" sizes="48px" onError={() => {}} />
            : <div className="w-full h-full" style={{ background: gradientStyle(gradient) }} />
          }
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex gap-0.5 items-end h-4">
                {[1,2,3].map(i => <span key={i} className="wave-bar" style={{ height: '10px', width: '2px' }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: isPlaying ? `rgb(${gradient.glowRgb})` : 'var(--text-primary)' }}>
            {song.title}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{song.artist}</p>
        </div>

        {/* Emotional tag */}
        <span className="hidden sm:block text-[10px] px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: `rgba(${gradient.glowRgb}, 0.15)`, color: `rgb(${gradient.glowRgb})`, border: `1px solid rgba(${gradient.glowRgb}, 0.25)` }}>
          {song.emotionalTag}
        </span>

        {/* Duration */}
        <div className="flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          <Clock size={10} />
          <span className="text-[10px]">{Math.round(song.clipEnd - song.clipStart)}s</span>
        </div>

        {/* Play icon on hover */}
        <motion.div className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
          style={{ color: `rgb(${gradient.glowRgb})` }}>
          <Play size={15} fill="currentColor" />
        </motion.div>
      </motion.div>
    )
  }

  // ── GRID VIEW ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="masonry-item"
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        onClick={onClick}
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative rounded-2xl cursor-pointer group"
        style={{ height: h }}
      >
        {/* Dynamic Cover Glow Layer (matches photo) - shown only on hover in photo mode */}
        {showPhoto && (
          <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-500"
               style={{ transform: 'scale(1.05)' }}>
             <Image src={song.coverUrl} alt="" fill className="object-cover blur-2xl rounded-2xl" sizes="200px" />
          </div>
        )}

        {/* The Actual Card container */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl"
          style={{ boxShadow: `var(--card-shadow)` }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.boxShadow = showPhoto 
              ? `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)` 
              : `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(${gradient.glowRgb},0.4), 0 0 50px ${glowHover}`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = 'var(--card-shadow)'
          }}>
        {/* Background — gradient always, photo overlay when showPhoto */}
        <div className="absolute inset-0" style={{ background: gradientStyle(gradient) }} />
        {showPhoto && (
          <div className="absolute inset-0">
            <Image src={song.coverUrl} alt={song.title} fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 25vw"
              onError={() => {}}
            />
          </div>
        )}
        {/* On gradient mode with photo available: very subtle photo hint */}
        {hasCover && !showPhoto && (
          <div className="absolute inset-0">
            <Image src={song.coverUrl} alt={song.title} fill
              className="object-cover opacity-20 mix-blend-soft-light transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, 25vw"
              onError={() => {}}
            />
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Hover: gradient glow from song's own color */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at 50% 80%, rgba(${gradient.glowRgb}, 0.35), transparent 70%)` }}
        />

        {/* Glow border on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ boxShadow: `inset 0 0 0 1px rgba(${gradient.glowRgb}, 0.45), inset 0 0 30px rgba(${gradient.glowRgb}, 0.15)` }}
        />

        {/* Cover mode toggle — only shown when iTunes art available */}
        {hasCover && (
          <button
            onClick={e => { e.stopPropagation(); toggleCover() }}
            className="absolute top-3 left-3 flex items-center gap-1 px-1.5 py-1 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
            title={coverMode === 'photo' ? 'Switch to gradient' : 'Switch to album art'}
          >
            <span className="w-2 h-2 rounded-full transition-all"
              style={{ background: coverMode === 'photo' ? 'white' : 'rgba(255,255,255,0.35)', boxShadow: coverMode === 'photo' ? '0 0 6px white' : 'none' }} />
            <span className="w-2 h-2 rounded-full transition-all"
              style={{ background: coverMode === 'gradient' ? 'white' : 'rgba(255,255,255,0.35)', boxShadow: coverMode === 'gradient' ? '0 0 6px white' : 'none' }} />
          </button>
        )}

        {/* Duration badge */}
        <div className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {Math.round(song.clipEnd - song.clipStart)}s
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: `rgba(${gradient.glowRgb}, 0.85)`, backdropFilter: 'blur(8px)' }}>
            <div className="flex gap-0.5 items-end h-3">
              {[1,2,3].map(i => <span key={i} className="wave-bar" style={{ height: '8px', width: '2px' }} />)}
            </div>
            <span className="text-[9px] font-semibold text-white">Playing</span>
          </div>
        )}

        {/* Bottom content */}
        <div className={`absolute bottom-0 left-0 right-0 ${song.cardSize === 'xs' ? 'p-3' : 'p-4'}`}>
          {song.cardSize !== 'xs' && (
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-medium"
                style={{ background: `rgba(${gradient.glowRgb}, 0.25)`, backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.85)', border: `1px solid rgba(${gradient.glowRgb}, 0.3)` }}>
                {song.emotionalTag}
              </span>
            </div>
          )}
          <h3 className={`font-display text-white font-medium leading-tight ${song.cardSize === 'xs' ? 'text-sm' : 'text-base'}`}
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>
            {song.title}
          </h3>
          <p className={`mt-0.5 ${song.cardSize === 'xs' ? 'text-[10px]' : 'text-xs'}`} style={{ color: 'rgba(255,255,255,0.5)' }}>{song.artist}</p>
          {song.cardSize !== 'xs' && song.collections.length > 0 && (
            <div className="flex gap-1 mt-2">
              {song.collections.slice(0, 3).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: `rgb(${gradient.glowRgb})`, opacity: 0.75 }} />
              ))}
            </div>
          )}
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.div initial={{ scale: 0.8 }} whileHover={{ scale: 1 }}
            className={`${song.cardSize === 'xs' ? 'w-10 h-10' : 'w-14 h-14'} rounded-full flex items-center justify-center`}
            style={{ background: `rgba(${gradient.glowRgb}, 0.35)`, backdropFilter: 'blur(16px)', border: `1px solid rgba(${gradient.glowRgb}, 0.5)`, boxShadow: `0 0 30px rgba(${gradient.glowRgb}, 0.5)` }}>
            <Play size={song.cardSize === 'xs' ? 14 : 20} fill="white" color="white" style={{ marginLeft: '2px' }} />
          </motion.div>
        </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
