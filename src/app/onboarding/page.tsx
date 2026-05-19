'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { updateProfile, checkUsernameAvailable } from '@/lib/db'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { Music2, Check, Loader2, AlertCircle } from 'lucide-react'

const THEMES = [
  { id: 'midnight', label: 'Midnight', desc: 'Deep dark blues', c1: '#0a0f2e', c2: '#1a237e', accent: '#818cf8' },
  { id: 'blush', label: 'Blush Rose', desc: 'Soft pinks', c1: '#1a0a1e', c2: '#3d1a40', accent: '#f472b6' },
  { id: 'paper', label: 'Paper White', desc: 'Clean minimal', c1: '#f8f6f1', c2: '#ede8e0', accent: '#6366f1' },
]

type Step = 'username' | 'profile' | 'theme' | 'done'

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [theme, setTheme] = useState<'midnight' | 'blush' | 'paper'>('midnight')
  const [checking, setChecking] = useState(false)
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const checkUsername = async (val: string) => {
    setUsername(val)
    if (val.length < 3 || !/^[a-z0-9_]+$/.test(val)) { setUsernameOk(null); return }
    setChecking(true)
    const ok = await checkUsernameAvailable(val)
    setUsernameOk(ok)
    setChecking(false)
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true); setError('')
    try {
      await updateProfile(user.id, { username, display_name: displayName || username, bio, theme })
      await refreshProfile()
      router.push('/me')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const steps: Step[] = ['username', 'profile', 'theme', 'done']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#050508' }}>
      {/* Purple-to-pink glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(219,39,119,0.15), transparent)', filter: 'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
            <Music2 size={16} color="white" />
          </div>
          <span className="text-white font-display text-xl font-semibold">Mimix</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.slice(0, 3).map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{ background: i <= stepIdx ? 'linear-gradient(90deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Username */}
          {step === 'username' && (
            <motion.div key="username" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-white font-display text-3xl font-medium mb-2">Pick your username</h2>
              <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                This is your unique handle. Others will find you at <span style={{ color: '#818cf8' }}>mimix.app/u/{username || 'you'}</span>
              </p>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>@</span>
                <input value={username} onChange={e => checkUsername(e.target.value.toLowerCase())}
                  placeholder="yourname" maxLength={20}
                  className="w-full pl-8 pr-10 py-3.5 rounded-xl text-sm outline-none font-mono"
                  style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${usernameOk === false ? '#ef4444' : usernameOk ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, color: 'white' }} />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking && <Loader2 size={15} className="animate-spin text-gray-400" />}
                  {!checking && usernameOk === true && <Check size={15} color="#22c55e" />}
                  {!checking && usernameOk === false && <AlertCircle size={15} color="#ef4444" />}
                </div>
              </div>
              {usernameOk === false && <p className="text-xs text-red-400 mb-4">Username taken or invalid (3-20 chars, letters/numbers/_)</p>}
              <motion.button onClick={() => setStep('profile')} disabled={!usernameOk}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl font-medium text-sm"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', opacity: usernameOk ? 1 : 0.4 }}>
                Continue →
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: Profile */}
          {step === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-white font-display text-3xl font-medium mb-2">About you</h2>
              <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>How should others see you?</p>
              <div className="space-y-3 mb-6">
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Display name (e.g. Avi 🎵)" maxLength={40}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                <textarea value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Short bio... (e.g. music is my therapy)" maxLength={150} rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('username')} className="flex-1 py-3 rounded-xl text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>← Back</button>
                <motion.button onClick={() => setStep('theme')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-[2] py-3 rounded-xl font-medium text-sm"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white' }}>
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Theme */}
          {step === 'theme' && (
            <motion.div key="theme" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-white font-display text-3xl font-medium mb-2">Your aesthetic</h2>
              <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>This is how your profile looks to everyone. You can change it later.</p>
              <div className="space-y-3 mb-6">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id as 'midnight' | 'blush' | 'paper')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                    style={{
                      background: theme === t.id ? `linear-gradient(135deg, ${t.c1}, ${t.c2})` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${theme === t.id ? t.accent + '60' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    <div className="w-10 h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`, border: `2px solid ${t.accent}40` }} />
                    <div className="text-left">
                      <p className="text-white font-medium text-sm">{t.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.desc}</p>
                    </div>
                    {theme === t.id && <Check size={16} color={t.accent} className="ml-auto" />}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('profile')} className="flex-1 py-3 rounded-xl text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>← Back</button>
                <motion.button onClick={handleFinish} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-[2] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white' }}>
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Let&apos;s go! 🚀
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
