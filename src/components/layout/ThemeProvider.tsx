import { useEffect } from 'react'
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes'

/** Must match the key the inline bootstrap script in index.html reads. */
export const THEME_STORAGE_KEY = 'brightness-contour-theme'

/** Keeps the browser/PWA chrome in step with the resolved theme. */
const THEME_COLORS = {
  light: '#ffffff',
  dark: '#0a0a0a',
} as const

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    meta.setAttribute(
      'content',
      resolvedTheme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light
    )
  }, [resolvedTheme])

  return null
}

/**
 * Light / dark / system theming. next-themes puts the `dark` class on <html>,
 * which is what the `dark` custom variant in index.css keys off.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
    >
      <ThemeColorSync />
      {children}
    </NextThemeProvider>
  )
}
