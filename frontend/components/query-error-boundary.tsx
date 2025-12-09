'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './error-boundary';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Query Error Boundary
 * Combines React Query's QueryErrorResetBoundary with our custom ErrorBoundary
 * Automatically resets queries when user clicks retry
 *
 * @example
 * ```tsx
 * <QueryErrorBoundary>
 *   <YourComponent />
 * </QueryErrorBoundary>
 * ```
 */
export function QueryErrorBoundary({ children, fallback }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={fallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
