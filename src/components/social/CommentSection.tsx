'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, Loader2, MessageCircle } from 'lucide-react'
import { getComments, addComment, deleteComment } from '@/lib/db'
import { useAuth } from '@/components/providers/AuthProvider'
import { Comment } from '@/lib/types'

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function CommentSection({ collectionId }: { collectionId: string }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    getComments(collectionId).then(c => { setComments(c); setLoading(false) })
  }, [collectionId, open])

  const send = async () => {
    if (!user || !text.trim()) return
    setSending(true)
    const optimistic: Comment = {
      id: Date.now().toString(), user_id: user.id, collection_id: collectionId,
      content: text.trim(), created_at: new Date().toISOString(),
      profiles: { username: profile?.username ?? '', display_name: profile?.display_name ?? '', avatar_url: profile?.avatar_url ?? '' }
    }
    setComments(c => [...c, optimistic])
    setText('')
    try {
      await addComment(user.id, collectionId, optimistic.content)
    } catch {
      setComments(c => c.filter(x => x.id !== optimistic.id))
    } finally {
      setSending(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const handleDelete = async (id: string) => {
    setComments(c => c.filter(x => x.id !== id))
    try { await deleteComment(id) } catch { getComments(collectionId).then(setComments) }
  }

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
        style={{ color: 'rgba(255,255,255,0.5)' }}>
        <MessageCircle size={15} />
        {open ? 'Hide comments' : `Comments (${comments.length})`}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-3">
              {loading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} /></div>}
              {!loading && comments.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>No comments yet. Be the first!</p>}
              {comments.map(c => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white' }}>
                    {(c.profiles?.display_name || c.profiles?.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-white">{c.profiles?.display_name || c.profiles?.username}</span>
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.content}</p>
                  </div>
                  {user?.id === c.user_id && (
                    <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 hover:opacity-60 flex-shrink-0" style={{ color: '#ef4444' }}>
                      <Trash2 size={11} />
                    </button>
                  )}
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>

            {user ? (
              <div className="flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Add a comment..." maxLength={500}
                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                <motion.button onClick={send} disabled={!text.trim() || sending} whileTap={{ scale: 0.93 }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', opacity: !text.trim() ? 0.4 : 1 }}>
                  {sending ? <Loader2 size={12} className="animate-spin text-white" /> : <Send size={12} color="white" />}
                </motion.button>
              </div>
            ) : (
              <a href="/login" className="text-xs" style={{ color: '#818cf8' }}>Sign in to comment</a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
