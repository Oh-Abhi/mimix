'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function CinematicIntro() {
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 800)
    const t2 = setTimeout(() => setPhase('out'), 2400)
    const t3 = setTimeout(() => setShow(false), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--bg)' }}
          exit={{ opacity: 0, scale: 1.06, filter: 'blur(24px)' }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Aurora blobs in intro */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
              style={{ background: 'var(--aurora1)', filter: 'blur(100px)', opacity: 0.5 }}
              animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }} />
            <motion.div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full"
              style={{ background: 'var(--aurora2)', filter: 'blur(110px)', opacity: 0.4 }}
              animate={{ scale: [1.1, 0.9, 1.1] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
          </div>

          <div className="text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: 'blur(20px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className="font-display text-8xl font-medium tracking-tight text-gradient">
                Avi
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="font-display italic text-lg mt-3"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}
            >
              life is enjoy
            </motion.p>

            {/* Progress bar */}
            <motion.div className="mt-10 h-px mx-auto rounded-full overflow-hidden"
              style={{ width: 100, background: 'var(--border)' }}>
              <motion.div className="h-full rounded-full" style={{ background: 'var(--accent)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.0, delay: 0.3, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
