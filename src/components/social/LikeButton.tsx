'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { toggleLike } from '@/lib/db'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

interface LikeButtonProps {
  collectionId: string
  initialCount: number
  initialLiked: boolean
  glowRgb?: string
}

export default function LikeButton({ collectionId, initialCount, initialLiked, glowRgb = '124,58,237' }: LikeButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (!user) { router.push('/login'); return }
    if (loading) return
    setLoading(true)
    const nowLiked = !liked
    setLiked(nowLiked)
    setCount(c => c + (nowLiked ? 1 : -1))
    try {
      await toggleLike(user.id, collectionId)
    } catch {
      setLiked(!nowLiked)
      setCount(c => c + (nowLiked ? -1 : 1))
    } finally { setLoading(false) }
  }

  return (
    <motion.button
      onClick={handleLike}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
      style={liked
        ? { background: `rgba(${glowRgb},0.2)`, border: `1px solid rgba(${glowRgb},0.5)`, color: `rgb(${glowRgb})`, boxShadow: `0 0 20px rgba(${glowRgb},0.3)` }
        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
      }
    >
      <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
        <Heart size={15} fill={liked ? `rgb(${glowRgb})` : 'none'} />
      </motion.div>
      <span>{count}</span>
    </motion.button>
  )
}
