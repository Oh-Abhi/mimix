'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCollection } from '@/lib/db'
import { DbCollection, dbSongToSong } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { usePlayer } from '@/components/providers/PlayerProvider'
import SongCard from '@/components/music/SongCard'
import LikeButton from '@/components/social/LikeButton'
import CommentSection from '@/components/social/CommentSection'
import Link from 'next/link'
import { Play, Music2, ArrowLeft, Lock, Share2, Check, Shuffle, Plus } from 'lucide-react'

const THEME_STYLES = {
  midnight: { bg: '#080b24', c1: '#312e81', c2: '#1e1b4b', accent: '#818cf8' },
  blush: { bg: '#1a0a1e', c1: '#831843', c2: '#4a044e', accent: '#f472b6' },
  paper: { bg: '#f8f6f1', c1: '#e0ddd6', c2: '#d5d0c5', accent: '#6366f1' },
}

function ShareButton({ accentColor }: { accentColor: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    const title = document.title

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {/* cancelled */}
    }
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <motion.button onClick={handleShare} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
      <AnimatePresence mode="wait">
        {copied
          ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Check size={13} color="#22c55e" />
            </motion.div>
          : <motion.div key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Share2 size={13} />
            </motion.div>
        }
      </AnimatePresence>
      {copied ? 'Copied!' : 'Share'}
    </motion.button>
  )
}

export default function CollectionPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const { user } = useAuth()
  const { playSongList } = usePlayer()
  const [col, setCol] = useState<DbCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [resolvedId, setResolvedId] = useState('')

  useEffect(() => {
    params.then(async ({ username: u, id }) => {
      setUsername(u)
      setResolvedId(id)
      const data = await getCollection(id, user?.id)
      setCol(data)
      setLoading(false)
    })
  }, [params, user?.id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080b24' }}>
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  )

  if (!col) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#080b24' }}>
      <div className="text-6xl">🔍</div>
      <p className="text-white">Collection not found or private</p>
      <Link href="/" className="text-purple-400 text-sm">← Back to Mimix</Link>
    </div>
  )

  const ownerProfile = col.profiles
  const theme = (ownerProfile?.theme ?? 'midnight') as keyof typeof THEME_STYLES
  const th = THEME_STYLES[theme] ?? THEME_STYLES.midnight
  const textColor = theme === 'paper' ? '#1a1a2e' : 'white'
  const mutedColor = theme === 'paper' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'
  const btnBg = theme === 'paper' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const btnBorder = theme === 'paper' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'
  const btnColor = theme === 'paper' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'
  const songs = (col.songs ?? []).map(dbSongToSong)
  const glowRgb = th.accent.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(',') ?? '124,58,237'
  const isOwner = !!user && col.user_id === user.id

  return (
    <div className="min-h-screen" style={{ background: th.bg }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${th.c1}60, transparent)`, filter: 'blur(100px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-20">
        {/* Back */}
        <Link href={`/u/${username}`} className="inline-flex items-center gap-2 text-sm mb-8 hover:opacity-80 transition-opacity"
          style={{ color: mutedColor }}>
          <ArrowLeft size={14} /> @{username}&apos;s profile
        </Link>

        {/* Collection header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="text-6xl mb-4">{col.emoji}</div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl font-medium mb-2" style={{ color: textColor }}>{col.name}</h1>
              {col.description && <p className="text-base max-w-xl mb-3" style={{ color: mutedColor }}>{col.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${th.accent}, ${th.c1})` }}>
                  {ownerProfile?.display_name?.[0] ?? '?'}
                </div>
                <Link href={`/u/${username}`} className="text-sm hover:underline" style={{ color: th.accent }}>
                  {ownerProfile?.display_name}
                </Link>
                <span className="text-xs" style={{ color: mutedColor }}>· {songs.length} songs</span>
                {!col.is_public && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: mutedColor }}>
                    <Lock size={10} /> Private
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <LikeButton collectionId={col.id} initialCount={col.like_count ?? 0} initialLiked={col.liked_by_me ?? false} glowRgb={glowRgb} />

              {/* Owner: Add Songs button */}
              {isOwner && (
                <Link href="/me"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ background: `linear-gradient(135deg, ${th.accent}cc, #7c3aed)`, border: `1px solid ${th.accent}60` }}>
                  <Plus size={13} /> Add Songs
                </Link>
              )}

              <ShareButton accentColor={th.accent} />

              <motion.button onClick={() => playSongList([...songs].sort(() => Math.random() - 0.5), true)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} disabled={!songs.length}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: btnColor, opacity: songs.length ? 1 : 0.4 }}>
                <Shuffle size={13} /> Shuffle
              </motion.button>

              <motion.button onClick={() => playSongList(songs, false)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} disabled={!songs.length}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white"
                style={{ background: `linear-gradient(135deg, ${th.accent}, ${th.c1})`, boxShadow: `0 4px 20px ${th.accent}40`, opacity: songs.length ? 1 : 0.4 }}>
                <Play size={14} fill="white" /> Play All
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Songs */}
        {songs.length === 0 ? (
          <div className="text-center py-20">
            <Music2 size={40} style={{ color: mutedColor, margin: '0 auto 12px' }} />
            <p style={{ color: mutedColor }}>No songs in this collection yet.</p>
          </div>
        ) : (
          <div className="masonry-grid mb-12">
            {songs.map((song, i) => (
              <SongCard key={song.id} song={song} index={i} view="grid"
                onClick={() => playSongList(songs.slice(i).concat(songs.slice(0, i)), false)} />
            ))}
          </div>
        )}

        {/* Comments */}
        <div className="mt-8 p-6 rounded-2xl" style={{ background: theme === 'paper' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', border: `1px solid ${theme === 'paper' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}>
          <CommentSection collectionId={col.id} />
        </div>
      </div>
    </div>
  )
}
