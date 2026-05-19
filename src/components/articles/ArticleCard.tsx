'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Article } from '@/lib/types'
import { ExternalLink, Clock } from 'lucide-react'

interface ArticleCardProps {
  article: Article
  featured?: boolean
  index: number
  onClick: () => void
}

export default function ArticleCard({ article, featured = false, index, onClick }: ArticleCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="glass-card overflow-hidden h-full flex flex-col"
      >
        {/* Image */}
        <div className="relative overflow-hidden" style={{ height: featured ? '220px' : '160px' }}>
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-108"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => {}}
          />
          {/* Aurora fallback */}
          <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, var(--aurora1), var(--aurora2))' }} />
          {/* Bottom fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 55%)' }} />
          {/* Hover aurora overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
            style={{ background: 'var(--aurora1)' }} />
          {/* Publication */}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)', backdropFilter: 'blur(8px)' }}>
              {article.publication}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className={`font-display font-medium leading-snug mb-2 group-hover:text-[color:var(--accent)] transition-colors ${featured ? 'text-lg' : 'text-[15px]'}`}
            style={{ color: 'var(--text-primary)' }}>
            {article.title}
          </h3>
          <p className="text-sm leading-relaxed flex-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {article.description}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Clock size={11} />
              <span className="text-[11px]">{article.readingTime} min read</span>
            </div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
              <ExternalLink size={11} /> Read
            </motion.div>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {article.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.article>
  )
}
