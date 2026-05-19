'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Article } from '@/lib/types'
import { X, ExternalLink, Clock, Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ReadingModalProps {
  article: Article | null
  onClose: () => void
}

export default function ReadingModal({ article, onClose }: ReadingModalProps) {
  const [iframeState, setIframeState] = useState<'loading' | 'loaded' | 'blocked'>('loading')

  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden'
      setIframeState('loading')
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [article])

  return (
    <AnimatePresence>
      {article && (
        <>
          <motion.div key="rb" className="fixed inset-0 z-[100] modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }} onClick={onClose}
          />
          <motion.div
            key="rp"
            className="fixed inset-y-0 right-0 z-[101] w-full max-w-3xl reading-panel flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--accent)' }}>
                  {article.publication}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={11} />{article.readingTime} min
                </span>
              </div>
              <div className="flex items-center gap-2">
                <motion.a
                  href={article.url} target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-strong)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink size={11} /> Open in tab
                </motion.a>
                <motion.button onClick={onClose} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <X size={15} />
                </motion.button>
              </div>
            </div>

            {/* Title */}
            <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-display text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                {article.title}
              </h2>
              {article.description && (
                <p className="text-sm mt-1.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {article.description}
                </p>
              )}
            </div>

            {/* Iframe area */}
            <div className="flex-1 relative overflow-hidden">
              {/* Loading spinner */}
              <AnimatePresence>
                {iframeState === 'loading' && (
                  <motion.div
                    key="loader"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
                    style={{ background: 'var(--bg)' }}
                    initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  >
                    <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading article…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Blocked state fallback */}
              <AnimatePresence>
                {iframeState === 'blocked' && (
                  <motion.div
                    key="blocked"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 z-10"
                    style={{ background: 'var(--bg)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <AlertCircle size={24} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        This site blocks embedding
                      </h3>
                      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        {article.publication} doesn&apos;t allow inline viewing. Open it directly instead.
                      </p>
                      <motion.a
                        href={article.url} target="_blank" rel="noopener noreferrer"
                        whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
                        style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 6px 24px var(--accent-glow)' }}
                      >
                        <ExternalLink size={15} /> Read on {article.publication}
                      </motion.a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The actual iframe */}
              {iframeState !== 'blocked' && (
                <iframe
                  key={article.url}
                  src={article.url}
                  className="w-full h-full border-0"
                  title={article.title}
                  onLoad={() => setIframeState('loaded')}
                  onError={() => setIframeState('blocked')}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  style={{ display: iframeState === 'loading' ? 'none' : 'block' }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
