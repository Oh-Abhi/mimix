'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Music2, Loader2 } from 'lucide-react'

type Mode = 'signin' | 'signup'

const BLOBS = [
  { w: 500, h: 500, x: -100, y: -100, c1: '#7c3aed', c2: '#4f46e5' },
  { w: 400, h: 400, x: '60%', y: '40%', c1: '#db2777', c2: '#9333ea' },
  { w: 350, h: 350, x: '20%', y: '70%', c1: '#2563eb', c2: '#7c3aed' },
]

function GradientBlob({ w, h, x, y, c1, c2 }: typeof BLOBS[0]) {
  return (
    <div className="absolute rounded-full pointer-events-none"
      style={{ width: w, height: h, left: x, top: y, background: `radial-gradient(circle, ${c1}33, ${c2}11)`, filter: 'blur(80px)', transform: 'translate(-50%,-50%)' }} />
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/me')
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/onboarding` } })
        if (error) throw error
        setSent(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/onboarding` },
    })
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#050508' }}>
      {/* Ambient blobs */}
      {BLOBS.map((b, i) => <GradientBlob key={i} {...b} />)}

      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              <Music2 size={20} color="white" />
            </div>
            <span className="text-white font-display text-2xl font-semibold">Mimix</span>
          </div>
          <h1 className="text-white font-display text-5xl font-medium leading-tight mb-6">
            Your universe<br />of sound.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            Curate moments, share collections,<br />discover what your friends are feeling.
          </p>
        </div>

        {/* Floating preview cards */}
        <div className="space-y-3">
          {[
            { name: 'Avi', tag: '2am drives', color: '#7c3aed', songs: 12 },
            { name: 'Riya', tag: 'monsoon feels', color: '#db2777', songs: 8 },
            { name: 'Krish', tag: 'gym mode 💪', color: '#2563eb', songs: 20 },
          ].map((u, i) => (
            <motion.div key={u.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 + 0.5 }}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${u.color}, ${u.color}99)` }}>
                {u.name[0]}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{u.name}&apos;s universe</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.tag} · {u.songs} songs</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full" style={{ background: u.color }} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              <Music2 size={16} color="white" />
            </div>
            <span className="text-white font-display text-xl font-semibold">Mimix</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSent(false) }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={mode === m
                  ? { background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white' }
                  : { color: 'rgba(255,255,255,0.4)' }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8">
                <div className="text-4xl mb-4">📬</div>
                <h3 className="text-white font-medium text-lg mb-2">Check your inbox</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                  We sent a confirmation link to <strong style={{ color: 'white' }}>{email}</strong>. Click it to finish signing up.
                </p>
              </motion.div>
            ) : (
              <motion.form key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                onSubmit={handleEmail} className="space-y-3">
                {/* Google */}
                <button type="button" onClick={handleGoogle} disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}>
                  {googleLoading ? <Loader2 size={16} className="animate-spin" /> : (
                    <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                  )}
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* Email */}
                <div>
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>

                {/* Password */}
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-11"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', opacity: loading ? 0.7 : 1 }}>
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            By signing up you agree to vibe responsibly 🎵
          </p>
        </motion.div>
      </div>
    </div>
  )
}
