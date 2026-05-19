'use client'
import { useTheme } from '@/components/providers/ThemeProvider'

// Multi-layer aurora background — hidden on Paper White theme
export default function AuroraBackground() {
  const { theme } = useTheme()
  // Paper White theme: no aurora blobs, just clean white
  if (theme === 'forest') return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
        style={{ background: 'var(--aurora1)', filter: 'blur(100px)', animation: 'aurora-drift-1 18s ease-in-out infinite' }} />
      <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full"
        style={{ background: 'var(--aurora2)', filter: 'blur(110px)', animation: 'aurora-drift-2 22s ease-in-out infinite' }} />
      <div className="absolute -bottom-48 left-1/3 w-[700px] h-[500px] rounded-full"
        style={{ background: 'var(--aurora3)', filter: 'blur(120px)', animation: 'aurora-drift-3 16s ease-in-out infinite' }} />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full"
        style={{ background: 'var(--aurora4)', filter: 'blur(90px)', animation: 'aurora-drift-4 25s ease-in-out infinite' }} />
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, var(--bg) 100%)', opacity: 0.7 }} />
    </div>
  )
}
