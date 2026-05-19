'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Article, ArticleCollection } from '@/lib/types'
import ArticleCard from '@/components/articles/ArticleCard'
import ReadingModal from '@/components/articles/ReadingModal'
import { getArticles, getArticleCollections, ensureSeeded } from '@/lib/clientData'
import { Search } from 'lucide-react'

export default function ArticlesPageClient() {
  const [articles, setArticles] = useState<Article[]>([])
  const [collections, setCollections] = useState<ArticleCollection[]>([])
  const [query, setQuery] = useState('')
  const [activeCol, setActiveCol] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  useEffect(() => {
    ensureSeeded().then(() => {
      setArticles(getArticles())
      setCollections(getArticleCollections())
    })
  }, [])

  const filtered = articles.filter(a => {
    const mq = !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.publication.toLowerCase().includes(query.toLowerCase())
    const mc = activeCol === 'all' || (a.collections || []).includes(activeCol)
    return mq && mc
  })

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="font-display text-5xl sm:text-6xl font-medium text-gradient mb-3">Readings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Words worth keeping · {articles.length} articles</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-6 max-w-sm">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search articles, topics..." value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2 mb-10">
          {['all', ...collections.map(c => c.name.toLowerCase())].map(col => (
            <motion.button key={col} onClick={() => setActiveCol(col)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium capitalize"
              style={activeCol === col
                ? { background: 'var(--accent)', color: 'white' }
                : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {col === 'all' ? 'All' : `${collections.find(c => c.name.toLowerCase() === col)?.emoji ?? ''} ${col}`}
            </motion.button>
          ))}
        </motion.div>

        {/* Article playlist cards */}
        {activeCol === 'all' && collections.length > 0 && (
          <div className="mb-14">
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Playlists</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {collections.map((col, i) => (
                <motion.button key={col.id} onClick={() => setActiveCol(col.name.toLowerCase())}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }} className="glass-card flex-shrink-0 snap-start p-5 min-w-[180px] text-left cursor-pointer">
                  <span className="text-3xl mb-3 block">{col.emoji}</span>
                  <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{col.name}</h3>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{col.description}</p>
                  <p className="text-xs mt-2 font-medium" style={{ color: 'var(--accent)' }}>{col.articleIds.length} articles</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-32" style={{ color: 'var(--text-muted)' }}>
            <div className="text-5xl mb-4">📖</div>
            <p className="font-display italic text-xl">
              {articles.length === 0 ? 'No articles yet — add some in Admin!' : 'No articles found.'}
            </p>
          </div>
        ) : (
          <div className="article-grid">
            {filtered.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} featured={i === 0} onClick={() => setSelectedArticle(article)} />
            ))}
          </div>
        )}
      </div>

      <ReadingModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  )
}
