'use client'
import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  count?: number
  type?: 'song' | 'article'
}

export default function LoadingSkeleton({ count = 6, type = 'song' }: LoadingSkeletonProps) {
  const heights = ['220px', '280px', '340px', '260px', '300px', '240px']

  if (type === 'song') {
    return (
      <div className="masonry-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="masonry-item">
            <div
              className="rounded-2xl animate-shimmer"
              style={{ height: heights[i % heights.length], border: '1px solid var(--border)' }}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="article-grid">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card overflow-hidden"
          style={{ height: '320px' }}
        >
          <div className="animate-shimmer h-48" />
          <div className="p-5 space-y-3">
            <div className="animate-shimmer h-4 rounded-full w-3/4" />
            <div className="animate-shimmer h-3 rounded-full w-full" />
            <div className="animate-shimmer h-3 rounded-full w-2/3" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
