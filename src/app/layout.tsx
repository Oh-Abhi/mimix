import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PlayerProvider } from '@/components/providers/PlayerProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import FloatingNav from '@/components/layout/FloatingNav'
import CinematicIntro from '@/components/layout/CinematicIntro'
import AmbientGlow from '@/components/ui/AmbientGlow'
import PlayerModal from '@/components/music/PlayerModal'
import MiniPlayer from '@/components/music/MiniPlayer'
import FeedbackWidget from '@/components/ui/FeedbackWidget'
import WelcomeModal from '@/components/ui/WelcomeModal'

export const metadata: Metadata = {
  title: 'Mimix — Your Universe of Sound',
  description: 'Curate music moments, share collections, discover what your friends are feeling.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <PlayerProvider>
              <CinematicIntro />
              <AmbientGlow />
              <FloatingNav />
              <main className="relative z-10 min-h-screen">
                {children}
              </main>
              <PlayerModal />
              <MiniPlayer />
              <FeedbackWidget />
              <WelcomeModal />
            </PlayerProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
