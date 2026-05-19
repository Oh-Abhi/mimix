'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { getMySongs, getUserCollections, addDbSong, createCollection, addSongToCollection, removeSongFromCollection, deleteDbSong, deleteCollection, updateCollection } from '@/lib/db'
import { DbSong, DbCollection, dbSongToSong } from '@/lib/types'
import { usePlayer } from '@/components/providers/PlayerProvider'
import SongCard from '@/components/music/SongCard'
import YouTubeClipPicker from '@/components/music/YouTubeClipPicker'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Music2, Layers, Play, Share2, Loader2, Search, ExternalLink, AlertTriangle, ListMusic, Check, MoreVertical, Pencil, Trash2, Tag, X } from 'lucide-react'

type Tab = 'songs' | 'collections'
interface YTResult { id: string; title: string; channel: string; thumbnail: string }

function AddSongModal({ userId, collections, preselectedCollection, onAdded, onClose }: {
  userId: string
  collections: DbCollection[]
  preselectedCollection?: DbCollection | null
  onAdded: (song: DbSong) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YTResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<YTResult | null>(null)
  const [artist, setArtist] = useState('')
  const [emotionalTag, setEmotionalTag] = useState('')
  const [clipStart, setClipStart] = useState(0)   // seconds
  const [clipEnd, setClipEnd] = useState(30)        // seconds
  const [saving, setSaving] = useState(false)
  const [albumArt, setAlbumArt] = useState('')
  const [targetCollection, setTargetCollection] = useState<string>(preselectedCollection?.id ?? '')


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
        clip_start: clipStart, clip_end: clipEnd,
        cover_url: albumArt || selected.thumbnail,
        emotional_tag: emotionalTag, card_size: 'md',
      })
      // Also add to collection if one was chosen
      if (targetCollection) {
        await addSongToCollection(targetCollection, newSong.id)
      }
      onAdded(newSong)
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
            {/* ── VISUAL CLIP PICKER (YouTube IFrame API) ── */}
            <YouTubeClipPicker
              videoId={selected.id}
              initialStart={clipStart}
              initialEnd={clipEnd}
              onClipChange={(s, e) => { setClipStart(s); setClipEnd(e) }}
            />

            {/* Album art indicator */}
            {albumArt && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <img src={albumArt} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-[11px]" style={{ color: '#86efac' }}>iTunes album art ✓</span>
              </div>
            )}

            <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            <input value={emotionalTag} onChange={e => setEmotionalTag(e.target.value)} placeholder="Mood tag (e.g. 2am drives)"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />

            {/* Clip display */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#a78bfa' }}>▶ {Math.floor(clipStart/60)}:{String(Math.floor(clipStart%60)).padStart(2,'0')}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>{Math.round(clipEnd - clipStart)}s clip</span>
              <span style={{ color: '#f472b6' }}>⏹ {Math.floor(clipEnd/60)}:{String(Math.floor(clipEnd%60)).padStart(2,'0')}</span>
            </div>

            {/* Collection picker */}
            {collections.length > 0 && (
              <div>
                <label className="text-[10px] mb-2 block uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Add to collection <span className="normal-case font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setTargetCollection('')}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: !targetCollection ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${!targetCollection ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
                      color: !targetCollection ? 'white' : 'rgba(255,255,255,0.4)'
                    }}>
                    None
                  </button>
                  {collections.map(col => (
                    <button key={col.id} onClick={() => setTargetCollection(col.id === targetCollection ? '' : col.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        background: targetCollection === col.id ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${targetCollection === col.id ? 'rgba(124,58,237,0.6)' : 'transparent'}`,
                        color: targetCollection === col.id ? '#c4b5fd' : 'rgba(255,255,255,0.5)'
                      }}>
                      {col.emoji} {col.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {targetCollection
                ? `Save & Add to ${collections.find(c => c.id === targetCollection)?.name ?? 'Collection'}`
                : 'Save to Library'
              }
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

// ── MANAGE SONGS IN COLLECTION MODAL ─────────────────────────────────────────
function ManageSongsModal({ collection, allSongs, onClose, onChanged }: {
  collection: DbCollection
  allSongs: DbSong[]
  onClose: () => void
  onChanged: () => void
}) {
  const [collectionSongIds, setCollectionSongIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Load which songs are already in this collection
  useEffect(() => {
    const sb = (async () => {
      const { createClient } = await import('@/lib/supabase')
      const client = createClient()
      const { data } = await client
        .from('collection_songs')
        .select('song_id')
        .eq('collection_id', collection.id)
      setCollectionSongIds(new Set(data?.map((r: { song_id: string }) => r.song_id) ?? []))
      setLoading(false)
    })
    sb()
  }, [collection.id])

  const toggle = async (songId: string) => {
    setSaving(songId)
    try {
      if (collectionSongIds.has(songId)) {
        await removeSongFromCollection(collection.id, songId)
        setCollectionSongIds(prev => { const s = new Set(prev); s.delete(songId); return s })
      } else {
        await addSongToCollection(collection.id, songId)
        setCollectionSongIds(prev => new Set([...prev, songId]))
      }
      onChanged()
    } finally { setSaving(null) }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-3xl p-6 max-h-[85vh] flex flex-col"
        style={{ background: 'rgba(10,8,20,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}>

        <div className="flex items-center gap-3 mb-5">
          <div className="text-2xl">{collection.emoji}</div>
          <div>
            <h3 className="text-white font-medium">{collection.name}</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Tap a song to add or remove it</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: '#818cf8' }} /></div>
        ) : allSongs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No songs in your library yet.</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Add songs first using the "+ Add Song" button.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {allSongs.map(song => {
              const inCollection = collectionSongIds.has(song.id)
              const isSaving = saving === song.id
              return (
                <button key={song.id} onClick={() => toggle(song.id)} disabled={!!saving}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                  style={{
                    background: inCollection ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${inCollection ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    opacity: saving && saving !== song.id ? 0.5 : 1,
                  }}>
                  {song.cover_url
                    ? <img src={song.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.3)' }}><Music2 size={16} color="#a78bfa" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{song.artist}</p>
                  </div>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: inCollection ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}>
                    {isSaving
                      ? <Loader2 size={12} className="animate-spin" color="white" />
                      : inCollection
                        ? <Check size={12} color="white" />
                        : <Plus size={12} color="rgba(255,255,255,0.5)" />
                    }
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {collectionSongIds.size} song{collectionSongIds.size !== 1 ? 's' : ''} in collection
          </p>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
            Done
          </button>
        </div>
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
  const [managingCollection, setManagingCollection] = useState<DbCollection | null>(null)
  const [preselectedCollection, setPreselectedCollection] = useState<DbCollection | null>(null)
  const [editingCollection, setEditingCollection] = useState<DbCollection | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [playerSongs, setPlayerSongsLocal] = useState(songs.map(dbSongToSong))

  const openAddSong = (col?: DbCollection) => {
    setPreselectedCollection(col ?? null)
    setShowAddSong(true)
  }

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

  // Delete song
  const handleDeleteSong = useCallback(async (songId: string) => {
    setSongs(prev => {
      const updated = prev.filter(s => s.id !== songId)
      setPlayerSongs(updated.map(dbSongToSong))
      return updated
    })
    try { await deleteDbSong(songId) } catch { load() }
  }, [deleteDbSong, setPlayerSongs, load])

  // Delete collection
  const handleDeleteCollection = useCallback(async (colId: string) => {
    setCollections(prev => prev.filter(c => c.id !== colId))
    try { await deleteCollection(colId) } catch { load() }
  }, [load])

  // Update collection
  const handleUpdateCollection = useCallback(async (colId: string, updates: { name?: string; description?: string; emoji?: string; is_public?: boolean }) => {
    setCollections(prev => prev.map(c => c.id === colId ? { ...c, ...updates } : c))
    try { await updateCollection(colId, updates) } catch { load() }
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
          ) : (() => {
            // Unique tags
            const allTags = [...new Set(songs.map(s => s.emotional_tag).filter(Boolean))]
            const filtered = tagFilter ? songs.filter(s => s.emotional_tag === tagFilter) : songs
            const filteredSongs = filtered.map(dbSongToSong)
            return (
              <div>
                {/* Tag filter pills */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-5">
                    <Tag size={12} style={{ color: 'var(--text-muted)' }} />
                    <button onClick={() => setTagFilter(null)}
                      className="px-3 py-1 rounded-full text-xs transition-all"
                      style={{ background: !tagFilter ? 'var(--accent)' : 'var(--surface)', color: !tagFilter ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      All
                    </button>
                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                        className="px-3 py-1 rounded-full text-xs transition-all"
                        style={{ background: tagFilter === tag ? 'var(--accent)' : 'var(--surface)', color: tagFilter === tag ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                <div className="masonry-grid">
                  {filteredSongs.map((song, i) => (
                    <div key={song.id} className="relative group">
                      <SongCard song={song} index={i} view="grid"
                        onClick={() => { playSong(song); setPlayerSongs(filteredSongs) }} />
                      {/* Delete button — appears on hover */}
                      <button onClick={e => { e.stopPropagation(); if (confirm('Delete this song?')) handleDeleteSong(song.id) }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        style={{ background: 'rgba(239,68,68,0.8)', backdropFilter: 'blur(8px)' }}
                        title="Delete song">
                        <Trash2 size={12} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()
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
                <div key={col.id} className="p-5 rounded-2xl transition-all group relative"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

                  {/* Three-dot menu */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingCollection(col)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                      title="Edit collection" style={{ color: 'var(--text-muted)' }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${col.name}"?`)) handleDeleteCollection(col.id) }}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/20"
                      title="Delete collection" style={{ color: '#f87171' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="text-3xl mb-2">{col.emoji}</div>
                  <h3 className="font-medium mb-1 pr-16" style={{ color: 'var(--text-primary)' }}>{col.name}</h3>
                  {col.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{col.description}</p>}
                  <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Music2 size={11} />{col.song_count ?? 0} songs</span>
                    <span className="flex items-center gap-1"><Share2 size={11} />{col.is_public ? 'Public' : 'Private'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openAddSong(col)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white' }}>
                      <Plus size={12} /> Add Song
                    </button>
                    <button onClick={() => setManagingCollection(col)}
                      className="flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all hover:opacity-70"
                      title="Manage songs" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <ListMusic size={12} />
                    </button>
                    <Link href={`/u/${profile.username}/collection/${col.id}`}
                      className="flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all hover:opacity-70"
                      style={{ background: 'var(--accent-glow)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {showAddSong && user && (
        <AddSongModal
          userId={user.id}
          collections={collections}
          preselectedCollection={preselectedCollection}
          onAdded={handleSongAdded}
          onClose={() => { setShowAddSong(false); setPreselectedCollection(null) }}
        />
      )}
      {showAddCol && user && <AddCollectionModal userId={user.id} onAdded={handleCollectionAdded} onClose={() => setShowAddCol(false)} />}
      {managingCollection && (
        <ManageSongsModal
          collection={managingCollection}
          allSongs={songs}
          onClose={() => setManagingCollection(null)}
          onChanged={() => { setCollections(prev => prev.map(c => c.id === managingCollection.id ? { ...c } : c)); setTimeout(() => load(), 800) }}
        />
      )}
      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          onSave={async (updates) => { await handleUpdateCollection(editingCollection.id, updates); setEditingCollection(null) }}
          onClose={() => setEditingCollection(null)}
        />
      )}
    </div>
  )
}

// ── EDIT COLLECTION MODAL ─────────────────────────────────────────────
function EditCollectionModal({ collection, onSave, onClose }: {
  collection: DbCollection
  onSave: (updates: { name?: string; description?: string; emoji?: string; is_public?: boolean }) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? '')
  const [emoji, setEmoji] = useState(collection.emoji)
  const [isPublic, setIsPublic] = useState(collection.is_public)
  const [saving, setSaving] = useState(false)
  const EMOJIS = ['🎵','🎶','🎸','🎹','🎺','🥁','🎤','🌙','☀️','🌊','🔥','💜','❤️','💫','🌸','🦋','🎭','🎨','✨','🌈']

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try { await onSave({ name, description, emoji, is_public: isPublic }) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-white font-medium text-lg mb-4">Edit Collection</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Emoji</label>
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
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Collection name"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          <button onClick={() => setIsPublic(p => !p)}
            className="w-full py-2.5 rounded-xl text-sm flex items-center justify-between px-3"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <span>{isPublic ? '🌍 Public' : '🔒 Private'}</span>
            <div className="w-8 h-4 rounded-full relative transition-all" style={{ background: isPublic ? '#7c3aed' : 'rgba(255,255,255,0.2)' }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: isPublic ? '18px' : '2px' }} />
            </div>
          </button>
          <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
            {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
          </motion.button>
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Cancel</button>
      </motion.div>
    </div>
  )
}
