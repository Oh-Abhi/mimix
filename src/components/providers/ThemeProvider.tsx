'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'arctic' | 'blush' | 'forest'  // forest = Paper White

interface ThemeContextType {
  theme: Theme
  cycleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'arctic',
  cycleTheme: () => {},
  setTheme: () => {},
})

const ORDER: Theme[] = ['arctic', 'blush', 'forest']

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('arctic')

  useEffect(() => {
    const saved = localStorage.getItem('avi-theme') as Theme | null
    if (saved && ORDER.includes(saved)) setThemeState(saved)
  }, [])

  const applyTheme = (t: Theme) => {
    document.documentElement.setAttribute('data-theme', t === 'arctic' ? '' : t)
    localStorage.setItem('avi-theme', t)
  }

  const setTheme = (t: Theme) => { setThemeState(t); applyTheme(t) }

  const cycleTheme = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    setTheme(next)
  }

  useEffect(() => { applyTheme(theme) }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
