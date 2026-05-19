'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Song } from '@/lib/types'
import SongCard from '@/components/music/SongCard'
import { usePlayer } from '@/components/providers/PlayerProvider'
import { getSongs, ensureSeeded } from '@/lib/clientData'
import { Search, LayoutGrid, List, Shuffle, Play, LayoutDashboard } from 'lucide-react'

type ViewMode = 'grid' | 'list'
type Density = 'normal' | 'compact'

export default function MusicPageClient() {
  const [songs, setSongs] = useState<Song[]>([])
  const [query, setQuery] = useState('')
  const [activeCol, setActiveCol] = useState('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [density, setDensity] = useState<Density>('normal')
  const { playSong, setSongs: setPlayerSongs, playSongList, state } = usePlayer()

  useEffect(() => {
    ensureSeeded().then(() => {
      const s = getSongs()
      setSongs(s)
      setPlayerSongs(s)
    })
  }, [setPlayerSongs])

  const allCollections = Array.from(new Set(songs.flatMap(s => s.collections)))
  const filtered = songs.filter(song => {
    const mq = !query || song.title.toLowerCase().includes(query.toLowerCase())
      || song.artist.toLowerCase().includes(query.toLowerCase())
      || song.emotionalTag.toLowerCase().includes(query.toLowerCase())
    const mc = activeCol === 'all' || song.collections.includes(activeCol)
    return mq && mc
  })

  const handleShuffle = () => {
    if (filtered.length) playSongList([...filtered].sort(() => Math.random() - 0.5), true)
  }
  const handlePlayAll = () => {
    if (filtered.length) playSongList(filtered, false)
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-10">
          <h1 className="font-display text-5xl sm:text-6xl font-medium text-gradient mb-2">Music Memories</h1>
          <p style={{ color: 'var(--text-muted)' }}>Favourite moments in sound · {songs.length} clips</p>
        </motion.div>

        {/* Controls row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search songs, artists, feelings..." value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          {/* Play all */}
          <motion.button onClick={handlePlayAll} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 4px 20px var(--accent-glow)' }}>
            <Play size={14} fill="white" /> Play All
          </motion.button>

          {/* Shuffle */}
          <motion.button onClick={handleShuffle} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Shuffle size={14} /> Shuffle
          </motion.button>

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Density toggle — only in grid mode */}
            {view === 'grid' && (
              <motion.button
                onClick={() => setDensity(d => d === 'normal' ? 'compact' : 'normal')}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                className="p-2 rounded-xl"
                title={density === 'compact' ? 'Normal view (4 col)' : 'Compact view (6 col)'}
                style={density === 'compact'
                  ? { background: 'var(--accent-glow)', border: '1px solid var(--border-strong)', color: 'var(--accent)' }
                  : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <LayoutDashboard size={15} />
              </motion.button>
            )}

            {/* Grid / List toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {([['grid', LayoutGrid], ['list', List]] as const).map(([mode, Icon]) => (
                <motion.button key={mode} onClick={() => setView(mode)} whileTap={{ scale: 0.93 }}
                  className="relative p-2 rounded-lg"
                  style={{ color: view === mode ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {view === mode && (
                    <motion.div layoutId="view-tab" className="absolute inset-0 rounded-lg"
                      style={{ background: 'var(--accent-glow)' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                  )}
                  <span className="relative z-10"><Icon size={15} /></span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Collection filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2 mb-10">
          {['all', ...allCollections].map(col => (
            <motion.button key={col} onClick={() => setActiveCol(col)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
              style={activeCol === col
                ? { background: 'var(--accent)', color: 'white', boxShadow: '0 4px 14px var(--accent-glow)' }
                : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {col}
            </motion.button>
          ))}
        </motion.div>

        {/* Songs */}
        {filtered.length === 0 ? (
          <div className="text-center py-32" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">🎵</div>
            <p className="font-display italic text-xl">
              {songs.length === 0 ? 'No songs yet — add some in Admin!' : 'No songs match your search.'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'grid' ? (
              <motion.div key={`grid-${density}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={density === 'compact' ? 'masonry-compact' : 'masonry-grid'}>
                {filtered.map((song, i) => (
                  <SongCard
                    key={song.id}
                    song={density === 'compact' ? { ...song, cardSize: 'xs' as const } : song}
                    index={i}
                    view="grid"
                    isPlaying={state.currentSong?.id === song.id}
                    onClick={() => playSong(song)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-2">
                {filtered.map((song, i) => (
                  <SongCard key={song.id} song={song} index={i} view="list"
                    isPlaying={state.currentSong?.id === song.id}
                    onClick={() => { playSong(song); setPlayerSongs(filtered) }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
