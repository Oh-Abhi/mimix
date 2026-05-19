'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { getMySongs, getUserCollections, addDbSong, createCollection } from '@/lib/db'
import { DbSong, DbCollection, dbSongToSong } from '@/lib/types'
import { usePlayer } from '@/components/providers/PlayerProvider'
import SongCard from '@/components/music/SongCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Music2, Layers, Play, Share2, Loader2, Search, ExternalLink, AlertTriangle } from 'lucide-react'

type Tab = 'songs' | 'collections'
interface YTResult { id: string; title: string; channel: string; thumbnail: string }

function AddSongModal({ userId, onAdded, onClose }: { userId: string; onAdded: (song: DbSong) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YTResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<YTResult | null>(null)
  const [artist, setArtist] = useState('')
  const [emotionalTag, setEmotionalTag] = useState('')
  const [clipStart, setClipStart] = useState('0:00')
  const [clipEnd, setClipEnd] = useState('0:30')
  const [saving, setSaving] = useState(false)
  const [albumArt, setAlbumArt] = useState('')
  const [previewKey, setPreviewKey] = useState(0) // force iframe reload on preview

  const toSecs = (mmss: string) => {
    const p = mmss.split(':')
    return p.length === 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : parseFloat(mmss) || 0
  }

  const fetchAlbumArt = async (artist: string, title: string) => {
    try {
      const q = encodeURIComponent(`${artist} ${title.replace(/\(.*?\)/g,'').trim()}`)
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`)
      const data = await res.json()
      const art = data.results?.[0]?.artworkUrl100
      if (art) setAlbumArt(art.replace('100x100', '600x600'))
    } catch {}
  }

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`)
      setResults(await res.json())
    } finally { setSearching(false) }
  }

  const handleSelect = (r: YTResult) => {
    setSelected(r); setArtist(r.channel)
    fetchAlbumArt(r.channel, r.title)
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const newSong = await addDbSong({
        user_id: userId, title: selected.title,
        artist: artist || selected.channel, youtube_id: selected.id,
        clip_start: toSecs(clipStart), clip_end: toSecs(clipEnd),
        cover_url: albumArt || selected.thumbnail,
        emotional_tag: emotionalTag, card_size: 'md',
      })
      onAdded(newSong)  // pass back for optimistic update
      onClose()
    } catch (e) {
      console.error('Failed to save song:', e)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-white font-medium text-lg mb-4">Add a Song</h3>

        <div className="flex gap-2 mb-4">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search YouTube..." className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          <button onClick={search} disabled={searching} className="px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {results.slice(0, 5).map(r => (
            <div key={r.id} onClick={() => handleSelect(r)}
              className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
              style={{ background: selected?.id === r.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selected?.id === r.id ? 'rgba(124,58,237,0.5)' : 'transparent'}` }}>
              <img src={r.thumbnail} alt="" className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{r.title}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.channel}</p>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="space-y-3">
            {/* ── CLIP PREVIEW PLAYER ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <iframe
                key={previewKey}
                src={`https://www.youtube.com/embed/${selected.id}?start=${toSecs(clipStart)}&end=${toSecs(clipEnd)}&autoplay=${previewKey > 0 ? 1 : 0}&rel=0&modestbranding=1`}
                className="w-full"
                style={{ height: 180 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Preview: {clipStart} → {clipEnd} ({Math.max(0, toSecs(clipEnd) - toSecs(clipStart))}s)
                </span>
                <button onClick={() => setPreviewKey(k => k + 1)}
                  className="text-[11px] px-3 py-1 rounded-lg font-medium flex items-center gap-1.5"
                  style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }}>
                  ▶ Play Clip
                </button>
              </div>
            </div>

            {/* Album art indicator */}
            {albumArt && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <img src={albumArt} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-[11px]" style={{ color: '#86efac' }}>iTunes album art found ✓</span>
              </div>
            )}

            <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            <input value={emotionalTag} onChange={e => setEmotionalTag(e.target.value)} placeholder="Mood tag (e.g. 2am drives)"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />

            {/* Clip time inputs */}
            <div className="grid grid-cols-2 gap-2">
              {([['Clip Start', clipStart, setClipStart], ['Clip End', clipEnd, setClipEnd]] as [string, string, (v: string) => void][]).map(([label, val, set]) => (
                <div key={label}>
                  <label className="text-[10px] mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>{label} (mm:ss)</label>
                  <input value={val} onChange={e => set(e.target.value)}
                    onBlur={() => setPreviewKey(0)} // reset preview when times change
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none font-mono"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
              ))}
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Set the times above then click ▶ Play Clip to preview that exact section</p>

            <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              {saving && <Loader2 size={14} className="animate-spin" />} Save Song
            </motion.button>
          </div>
        )}

        <button onClick={onClose} className="mt-3 w-full py-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Cancel</button>
      </motion.div>
    </div>
  )
}

function AddCollectionModal({ userId, onAdded, onClose }: { userId: string; onAdded: (col: DbCollection) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎵')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const EMOJIS = ['🎵','🎶','🎸','🎹','🎺','🥁','🎤','🌙','☀️','🌊','🔥','💜','❤️','💫','🌸','🦋']

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const newCol = await createCollection({ user_id: userId, name, description, emoji, is_public: isPublic })
      onAdded(newCol)  // pass back for optimistic update
      onClose()
    } catch (e) {
      console.error('Failed to create collection:', e)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-white font-medium text-lg mb-4">New Collection</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Pick an emoji</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="w-9 h-9 rounded-xl text-lg transition-all"
                  style={{ background: emoji === e ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.05)', border: `1px solid ${emoji === e ? 'rgba(124,58,237,0.6)' : 'transparent'}` }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Collection name *"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm text-white">Public</span>
            <button onClick={() => setIsPublic(v => !v)}
              className="relative w-10 h-5 rounded-full transition-all"
              style={{ background: isPublic ? '#7c3aed' : 'rgba(255,255,255,0.15)' }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: isPublic ? '22px' : '2px' }} />
            </button>
          </div>
          <motion.button onClick={save} disabled={saving || !name.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', opacity: !name.trim() ? 0.5 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />} Create Collection
          </motion.button>
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Cancel</button>
      </motion.div>
    </div>
  )
}

export default function MePageClient() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { playSong, setSongs: setPlayerSongs } = usePlayer()
  const [tab, setTab] = useState<Tab>('songs')
  const [songs, setSongs] = useState<DbSong[]>([])
  const [collections, setCollections] = useState<DbCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)
  const [showAddSong, setShowAddSong] = useState(false)
  const [showAddCol, setShowAddCol] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      // Run both queries in parallel — single round trip each
      const [s, c] = await Promise.all([
        getMySongs(user.id),
        getUserCollections(user.id)
      ])
      setSongs(s)
      setCollections(c)
      setPlayerSongs(s.map(dbSongToSong))
    } catch {
      setDbError(true)
    } finally {
      setLoading(false)
    }
  }, [user, setPlayerSongs])

  // Optimistic song add — instantly updates UI, background sync
  const handleSongAdded = useCallback((newSong: DbSong) => {
    setSongs(prev => {
      const updated = [newSong, ...prev]
      setPlayerSongs(updated.map(dbSongToSong))
      return updated
    })
    setTimeout(() => load(), 1000)
  }, [load, setPlayerSongs])

  // Optimistic collection add
  const handleCollectionAdded = useCallback((newCol: DbCollection) => {
    setCollections(prev => [newCol, ...prev])
    setTimeout(() => load(), 1000)
  }, [load])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => { if (user) load() }, [load, user])

  // Still checking auth
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  // Not logged in (redirect happening)
  if (!user) return null

  // DB tables missing
  if (dbError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle size={48} style={{ color: '#f59e0b' }} />
      <h2 className="text-white font-display text-2xl">Database not set up yet</h2>
      <p className="max-w-md text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        The Mimix database tables don&apos;t exist in your Supabase project yet. You need to run the SQL schema.
      </p>
      <div className="p-4 rounded-xl text-left max-w-lg w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-xs font-mono mb-2" style={{ color: '#a78bfa' }}>How to fix:</p>
        <ol className="text-xs space-y-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <li>1. Go to <strong className="text-white">supabase.com</strong> → your project dashboard</li>
          <li>2. Click <strong className="text-white">SQL Editor</strong> in the left sidebar</li>
          <li>3. Click <strong className="text-white">New Query</strong></li>
          <li>4. Open <code className="text-purple-300">supabase/schema.sql</code> from your project folder and paste all of it</li>
          <li>5. Click <strong className="text-white">Run</strong> (the green play button)</li>
          <li>6. Refresh this page</li>
        </ol>
      </div>
      <button onClick={() => { setDbError(false); setLoading(true); load() }}
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
        Retry
      </button>
    </div>
  )

  // Profile not found even though user exists (tables exist but no profile row)
  if (!profile && !loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">👤</div>
      <h2 className="text-white font-display text-2xl">Profile not found</h2>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Your account exists but has no profile row. Please sign out and sign in again.</p>
      <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>Go to Login</Link>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  const playerSongs = songs.map(dbSongToSong)

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-medium text-gradient mb-1">{profile.display_name}&apos;s Universe</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>@{profile.username}</span>
              <Link href={`/u/${profile.username}`} className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: 'var(--accent)' }}>
                <ExternalLink size={11} /> Public profile
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button onClick={() => setShowAddCol(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Layers size={14} /> New Collection
            </motion.button>
            <motion.button onClick={() => setShowAddSong(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              <Plus size={15} /> Add Song
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Songs', val: songs.length, icon: Music2 },
            { label: 'Collections', val: collections.length, icon: Layers },
            { label: 'Total Likes', val: collections.reduce((a, c) => a + (c.like_count ?? 0), 0), icon: Play },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Icon size={16} style={{ color: 'var(--accent)', marginBottom: 8 }} />
              <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{val}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {(['songs', 'collections'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={tab === t ? { background: 'var(--accent)', color: 'white' } : { color: 'var(--text-muted)' }}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
        ) : tab === 'songs' ? (
          songs.length === 0 ? (
            <div className="text-center py-20">
              <Music2 size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="mb-4" style={{ color: 'var(--text-muted)' }}>No songs yet. Add your first one!</p>
              <motion.button onClick={() => setShowAddSong(true)} whileHover={{ scale: 1.04 }} className="px-6 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                <Plus size={14} className="inline mr-2" />Add Song
              </motion.button>
            </div>
          ) : (
            <div className="masonry-grid">
              {playerSongs.map((song, i) => (
                <SongCard key={song.id} song={song} index={i} view="grid" onClick={() => { playSong(song); setPlayerSongs(playerSongs) }} />
              ))}
            </div>
          )
        ) : (
          collections.length === 0 ? (
            <div className="text-center py-20">
              <Layers size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="mb-4" style={{ color: 'var(--text-muted)' }}>No collections yet.</p>
              <motion.button onClick={() => setShowAddCol(true)} whileHover={{ scale: 1.04 }} className="px-6 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                New Collection
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map(col => (
                <Link key={col.id} href={`/u/${profile.username}/collection/${col.id}`}>
                  <div className="p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 group"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="text-3xl mb-2">{col.emoji}</div>
                    <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{col.name}</h3>
                    {col.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{col.description}</p>}
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><Music2 size={11} />{col.song_count ?? 0} songs</span>
                      <span className="flex items-center gap-1"><Share2 size={11} />{col.is_public ? 'Public' : 'Private'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>

      {showAddSong && user && <AddSongModal userId={user.id} onAdded={handleSongAdded} onClose={() => setShowAddSong(false)} />}
      {showAddCol && user && <AddCollectionModal userId={user.id} onAdded={handleCollectionAdded} onClose={() => setShowAddCol(false)} />}
    </div>
  )
}
