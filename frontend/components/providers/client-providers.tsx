'use client'

import { type ReactNode } from 'react'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from '../theme-provider'
import { Toaster } from 'sonner'

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        {children}
        <Toaster position="top-right" richColors />
      </QueryProvider>
    </ThemeProvider>
  )
}
