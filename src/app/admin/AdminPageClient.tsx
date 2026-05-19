'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Play, Search, Plus, Check, X, Loader2, Music, Download, Upload, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { addSong, addArticle, getSongs, getArticles, deleteSong, deleteArticle, updateSong, exportData, importData, ensureSeeded } from '@/lib/clientData'
import { Song, Article } from '@/lib/types'
import Image from 'next/image'

type Tab = 'song' | 'article' | 'manage'
interface YTResult { id: string; title: string; channel: string; thumbnail: string }

// MM:SS ↔ seconds converter
function secsToMMSS(secs: string | number): string {
  const n = parseFloat(String(secs)) || 0
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`
}
function mmssToSecs(mmss: string): string {
  const parts = mmss.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0]) || 0
    const s = parseInt(parts[1]) || 0
    return String(m * 60 + s)
  }
  return String(parseFloat(mmss) || 0)
}

function TimeInput({ label, valueSecs, onChange }: { label: string; valueSecs: string; onChange: (secs: string) => void }) {
  const [display, setDisplay] = useState(() => secsToMMSS(valueSecs))
  useEffect(() => { setDisplay(secsToMMSS(valueSecs)) }, [valueSecs])
  return (
    <div>
      <label className="block text-[10px] font-medium mb-1.5 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {label} <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>mm:ss</span>
      </label>
      <input type="text" value={display} placeholder="0:00"
        onChange={e => setDisplay(e.target.value)}
        onBlur={e => {
          const secs = mmssToSecs(e.target.value)
          onChange(secs)
          setDisplay(secsToMMSS(secs))
        }}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none font-mono"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
    </div>
  )
}

function SongForm() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<YTResult[]>([])
  const [selected, setSelected] = useState<YTResult | null>(null)
  const [albumArt, setAlbumArt] = useState('')
  const [fetchingArt, setFetchingArt] = useState(false)
  const [form, setForm] = useState({
    artist: '', emotionalTag: '', clipStart: '0', clipEnd: '30',
    collections: '', cardSize: 'md' as 'xs' | 'sm' | 'md' | 'lg', customCover: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true); setResults([])
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`)
      setResults(await res.json())
    } finally { setSearching(false) }
  }

  // Fetch iTunes album art when song is selected
  const fetchAlbumArt = async (artist: string, title: string) => {
    setFetchingArt(true); setAlbumArt('')
    try {
      // Clean up title (remove "(Lyrical Video)" etc.)
      const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim()
      const cleanArtist = artist.replace(/\(.*?\)/g, '').trim()
      const q = encodeURIComponent(`${cleanArtist} ${cleanTitle}`)
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`)
      const data = await res.json()
      const art = data.results?.[0]?.artworkUrl100
      if (art) setAlbumArt(art.replace('100x100', '600x600'))
    } catch {}
    finally { setFetchingArt(false) }
  }

  const handleSelect = (r: YTResult) => {
    setSelected(r)
    setForm(p => ({ ...p, artist: r.channel }))
    fetchAlbumArt(r.channel, r.title)
  }

  const handleSave = () => {
    if (!selected) return alert('Select a song first.')
    setSaving(true)
    const coverUrl = form.customCover || albumArt
    addSong({
      id: uuidv4(), title: selected.title, artist: form.artist || selected.channel,
      emotionalTag: form.emotionalTag, coverUrl, youtubeId: selected.id,
      clipStart: parseFloat(form.clipStart) || 0, clipEnd: parseFloat(form.clipEnd) || 30,
      collections: form.collections.split(',').map(s => s.trim()).filter(Boolean),
      addedAt: new Date().toISOString(), cardSize: form.cardSize,
    })
    setSuccess(true); setSelected(null); setQuery(''); setResults([]); setAlbumArt('')
    setForm({ artist: '', emotionalTag: '', clipStart: '0', clipEnd: '30', collections: '', cardSize: 'md', customCover: '' })
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const clipDur = Math.max(0, parseFloat(form.clipEnd||'0') - parseFloat(form.clipStart||'0'))

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-[10px] font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Search YouTube</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Arijit Singh, Raatan Lambiyan..."
              onKeyDown={e => e.key === 'Enter' && search()}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <motion.button onClick={search} disabled={!query || searching} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{ background: 'var(--accent)', color: 'white', opacity: !query || searching ? 0.6 : 1 }}>
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Search
          </motion.button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Select a song</p>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {results.map(r => (
                <motion.button key={r.id} onClick={() => handleSelect(r)} whileHover={{ scale: 1.01 }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left"
                  style={{ background: selected?.id === r.id ? 'var(--accent-glow)' : 'var(--surface)', border: `1px solid ${selected?.id === r.id ? 'var(--accent)' : 'var(--border)'}` }}>
                  <div className="relative w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={r.thumbnail} alt="" fill className="object-cover" onError={() => {}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{r.channel}</p>
                  </div>
                  {selected?.id === r.id && <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected — album art + preview */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Album art preview */}
            <div className="flex gap-4 items-start p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: 'var(--surface-hover)' }}>
                {fetchingArt && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>}
                {(albumArt || form.customCover) && (
                  <Image src={form.customCover || albumArt} alt="" fill className="object-cover" onError={() => {}} />
                )}
                {!albumArt && !form.customCover && !fetchingArt && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selected.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{selected.channel}</p>
                {albumArt && <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>✓ Album art fetched from iTunes</p>}
              </div>
              <motion.button onClick={() => { setSelected(null); setAlbumArt('') }} whileHover={{ scale: 1.1 }}>
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </motion.button>
            </div>

            {/* YouTube Preview */}
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Preview clip</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <iframe
                  key={`${selected.id}-${form.clipStart}`}
                  src={`https://www.youtube.com/embed/${selected.id}?start=${Math.floor(parseFloat(form.clipStart)||0)}&autoplay=0&controls=1&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="w-full" height="180" style={{ border: 'none' }}
                />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Preview starts from your Start timestamp. Clip: {clipDur.toFixed(0)}s
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <FF label="Artist / Override" value={form.artist} onChange={v => setForm(p => ({ ...p, artist: v }))} placeholder={selected.channel} />
              <FF label="Emotional Tag" value={form.emotionalTag} onChange={v => setForm(p => ({ ...p, emotionalTag: v }))} placeholder="feels like 2am rain" />
              <FF label="Custom Cover URL (optional, overrides iTunes art)" value={form.customCover}
                onChange={v => setForm(p => ({ ...p, customCover: v }))} placeholder="https://..." />
              <div className="grid grid-cols-2 gap-3">
                <TimeInput label="Clip Start" valueSecs={form.clipStart} onChange={v => setForm(p => ({ ...p, clipStart: v }))} />
                <TimeInput label="Clip End" valueSecs={form.clipEnd} onChange={v => setForm(p => ({ ...p, clipEnd: v }))} />
              </div>
              <FF label="Collections (comma separated)" value={form.collections}
                onChange={v => setForm(p => ({ ...p, collections: v }))} placeholder="late nights, rain, arijit" />
              <div>
                <label className="block text-[10px] font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Card Size</label>
                <div className="flex gap-2">
                  {(['xs','sm','md','lg'] as const).map(s => (
                    <button key={s} onClick={() => setForm(p => ({ ...p, cardSize: s }))}
                      className="flex-1 py-2 rounded-xl text-xs font-medium"
                      style={form.cardSize === s ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>XS = compact 6-per-row card</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SaveBtn saving={saving} success={success} onClick={handleSave} disabled={!selected} />
    </div>
  )
}

function ArticleForm() {
  const [url, setUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', publication: '', readingTime: '5', tags: '', collections: '', imageUrl: '' })
  const [saving, setSaving] = useState(false); const [success, setSuccess] = useState(false)

  const fetchMeta = async () => {
    if (!url) return; setFetching(true)
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
      const d = await res.json()
      setForm(p => ({ ...p, title: d.title||'', description: d.description||'', publication: d.siteName||'', readingTime: String(d.readingTime||5), imageUrl: d.image||'' }))
    } finally { setFetching(false) }
  }

  const handleSave = () => {
    if (!form.title || !url) return alert('URL and Title required.')
    setSaving(true)
    addArticle({ id: uuidv4(), url, title: form.title, description: form.description, imageUrl: form.imageUrl, publication: form.publication, readingTime: parseInt(form.readingTime)||5, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean), collections: form.collections.split(',').map(c=>c.trim().toLowerCase()).filter(Boolean), addedAt: new Date().toISOString() })
    setSuccess(true); setUrl(''); setForm({ title:'', description:'', publication:'', readingTime:'5', tags:'', collections:'', imageUrl:'' })
    setSaving(false); setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL — Substack, Paul Graham, any article..."
          onKeyDown={e => e.key === 'Enter' && fetchMeta()}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        <motion.button onClick={fetchMeta} disabled={!url||fetching} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
          style={{ background: 'var(--accent)', color: 'white', opacity: !url||fetching ? 0.6 : 1 }}>
          {fetching ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Fetch
        </motion.button>
      </div>

      {/* Thumbnail preview */}
      {form.imageUrl && (
        <div className="relative h-28 rounded-xl overflow-hidden">
          <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
          {form.publication && <span className="absolute bottom-2 left-3 text-[10px] text-white font-medium">{form.publication}</span>}
        </div>
      )}
      <FF label="Title *" value={form.title} onChange={v => setForm(p=>({...p,title:v}))} placeholder="How to Do Great Work" />
      <FF label="Description" value={form.description} onChange={v => setForm(p=>({...p,description:v}))} placeholder="Summary..." />
      <FF label="Cover Image URL" value={form.imageUrl} onChange={v => setForm(p=>({...p,imageUrl:v}))} placeholder="https://..." />
      <div className="grid grid-cols-2 gap-3">
        <FF label="Publication" value={form.publication} onChange={v => setForm(p=>({...p,publication:v}))} placeholder="Substack" />
        <FF label="Read time (min)" value={form.readingTime} onChange={v => setForm(p=>({...p,readingTime:v}))} placeholder="8" type="number" />
      </div>
      <FF label="Tags" value={form.tags} onChange={v => setForm(p=>({...p,tags:v}))} placeholder="philosophy, life" />
      <FF label="Playlists" value={form.collections} onChange={v => setForm(p=>({...p,collections:v}))} placeholder="sunday reads, 2am" />
      <SaveBtn saving={saving} success={success} onClick={handleSave} />
    </div>
  )
}

function FF({ label, value, onChange, placeholder, type='text' }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string }) {
  return (
    <div>
      <label className="block text-[10px] font-medium mb-1.5 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
    </div>
  )
}

function SaveBtn({ saving, success, onClick, disabled=false }: { saving:boolean; success:boolean; onClick:()=>void; disabled?:boolean }) {
  return (
    <motion.button onClick={onClick} disabled={saving||disabled} whileHover={{ scale: saving||disabled?1:1.02 }} whileTap={{ scale: 0.97 }}
      className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
      style={{ background: success ? '#22c55e' : 'var(--accent)', color: 'white', opacity: disabled?0.5:1, boxShadow: '0 6px 24px var(--accent-glow)', transition: 'background 0.3s' }}>
      <AnimatePresence mode="wait">
        {saving ? <motion.span key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Loader2 size={15} className="animate-spin"/>Saving...</motion.span>
        : success ? <motion.span key="ok" initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="flex items-center gap-2"><Check size={15}/>Saved!</motion.span>
        : <motion.span key="add" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Plus size={15}/>Save to Universe</motion.span>}
      </AnimatePresence>
    </motion.button>
  )
}

function ManageTab() {
  const [songs, setSongs] = useState<Song[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [confirm, setConfirm] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'songs' | 'articles'>('songs')

  const reload = useCallback(() => {
    setSongs(getSongs())
    setArticles(getArticles())
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleDeleteSong = (id: string) => {
    if (confirm === id) {
      deleteSong(id)
      setConfirm(null)
      reload()
    } else {
      setConfirm(id)
      setTimeout(() => setConfirm(c => c === id ? null : c), 3000)
    }
  }

  const handleDeleteArticle = (id: string) => {
    if (confirm === id) {
      deleteArticle(id)
      setConfirm(null)
      reload()
    } else {
      setConfirm(id)
      setTimeout(() => setConfirm(c => c === id ? null : c), 3000)
    }
  }

  const handleRemoveFromCollection = (songId: string, collection: string) => {
    const song = songs.find(s => s.id === songId)
    if (!song) return
    updateSong(songId, { collections: song.collections.filter(c => c !== collection) })
    reload()
  }

  return (
    <div className="space-y-4">
      {/* Section switcher */}
      <div className="flex gap-2 mb-4">
        {(['songs', 'articles'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className="px-4 py-1.5 rounded-xl text-xs font-medium capitalize"
            style={activeSection === s
              ? { background: 'var(--accent)', color: 'white' }
              : { background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {s} ({s === 'songs' ? songs.length : articles.length})
          </button>
        ))}
      </div>

      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Tap delete once to confirm, tap again to remove permanently.
      </p>

      {/* Songs list */}
      {activeSection === 'songs' && (
        <div className="space-y-2">
          {songs.length === 0 && <p className="text-sm italic py-4 text-center" style={{ color: 'var(--text-muted)' }}>No songs saved</p>}
          {songs.map(song => (
            <motion.div key={song.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(135deg, #2d1b69, #11998e)` }}>
                {song.coverUrl && <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{song.title}</p>
                <p className="text-[10px] truncate mb-1" style={{ color: 'var(--text-muted)' }}>{song.artist}</p>
                {/* Collection tags with X to remove */}
                {song.collections.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {song.collections.map(col => (
                      <span key={col} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                        style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-strong)' }}>
                        {col}
                        <button onClick={() => handleRemoveFromCollection(song.id, col)}
                          className="hover:opacity-60 transition-opacity">
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <motion.button
                onClick={() => handleDeleteSong(song.id)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0"
                style={confirm === song.id
                  ? { background: '#ef4444', color: 'white' }
                  : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                <Trash2 size={11} />
                {confirm === song.id ? 'Confirm?' : 'Delete'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Articles list */}
      {activeSection === 'articles' && (
        <div className="space-y-2">
          {articles.length === 0 && <p className="text-sm italic py-4 text-center" style={{ color: 'var(--text-muted)' }}>No articles saved</p>}
          {articles.map(article => (
            <motion.div key={article.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{article.title}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{article.publication}</p>
              </div>
              <motion.button
                onClick={() => handleDeleteArticle(article.id)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0"
                style={confirm === article.id
                  ? { background: '#ef4444', color: 'white' }
                  : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                <Trash2 size={11} />
                {confirm === article.id ? 'Confirm?' : 'Delete'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPageClient() {
  const [tab, setTab] = useState<Tab>('song')
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { ensureSeeded() }, [])

  const handleExport = () => {
    const blob = new Blob([exportData()], { type:'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `avi-universe-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
  }
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => { try { importData(ev.target?.result as string); alert('Imported! Refresh the page.') } catch { alert('Invalid file.') } }; r.readAsText(f)
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Admin</h1>
          <p style={{ color: 'var(--text-muted)' }}>Add memories to your universe</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="inline-flex p-1 rounded-xl mb-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {[
            { key:'song', icon:<Music size={14}/>, label:'Add Song' },
            { key:'article', icon:<BookOpen size={14}/>, label:'Add Article' },
            { key:'manage', icon:<Trash2 size={14}/>, label:'Manage' },
          ].map(t => (
            <motion.button key={t.key} onClick={() => setTab(t.key as Tab)} whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: tab===t.key ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {tab===t.key && <motion.div layoutId="admin-tab" className="absolute inset-0 rounded-lg" style={{ background:'var(--accent-glow)' }} transition={{ type:'spring', stiffness:400, damping:35 }} />}
              <span className="relative z-10 flex items-center gap-2">{t.icon}{t.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="glass-card p-8">
          <AnimatePresence mode="wait">
            {tab==='song' ? (
              <motion.div key="song" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}}><SongForm /></motion.div>
            ) : tab==='article' ? (
              <motion.div key="article" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}}><ArticleForm /></motion.div>
            ) : (
              <motion.div key="manage" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}}><ManageTab /></motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
          className="mt-6 p-4 rounded-2xl" style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color:'var(--text-muted)' }}>Data Backup (Netlify)</p>
          <div className="flex gap-2">
            <motion.button onClick={handleExport} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium"
              style={{ background:'var(--surface-hover)', border:'1px solid var(--border)', color:'var(--text-primary)' }}>
              <Download size={13}/> Export backup
            </motion.button>
            <motion.button onClick={() => fileRef.current?.click()} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium"
              style={{ background:'var(--surface-hover)', border:'1px solid var(--border)', color:'var(--text-primary)' }}>
              <Upload size={13}/> Import backup
            </motion.button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden"/>
          </div>
          <p className="text-[10px] mt-2" style={{ color:'var(--text-muted)' }}>
            Your data lives in this browser. Export before switching devices.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

