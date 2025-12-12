'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  // Only create QueryClient on client side to avoid SSR issues
  const [queryClient] = useState(
    () =>
      typeof window !== 'undefined'
        ? new QueryClient({
            defaultOptions: {
              queries: {
                staleTime: 60 * 1000, // 1 minute
                gcTime: 5 * 60 * 1000, // 5 minutes
                retry: 1,
                refetchOnWindowFocus: false,
              },
            },
          })
        : null
  );

  // During SSR/build, render children without QueryClientProvider
  if (!queryClient || typeof window === 'undefined') {
    return <>{children}</>;
  }

  const showDevtools =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
