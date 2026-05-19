'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Song, Article, MusicCollection, ArticleCollection } from '@/lib/types'
import SongCard from '@/components/music/SongCard'
import ArticleCard from '@/components/articles/ArticleCard'
import ReadingModal from '@/components/articles/ReadingModal'
import { usePlayer } from '@/components/providers/PlayerProvider'
import {
  getSongs, getArticles, getMusicCollections, getArticleCollections,
  ensureSeeded, addMusicCollection
} from '@/lib/clientData'
import { Music, BookOpen, Play, Shuffle, GripVertical } from 'lucide-react'
import { getSongGradient } from '@/lib/songGradients'

export default function CollectionsPageClient() {
  const [songs, setSongs] = useState<Song[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [musicCols, setMusicCols] = useState<MusicCollection[]>([])
  const [articleCols, setArticleCols] = useState<ArticleCollection[]>([])
  const [tab, setTab] = useState<'music' | 'articles'>('music')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  // Track reordered song lists per collection
  const [colOrders, setColOrders] = useState<Record<string, Song[]>>({})
  const { playSongList, state } = usePlayer()

  useEffect(() => {
    ensureSeeded().then(() => {
      const s = getSongs(); const a = getArticles()
      const mc = getMusicCollections(); const ac = getArticleCollections()
      setSongs(s); setArticles(a); setMusicCols(mc); setArticleCols(ac)
    })
  }, [])

  const getSongsForCol = (col: MusicCollection) => {
    return colOrders[col.id] ?? songs.filter(s => col.songIds.includes(s.id))
  }
  const getArticlesForCol = (col: ArticleCollection) => articles.filter(a => col.articleIds.includes(a.id))

  const handleReorder = (colId: string, newList: Song[]) => {
    setColOrders(prev => ({ ...prev, [colId]: newList }))
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-5xl sm:text-6xl font-medium text-gradient mb-3">Collections</h1>
          <p style={{ color: 'var(--text-muted)' }}>Moods, moments, and memories organised</p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="inline-flex p-1 rounded-xl mb-12"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {[
            { key: 'music', icon: <Music size={14} />, label: 'Music' },
            { key: 'articles', icon: <BookOpen size={14} />, label: 'Articles' },
          ].map(t => (
            <motion.button key={t.key} onClick={() => setTab(t.key as 'music' | 'articles')} whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium"
              style={{ color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {tab === t.key && (
                <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg"
                  style={{ background: 'var(--accent-glow)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
              )}
              <span className="relative z-10 flex items-center gap-2">{t.icon} {t.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── MUSIC COLLECTIONS ── */}
          {tab === 'music' && (
            <motion.div key="music" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-20">
              {musicCols.length === 0 && (
                <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
                  <div className="text-5xl mb-4">🎵</div>
                  <p className="font-display italic text-xl">No collections yet — create one in Admin</p>
                </div>
              )}
              {musicCols.map((col, ci) => {
                const colSongs = getSongsForCol(col)
                const gradient = colSongs[0] ? getSongGradient(colSongs[0].id) : null
                return (
                  <div key={col.id}>
                    {/* Collection header */}
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ci * 0.1 }}
                      className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{col.emoji}</span>
                        <div>
                          <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>{col.name}</h2>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{col.description} · {colSongs.length} songs</p>
                        </div>
                      </div>

                      {/* Play buttons */}
                      {colSongs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() => playSongList(colSongs, false)}
                            whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                            style={{
                              background: gradient ? `rgba(${gradient.glowRgb}, 0.2)` : 'var(--accent-glow)',
                              border: `1px solid ${gradient ? `rgba(${gradient.glowRgb}, 0.4)` : 'var(--border-strong)'}`,
                              color: gradient ? `rgb(${gradient.glowRgb})` : 'var(--accent)',
                              boxShadow: gradient ? `0 4px 20px rgba(${gradient.glowRgb}, 0.25)` : undefined,
                            }}>
                            <Play size={13} fill="currentColor" /> Play in order
                          </motion.button>
                          <motion.button
                            onClick={() => playSongList(colSongs, true)}
                            whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            <Shuffle size={13} /> Shuffle
                          </motion.button>
                        </div>
                      )}
                    </motion.div>

                    {/* Drag-to-reorder list */}
                    {colSongs.length === 0
                      ? <p className="text-sm italic py-8 pl-2" style={{ color: 'var(--text-muted)' }}>No songs assigned yet.</p>
                      : (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest mb-3 pl-2" style={{ color: 'var(--text-muted)' }}>
                            Drag to reorder
                          </p>
                          <Reorder.Group
                            axis="y"
                            values={colSongs}
                            onReorder={(newList) => handleReorder(col.id, newList)}
                            className="space-y-2"
                          >
                            {colSongs.map((song, i) => {
                              const g = getSongGradient(song.id)
                              const isPlaying = state.currentSong?.id === song.id
                              return (
                                <Reorder.Item
                                  key={song.id}
                                  value={song}
                                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer group"
                                  style={{
                                    background: isPlaying ? `rgba(${g.glowRgb}, 0.12)` : 'var(--surface)',
                                    border: `1px solid ${isPlaying ? `rgba(${g.glowRgb}, 0.4)` : 'var(--border)'}`,
                                    backdropFilter: 'blur(12px)',
                                  }}
                                  whileDrag={{ scale: 1.02, boxShadow: `0 8px 32px rgba(${g.glowRgb}, 0.35)` }}
                                  onClick={() => playSongList(colSongs.slice(i), false)}
                                >
                                  {/* Drag handle */}
                                  <div className="text-muted opacity-30 group-hover:opacity-70 cursor-grab active:cursor-grabbing flex-shrink-0"
                                    style={{ color: 'var(--text-muted)', touchAction: 'none' }}>
                                    <GripVertical size={14} />
                                  </div>

                                  {/* Index */}
                                  <span className="text-[11px] w-5 text-right flex-shrink-0 font-mono"
                                    style={{ color: isPlaying ? `rgb(${g.glowRgb})` : 'var(--text-muted)' }}>
                                    {isPlaying ? (
                                      <span className="flex gap-0.5 items-end justify-end">
                                        {[1,2,3].map(j => <span key={j} className="wave-bar" style={{ height: '8px', width: '2px' }} />)}
                                      </span>
                                    ) : i + 1}
                                  </span>

                                  {/* Mini gradient */}
                                  <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})`, boxShadow: `0 2px 10px rgba(${g.glowRgb}, 0.3)` }} />

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate"
                                      style={{ color: isPlaying ? `rgb(${g.glowRgb})` : 'var(--text-primary)' }}>
                                      {song.title}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{song.artist}</p>
                                  </div>

                                  {/* Duration */}
                                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                    {Math.round(song.clipEnd - song.clipStart)}s
                                  </span>
                                </Reorder.Item>
                              )
                            })}
                          </Reorder.Group>
                        </div>
                      )
                    }
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* ── ARTICLE COLLECTIONS ── */}
          {tab === 'articles' && (
            <motion.div key="articles" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-16">
              {articleCols.length === 0 && (
                <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
                  <div className="text-5xl mb-4">📖</div>
                  <p className="font-display italic text-xl">No article collections yet</p>
                </div>
              )}
              {articleCols.map((col, ci) => {
                const colArts = getArticlesForCol(col)
                return (
                  <div key={col.id}>
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ci * 0.1 }}
                      className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">{col.emoji}</span>
                      <div>
                        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>{col.name}</h2>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{col.description} · {colArts.length} articles</p>
                      </div>
                    </motion.div>
                    {colArts.length === 0
                      ? <p className="text-sm italic py-8" style={{ color: 'var(--text-muted)' }}>No articles yet.</p>
                      : <div className="article-grid">{colArts.map((a, i) => <ArticleCard key={a.id} article={a} index={i} featured={i===0} onClick={() => setSelectedArticle(a)} />)}</div>
                    }
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ReadingModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  )
}
