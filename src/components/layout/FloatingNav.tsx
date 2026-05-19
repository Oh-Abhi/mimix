'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useTheme, Theme } from '@/components/providers/ThemeProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { Music, Layers, Settings, Compass, User, LogOut, Music2 } from 'lucide-react'

const guestNav = [
  { href: '/', label: 'Discover', icon: <Compass size={17} strokeWidth={1.8} /> },
  { href: '/music', label: 'Music', icon: <Music size={17} strokeWidth={1.8} /> },
  { href: '/collections', label: 'Collections', icon: <Layers size={17} strokeWidth={1.8} /> },
]
const authNav = [
  { href: '/', label: 'Discover', icon: <Compass size={17} strokeWidth={1.8} /> },
  { href: '/me', label: 'My Music', icon: <Music2 size={17} strokeWidth={1.8} /> },
  { href: '/collections', label: 'Collections', icon: <Layers size={17} strokeWidth={1.8} /> },
]

const THEME_META: Record<Theme, { label: string; emoji: string; next: string }> = {
  arctic: { label: 'Cozy Midnight', emoji: '🔮', next: 'Blush' },
  blush:  { label: 'Blush Rose',   emoji: '🌸', next: 'Paper' },
  forest: { label: 'Paper White',  emoji: '🤍', next: 'Midnight' },
}

export default function FloatingNav() {
  const pathname = usePathname()
  const { theme, cycleTheme } = useTheme()
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [hovered, setHovered] = useState<string | null>(null)
  const [visible, setVisible] = useState(true)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const lastY = useRef(0)
  const meta = THEME_META[theme]
  const navItems = (user && !authLoading) ? authNav : guestNav

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY
      setVisible(y < 60 || y < lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="nav"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="floating-nav fixed top-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-3 py-2.5 flex items-center gap-0.5"
        >
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
              >
                <AnimatePresence>
                  {hovered === item.href && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.85 }}
                      animate={{ opacity: 1, y: -4, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-[11px] font-medium pointer-events-none whitespace-nowrap z-10"
                      style={{
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative p-2.5 rounded-xl cursor-pointer flex items-center justify-center"
                    style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'var(--accent-glow)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{item.icon}</span>
                  </motion.div>
                </Link>
              </div>
            )
          })}

          {/* Divider */}
          <div className="w-px h-5 mx-1.5" style={{ background: 'var(--border)' }} />

          {/* Theme cycle button */}
          <div
            className="relative"
            onMouseEnter={() => setHovered('theme')}
            onMouseLeave={() => setHovered(null)}
          >
            <AnimatePresence>
              {hovered === 'theme' && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.85 }}
                  animate={{ opacity: 1, y: -4, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-[11px] font-medium pointer-events-none whitespace-nowrap z-10"
                  style={{
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  → {meta.next}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              onClick={cycleTheme}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 rounded-xl cursor-pointer flex items-center justify-center text-lg leading-none"
              title={`Switch to ${meta.next}`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {meta.emoji}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-1.5" style={{ background: 'var(--border)' }} />

          {/* Auth: Avatar or Sign In */}
          {user && profile ? (
            <div className="relative">
              <motion.button onClick={() => setAvatarOpen(o => !o)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : profile.display_name?.[0]?.toUpperCase() ?? '?'
                }
              </motion.button>
              <AnimatePresence>
                {avatarOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute top-12 right-0 w-48 rounded-2xl overflow-hidden z-50"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(24px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{profile.display_name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>
                    </div>
                    {[
                      { href: `/u/${profile.username}`, label: 'My Profile', icon: <User size={13} /> },
                      { href: '/settings', label: 'Settings', icon: <Settings size={13} /> },
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--text-secondary)' }}>
                        {item.icon}{item.label}
                      </Link>
                    ))}
                    <button onClick={() => { signOut(); setAvatarOpen(false) }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left hover:opacity-80 transition-opacity"
                      style={{ color: '#ef4444', borderTop: '1px solid var(--border)' }}>
                      <LogOut size={13} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Only show Sign In when we KNOW the user is logged out (not during loading)
            !authLoading && (
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                  Sign In
                </motion.div>
              </Link>
            )
          )}
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
