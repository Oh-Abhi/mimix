'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getProfile, getUserCollections } from '@/lib/db'
import { Profile, DbCollection } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { Music2, Heart, Play } from 'lucide-react'

const THEME_STYLES = {
  midnight: { bg: '#080b24', accent: '#818cf8', c1: '#312e81', c2: '#1e1b4b' },
  blush: { bg: '#1a0a1e', accent: '#f472b6', c1: '#831843', c2: '#4a044e' },
  paper: { bg: '#f8f6f1', accent: '#6366f1', c1: '#e0ddd6', c2: '#d5d0c5' },
}

export default function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [collections, setCollections] = useState<DbCollection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(async ({ username: u }) => {
      setUsername(u)
      const p = await getProfile(u)
      setProfile(p)
      if (p) {
        const cols = await getUserCollections(p.id, p.id !== user?.id)
        setCollections(cols)
      }
      setLoading(false)
    })
  }, [params, user?.id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080b24' }}>
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#080b24' }}>
      <div className="text-6xl">🔭</div>
      <h1 className="text-white font-display text-2xl">@{username} not found</h1>
      <Link href="/" className="text-purple-400 text-sm">← Back to Mimix</Link>
    </div>
  )

  const th = THEME_STYLES[profile.theme] ?? THEME_STYLES.midnight
  const isOwn = user?.id === profile.id
  const totalLikes = collections.reduce((a, c) => a + (c.like_count ?? 0), 0)
  const textColor = profile.theme === 'paper' ? '#1a1a2e' : 'white'
  const mutedColor = profile.theme === 'paper' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'

  return (
    <div className="min-h-screen" style={{ background: th.bg }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(circle, ${th.c1}80, transparent)`, filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(circle, ${th.c2}80, transparent)`, filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20">
        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl flex-shrink-0 flex items-center justify-center text-4xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${th.accent}80, ${th.c1})`, boxShadow: `0 12px 40px ${th.accent}40` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-3xl" />
                : profile.display_name[0]?.toUpperCase() ?? '?'
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-3xl font-medium" style={{ color: textColor }}>{profile.display_name}</h1>
                {isOwn && (
                  <Link href="/settings" className="text-xs px-3 py-1 rounded-full" style={{ background: `${th.accent}20`, color: th.accent, border: `1px solid ${th.accent}40` }}>
                    Edit Profile
                  </Link>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: mutedColor }}>@{profile.username}</p>
              {profile.bio && <p className="text-sm mt-3 max-w-md" style={{ color: profile.theme === 'paper' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>{profile.bio}</p>}

              {/* Stats */}
              <div className="flex gap-5 mt-4">
                {[
                  { label: 'Collections', val: collections.length },
                  { label: 'Total likes', val: totalLikes },
                  { label: 'Songs', val: collections.reduce((a, c) => a + (c.song_count ?? 0), 0) },
                ].map(s => (
                  <div key={s.label}>
                    <p className="font-semibold" style={{ color: textColor }}>{s.val}</p>
                    <p className="text-xs" style={{ color: mutedColor }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Collections grid */}
        <h2 className="text-sm uppercase tracking-widest font-semibold mb-4" style={{ color: mutedColor }}>Collections</h2>
        {collections.length === 0 ? (
          <div className="text-center py-20">
            <Music2 size={40} style={{ color: mutedColor, margin: '0 auto 12px' }} />
            <p style={{ color: mutedColor }}>{isOwn ? 'Add your first collection in your dashboard!' : 'No public collections yet.'}</p>
            {isOwn && <Link href="/me" className="mt-4 inline-block px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: `linear-gradient(135deg, #7c3aed, #db2777)` }}>Go to Dashboard</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col, i) => (
              <motion.div key={col.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Link href={`/u/${profile.username}/collection/${col.id}`}>
                  <div className="group relative rounded-2xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-1"
                    style={{ background: `linear-gradient(135deg, ${th.c1}, ${th.c2})`, border: `1px solid ${th.accent}20` }}>
                    <div className="p-5">
                      <div className="text-3xl mb-3">{col.emoji}</div>
                      <h3 className="font-display text-lg font-medium text-white mb-1 leading-tight">{col.name}</h3>
                      {col.description && <p className="text-xs line-clamp-2 mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{col.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          <span className="flex items-center gap-1"><Music2 size={11} />{col.song_count ?? 0}</span>
                          <span className="flex items-center gap-1"><Heart size={11} />{col.like_count ?? 0}</span>
                        </div>
                        {!col.is_public && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>Private</span>}
                      </div>
                    </div>
                    {/* Play hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: `${th.accent}50`, backdropFilter: 'blur(12px)', border: `1px solid ${th.accent}80` }}>
                        <Play size={18} fill="white" color="white" style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
