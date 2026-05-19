'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { updateProfile } from '@/lib/db'
import { useRouter } from 'next/navigation'
import {
  User, Palette, Lock, LogOut, Loader2, Check, AlertCircle,
  Bell, Shield, Trash2, ExternalLink, Copy, Eye, EyeOff
} from 'lucide-react'
import Link from 'next/link'

const THEMES = [
  {
    id: 'paper',
    label: 'Paper White',
    desc: 'Clean, minimal, light',
    preview: 'linear-gradient(135deg, #f8f6f1, #ede8e0)',
    accent: '#6366f1',
    badge: '✨ Default',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    desc: 'Deep dark blues',
    preview: 'linear-gradient(135deg, #0a0f2e, #1a237e)',
    accent: '#818cf8',
    badge: null,
  },
  {
    id: 'blush',
    label: 'Blush Rose',
    desc: 'Soft pinks & purples',
    preview: 'linear-gradient(135deg, #1a0a1e, #3d1a40)',
    accent: '#f472b6',
    badge: null,
  },
]

type Tab = 'profile' | 'appearance' | 'privacy' | 'account'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',    label: 'Profile',     icon: User },
  { id: 'appearance', label: 'Appearance',  icon: Palette },
  { id: 'privacy',    label: 'Privacy',     icon: Lock },
  { id: 'account',    label: 'Account',     icon: Shield },
]

export default function SettingsPageClient() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('profile')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [theme, setTheme] = useState<'midnight' | 'blush' | 'paper'>('paper')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '')
      setBio(profile.bio ?? '')
      setTheme(profile.theme ?? 'paper')
      setIsPublic(profile.is_public ?? true)
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true); setError('')
    try {
      await updateProfile(user.id, { display_name: displayName, bio, theme, is_public: isPublic })
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const copyProfileLink = () => {
    if (!profile) return
    navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Settings
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your Mimix profile and preferences</p>
          </div>

          {/* Tab strip */}
          <div className="flex gap-1 p-1 rounded-2xl mb-8 overflow-x-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center"
                style={tab === id
                  ? { background: 'var(--accent)', color: 'white' }
                  : { color: 'var(--text-muted)' }}>
                <Icon size={14} /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── PROFILE TAB ── */}
            {tab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-5">

                {/* Avatar preview */}
                <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                    {profile.display_name?.[0]?.toUpperCase() ?? profile.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{profile.display_name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={copyProfileLink}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-strong)' }}>
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? 'Copied!' : 'Copy link'}
                      </button>
                      <Link href={`/u/${profile.username}`} target="_blank"
                        className="flex items-center gap-1 text-xs hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={11} /> View profile
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Username (read-only) */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    Username
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--accent)' }}>@</span>
                    <span>{profile.username}</span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      Cannot be changed
                    </span>
                  </div>
                </div>

                {/* Display name */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    Display Name
                  </label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={40}
                    placeholder="How others see you"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    Bio <span className="normal-case font-normal ml-1">{bio.length}/150</span>
                  </label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={150} rows={3}
                    placeholder="Tell people about your music taste..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    Email
                  </label>
                  <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {user?.email}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── APPEARANCE TAB ── */}
            {tab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Choose how your <strong style={{ color: 'var(--text-primary)' }}>public profile</strong> looks to everyone who visits it. New users start with Paper White.
                </p>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id as typeof theme)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left"
                    style={theme === t.id
                      ? { background: 'var(--accent-glow)', border: '1px solid var(--border-strong)' }
                      : { background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    {/* Preview swatch */}
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 shadow-lg" style={{ background: t.preview }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{t.label}</p>
                        {t.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${t.accent}20`, color: t.accent }}>
                            {t.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {theme === t.id
                        ? <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.accent }}>
                            <Check size={12} color="white" />
                          </div>
                        : <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
                      }
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* ── PRIVACY TAB ── */}
            {tab === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-4">
                {/* Public profile toggle */}
                <div className="p-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Public Profile</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Others can discover and visit your profile on the Discover page
                      </p>
                    </div>
                    <button onClick={() => setIsPublic(v => !v)}
                      className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ml-4"
                      style={{ background: isPublic ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}>
                      <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow"
                        style={{ left: isPublic ? '26px' : '4px' }} />
                    </button>
                  </div>
                  {!isPublic && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                      <EyeOff size={12} /> Your profile and collections won&apos;t appear in Discover
                    </p>
                  )}
                  {isPublic && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#22c55e' }}>
                      <Eye size={12} /> Your public collections will appear in Discover
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Collection Privacy</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    You can set each collection as Public or Private individually when creating or editing it. Private collections are only visible to you.
                  </p>
                </div>

                <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Who can comment</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Anyone with a Mimix account can comment on your public collections. You can delete any comment on your own collections.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── ACCOUNT TAB ── */}
            {tab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-4">
                {/* Account info */}
                <div className="p-5 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Account Info</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: 'Email', val: user?.email ?? '—' },
                      { label: 'Username', val: `@${profile.username}` },
                      { label: 'Member since', val: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
                      { label: 'Theme', val: theme === 'paper' ? 'Paper White' : theme === 'blush' ? 'Blush Rose' : 'Midnight' },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        <p className="mb-0.5 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beta notice */}
                <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <Bell size={16} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#a78bfa' }}>You&apos;re in Beta</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(167,139,250,0.7)' }}>
                      Mimix is in beta. Use the feedback button (bottom right) to report bugs or request features. Your input shapes the app!
                    </p>
                  </div>
                </div>

                {/* Sign out */}
                <button onClick={handleSignOut}
                  className="w-full py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                  <LogOut size={15} /> Sign Out
                </button>

                {/* Danger zone */}
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} /> Danger Zone
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    Deleting your account will permanently remove all your songs, collections, likes, and comments. This cannot be undone.
                  </p>
                  <button className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                    onClick={() => alert('To delete your account, email us at mimix@help.com')}>
                    Request account deletion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save button (shown for profile/appearance/privacy tabs) */}
          {tab !== 'account' && (
            <motion.div className="mt-8 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl mb-3"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={14} color="#ef4444" />
                  <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
                </div>
              )}
              <motion.button onClick={handleSave} disabled={saving || saved}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition-all"
                style={{ background: saved ? '#22c55e' : 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saved && <Check size={15} />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </motion.button>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  )
}
