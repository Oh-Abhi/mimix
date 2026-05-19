'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ListMusic, Check, Plus, Loader2, ChevronDown } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DbCollection } from '@/lib/types'

// Standalone helper — gets collections + which ones contain this song
async function getCollectionsWithStatus(userId: string, songId: string) {
  const sb = (await import('@/lib/supabase')).createClient()
  const [{ data: cols }, { data: inCols }] = await Promise.all([
    sb.from('music_collections').select('id, name, emoji, is_public').eq('user_id', userId).order('added_at', { ascending: false }),
    sb.from('collection_songs').select('collection_id').eq('song_id', songId)
  ])
  const inSet = new Set((inCols ?? []).map((r: { collection_id: string }) => r.collection_id))
  return { collections: cols ?? [], inSet }
}

interface Props {
  songId: string
  /** visual style: 'icon' = small circular button, 'pill' = labelled pill */
  variant?: 'icon' | 'pill'
  accentColor?: string
}

export default function AddToCollectionButton({ songId, variant = 'icon', accentColor = '#818cf8' }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<DbCollection[]>([])
  const [inSet, setInSet] = useState<Set<string>>(new Set())
  const [loadingData, setLoadingData] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = async () => {
    if (!user) return
    setOpen(o => !o)
    if (!open) {
      setLoadingData(true)
      try {
        const { collections: cols, inSet: s } = await getCollectionsWithStatus(user.id, songId)
        setCollections(cols as DbCollection[])
        setInSet(s)
      } finally { setLoadingData(false) }
    }
  }

  const toggle = async (colId: string) => {
    if (!user) return
    setSavingId(colId)
    try {
      if (inSet.has(colId)) {
        const sb = (await import('@/lib/supabase')).createClient()
        await sb.from('collection_songs').delete().match({ collection_id: colId, song_id: songId })
        setInSet(prev => { const s = new Set(prev); s.delete(colId); return s })
      } else {
        const sb = (await import('@/lib/supabase')).createClient()
        const { data: max } = await sb.from('collection_songs').select('position').eq('collection_id', colId).order('position', { ascending: false }).limit(1).single()
        await sb.from('collection_songs').insert({ collection_id: colId, song_id: songId, position: (max?.position ?? 0) + 1 })
        setInSet(prev => new Set([...prev, colId]))
      }
    } finally { setSavingId(null) }
  }

  if (!user) return null

  const anyIn = inSet.size > 0

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      {variant === 'icon' ? (
        <motion.button onClick={handleOpen} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          title="Add to collection"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{
            background: anyIn ? `${accentColor}25` : 'rgba(255,255,255,0.06)',
            border: `1px solid ${anyIn ? accentColor + '60' : 'rgba(255,255,255,0.12)'}`,
          }}>
          <ListMusic size={14} color={anyIn ? accentColor : 'rgba(255,255,255,0.6)'} />
        </motion.button>
      ) : (
        <motion.button onClick={handleOpen} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: anyIn ? `${accentColor}20` : 'rgba(255,255,255,0.08)',
            border: `1px solid ${anyIn ? accentColor + '50' : 'rgba(255,255,255,0.12)'}`,
            color: anyIn ? accentColor : 'rgba(255,255,255,0.7)',
          }}>
          <ListMusic size={12} />
          {anyIn ? 'In collection' : 'Add to collection'}
          <ChevronDown size={10} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </motion.button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[200] w-56 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              bottom: '110%',
              right: 0,
              background: 'rgba(12,10,24,0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold text-white">Add to collection</p>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin" style={{ color: accentColor }} />
              </div>
            ) : collections.length === 0 ? (
              <div className="px-4 py-4 text-center">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>No collections yet</p>
              </div>
            ) : (
              <div className="py-1.5 max-h-52 overflow-y-auto">
                {collections.map(col => {
                  const isIn = inSet.has(col.id)
                  const isSaving = savingId === col.id
                  return (
                    <button key={col.id} onClick={() => toggle(col.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5"
                      disabled={!!savingId}>
                      <span className="text-base flex-shrink-0">{col.emoji}</span>
                      <span className="flex-1 text-sm truncate" style={{ color: isIn ? 'white' : 'rgba(255,255,255,0.7)' }}>
                        {col.name}
                      </span>
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: isIn ? accentColor : 'rgba(255,255,255,0.08)', border: `1px solid ${isIn ? 'transparent' : 'rgba(255,255,255,0.2)'}` }}>
                        {isSaving
                          ? <Loader2 size={10} className="animate-spin" color="white" />
                          : isIn
                            ? <Check size={10} color="white" />
                            : <Plus size={10} color="rgba(255,255,255,0.5)" />
                        }
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
