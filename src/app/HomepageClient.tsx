'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getPublicCollections, getTagRecommendations } from '@/lib/db'
import { DbCollection } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { Music2, Heart, Play, Music, Sparkles, TrendingUp, ChevronRight } from 'lucide-react'

const THEME_ACCENTS: Record<string, string> = {
  midnight: '#818cf8',
  blush: '#f472b6',
  paper: '#6366f1',
}

function CollectionCard({ col, index }: { col: DbCollection; index: number }) {
  const accent = THEME_ACCENTS[col.profiles?.theme ?? 'midnight'] ?? '#818cf8'
  const gradFrom = col.profiles?.theme === 'blush' ? '#831843' : col.profiles?.theme === 'paper' ? '#3730a3' : '#312e81'
  const gradTo = col.profiles?.theme === 'blush' ? '#4a044e' : col.profiles?.theme === 'paper' ? '#1e1b4b' : '#1e1b4b'

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="masonry-item group">
      <Link href={`/u/${col.profiles?.username}/collection/${col.id}`}>
        <div className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
          style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`, border: `1px solid ${accent}20`, boxShadow: `0 4px 24px rgba(0,0,0,0.4)` }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${accent}40` }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)' }}>
          <div className="p-5">
            <div className="text-3xl mb-3">{col.emoji}</div>
            <h3 className="font-display text-lg font-medium text-white mb-1 leading-tight">{col.name}</h3>
            {col.description && <p className="text-xs line-clamp-2 mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{col.description}</p>}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${gradFrom})` }}>
                  {col.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{col.profiles?.display_name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span className="flex items-center gap-0.5"><Music2 size={10} />{col.song_count ?? 0}</span>
                <span className="flex items-center gap-0.5"><Heart size={10} />{col.like_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.25)' }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: `${accent}40`, backdropFilter: 'blur(12px)', border: `1px solid ${accent}60` }}>
              <Play size={16} fill="white" color="white" style={{ marginLeft: 2 }} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function RecommendRow({ tag, collections, index }: { tag: string; collections: DbCollection[]; index: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.12 }}
      className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#a78bfa' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Because you love <span style={{ color: '#a78bfa' }}>&quot;{tag}&quot;</span>
          </h2>
        </div>
        <button className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          See all <ChevronRight size={12} />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
        {collections.map((col, i) => {
          const accent = THEME_ACCENTS[col.profiles?.theme ?? 'midnight'] ?? '#818cf8'
          return (
            <Link key={col.id} href={`/u/${col.profiles?.username}/collection/${col.id}`}
              className="flex-shrink-0 group">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="w-40 rounded-xl overflow-hidden transition-all hover:-translate-y-1"
                style={{ background: 'var(--surface)', border: `1px solid ${accent}20`, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div className="h-28 flex items-center justify-center text-4xl relative"
                  style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}>
                  {col.emoji}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <Play size={20} fill="white" color="white" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{col.name}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{col.profiles?.display_name}</p>
                  <p className="text-[10px] mt-1" style={{ color: accent }}>{col.song_count ?? 0} songs</p>
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.section>
  )
}

export default function DiscoverPage() {
  const { user, profile } = useAuth()
  const [collections, setCollections] = useState<DbCollection[]>([])
  const [recommendations, setRecommendations] = useState<{ tag: string; collections: DbCollection[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cols] = await Promise.all([getPublicCollections(32)])
        setCollections(cols)
      } finally { setLoading(false) }
    }
    loadData()
  }, [])

  // Load personalised recommendations once we know the user
  useEffect(() => {
    if (!user) return
    getTagRecommendations(user.id)
      .then(setRecommendations)
      .catch(() => {})
  }, [user])

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              <Music size={20} color="white" />
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-medium text-gradient">Mimix</h1>
          </div>
          <p className="text-lg sm:text-xl mb-8" style={{ color: 'var(--text-muted)' }}>
            Your universe of sound. Curate · Share · Discover.
          </p>
          {!user && (
            <div className="flex items-center justify-center gap-3">
              <Link href="/login" className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
                Start your universe →
              </Link>
              <Link href="/login" className="px-6 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Sign in
              </Link>
            </div>
          )}
          {user && profile && (
            <Link href="/me" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
              My Dashboard →
            </Link>
          )}
        </motion.div>

        {/* Personalised "For You" rows */}
        {recommendations.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} style={{ color: '#a78bfa' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Made for you</h2>
            </div>
            {recommendations.map((rec, i) => (
              <RecommendRow key={rec.tag} tag={rec.tag} collections={rec.collections} index={i} />
            ))}
          </section>
        )}

        {/* Trending public collections */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
              {recommendations.length ? 'Trending' : 'Public Collections'}
            </h2>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{collections.length} collections</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🎵</div>
            <p className="font-display italic text-xl" style={{ color: 'var(--text-muted)' }}>No collections yet — be the first!</p>
            {!user && <Link href="/login" className="mt-6 inline-block px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>Join Mimix</Link>}
          </div>
        ) : (
          <div className="masonry-grid">
            {collections.map((col, i) => <CollectionCard key={col.id} col={col} index={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}
