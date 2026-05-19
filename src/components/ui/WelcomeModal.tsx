'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music2, Heart, Users, Layers, X, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    emoji: '🎵',
    title: 'Welcome to Mimix',
    desc: 'Your universe of sound. Curate music moments, share collections, and discover what your friends are listening to.',
    icon: Music2,
    color: '#818cf8',
  },
  {
    emoji: '🗂️',
    title: 'Build Collections',
    desc: 'Group songs into vibes — "2am drives", "monsoon feels", "pre-game energy". Add songs by searching YouTube and we auto-fetch the album art.',
    icon: Layers,
    color: '#f472b6',
  },
  {
    emoji: '🌍',
    title: 'Share Your Universe',
    desc: 'Every collection gets a public link. Your friends can listen, like, and comment. Visit their profiles and discover new music.',
    icon: Users,
    color: '#34d399',
  },
  {
    emoji: '❤️',
    title: 'Like & Connect',
    desc: 'Like collections you love. Leave comments. The Discover page shows everyone\'s public collections — find your next obsession.',
    icon: Heart,
    color: '#fb923c',
  },
]

export default function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('mimix_welcome_seen')
    if (!seen) {
      setTimeout(() => setOpen(true), 800)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('mimix_welcome_seen', '1')
    setOpen(false)
  }

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1)
    } else {
      handleClose()
    }
  }

  const current = SLIDES[slide]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(8,6,20,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            {/* Glow blob */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none transition-all duration-700"
              style={{ background: `radial-gradient(circle, ${current.color}30, transparent)`, filter: 'blur(40px)' }}
            />

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-opacity hover:opacity-60"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              <X size={13} />
            </button>

            {/* Content */}
            <div className="relative z-10 p-8 pt-10">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                  <Music2 size={14} color="white" />
                </div>
                <span className="text-white font-semibold text-sm">Mimix</span>
                <span className="text-xs ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>Beta</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                >
                  <div
                    className="text-5xl mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `${current.color}18`, border: `1px solid ${current.color}30` }}
                  >
                    {current.emoji}
                  </div>
                  <h2 className="text-white font-display text-2xl font-medium mb-3 leading-snug">
                    {current.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {current.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-8 mb-6">
                {SLIDES.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === slide ? 20 : 6,
                      height: 6,
                      background: i === slide ? current.color : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                {slide > 0 && (
                  <button onClick={() => setSlide(s => s - 1)}
                    className="flex-1 py-3 rounded-xl text-sm transition-opacity hover:opacity-70"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                    Back
                  </button>
                )}
                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${current.color}, #7c3aed)` }}
                >
                  {slide === SLIDES.length - 1 ? "Let's go! 🚀" : (
                    <><span>Next</span><ChevronRight size={15} /></>
                  )}
                </motion.button>
              </div>

              <button onClick={handleClose} className="w-full text-center mt-3 text-xs py-1 hover:opacity-60 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                Skip intro
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
