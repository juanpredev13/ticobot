'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Suppress hydration warnings during build
  return (
    <NextThemesProvider {...props} suppressHydrationWarning>
      {children}
    </NextThemesProvider>
  )
}
