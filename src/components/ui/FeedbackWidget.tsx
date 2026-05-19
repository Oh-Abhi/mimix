'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquarePlus, X, Star, Send, Loader2 } from 'lucide-react'
import { submitFeedback } from '@/lib/db'
import { useAuth } from '@/components/providers/AuthProvider'

const TYPES = [
  { id: 'bug', label: 'Bug 🐛', desc: 'Something broke' },
  { id: 'feature', label: 'Feature ✨', desc: 'I want this' },
  { id: 'love', label: 'Love it ❤️', desc: 'This is great' },
  { id: 'issue', label: 'Issue 😤', desc: "Doesn't work" },
]

export default function FeedbackWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>('')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const reset = () => { setType(''); setRating(0); setMessage(''); setDone(false) }

  const handleSubmit = async () => {
    if (!message.trim() || !type) return
    setSending(true)
    try {
      await submitFeedback({
        user_id: user?.id,
        type: type as 'bug' | 'feature' | 'love' | 'issue',
        message: message.trim(),
        rating,
        page_url: window.location.pathname,
      })
      setDone(true)
      setTimeout(() => { setOpen(false); setTimeout(reset, 400) }, 2500)
    } catch {
      // silently fail for beta
    } finally { setSending(false) }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="mb-3 w-80 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(10,8,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-white font-medium text-sm">Share feedback</span>
              <button onClick={() => { setOpen(false); setTimeout(reset, 400) }} style={{ color: 'rgba(255,255,255,0.4)' }}>
                <X size={15} />
              </button>
            </div>

            <div className="p-4">
              {done ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">🙏</div>
                  <p className="text-white font-medium text-sm">Thanks!</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Your feedback helps make Mimix better.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Type */}
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map(t => (
                      <button key={t.id} onClick={() => setType(t.id)}
                        className="p-2.5 rounded-xl text-left transition-all"
                        style={type === t.id
                          ? { background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.6)', color: 'white' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Stars */}
                  <div>
                    <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Rate your experience</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setRating(n)}>
                          <Star size={20} fill={n <= rating ? '#fbbf24' : 'none'} color={n <= rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us more..." rows={3} maxLength={400}
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />

                  <motion.button onClick={handleSubmit} disabled={!type || !message.trim() || sending}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', opacity: (!type || !message.trim()) ? 0.4 : 1 }}>
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send Feedback
                  </motion.button>
                  <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Beta v1 · Your page: {typeof window !== 'undefined' ? window.location.pathname : ''}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={18} color="white" /></motion.div>
            : <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquarePlus size={18} color="white" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
