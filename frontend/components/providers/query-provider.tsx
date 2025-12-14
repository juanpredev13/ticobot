'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState, type ReactNode } from 'react';

// Dynamically import ReactQueryDevtools to avoid hydration issues
// Only loads on client-side in development mode
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true'
    ? dynamic(
        () =>
          import('@tanstack/react-query-devtools').then(
            (mod) => mod.ReactQueryDevtools
          ),
        { ssr: false }
      )
    : () => null;

export function QueryProvider({ children }: { readonly children: ReactNode }) {
  // Always create QueryClient, even during SSR/build
  // This prevents "No QueryClient set" errors during static generation
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
            // Disable queries during SSR to avoid unnecessary API calls
            enabled: globalThis.window !== undefined,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
