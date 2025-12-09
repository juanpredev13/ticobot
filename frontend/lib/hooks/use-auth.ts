/**
 * React Query hooks for Authentication API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../api/services';
import { authKeys } from './query-keys';
import { toast } from '../toast';
import { APIError } from '../api/client';
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthRefreshRequest,
} from '../api/types';

/**
 * Hook for user profile
 */
export function useUser(enabled = true) {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authService.me(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 401
  });
}

/**
 * Hook for user registration
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AuthRegisterRequest) => authService.register(request),
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.statusCode < 500) {
        return false;
      }
      // Retry up to 2 times on server errors (5xx)
      return failureCount < 2;
    },
    onSuccess: (data) => {
      toast.success('Cuenta creada exitosamente');
      // Cache user data after registration
      queryClient.setQueryData(authKeys.user(), data.user);
      // Invalidate auth queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Store tokens (in real app, use httpOnly cookies or secure storage)
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    },
    onError: (error) => {
      const message =
        error instanceof APIError
          ? error.message
          : 'Error al crear cuenta. Por favor, intenta de nuevo.';
      toast.error(message);
    },
  });
}

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AuthLoginRequest) => authService.login(request),
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401, 403) or validation errors (4xx)
      if (error instanceof APIError && error.statusCode < 500) {
        return false;
      }
      // Retry up to 2 times on server errors (5xx)
      return failureCount < 2;
    },
    onSuccess: (data) => {
      toast.success('Sesión iniciada correctamente');
      // Cache user data after login
      queryClient.setQueryData(authKeys.user(), data.user);
      // Invalidate auth queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    },
    onError: (error) => {
      let message = 'Error al iniciar sesión. Por favor, intenta de nuevo.';

      if (error instanceof APIError) {
        if (error.statusCode === 401) {
          message = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (error.statusCode === 429) {
          message = 'Demasiados intentos. Por favor, espera un momento.';
        } else {
          message = error.message;
        }
      }

      toast.error(message);
    },
  });
}

/**
 * Hook for token refresh
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AuthRefreshRequest) => authService.refresh(request),
    retry: 1, // Retry once for token refresh
    onSuccess: (data) => {
      // Update tokens silently (no toast notification)
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      // Update user data if provided
      if (data.user) {
        queryClient.setQueryData(authKeys.user(), data.user);
      }
    },
    onError: (error) => {
      // Token refresh failed - user needs to login again
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');

      // Clear auth data
      queryClient.removeQueries({ queryKey: authKeys.all });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      toast.success('Sesión cerrada correctamente');

      // ✅ Selective invalidation instead of clearing everything
      // Invalidate only auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Remove auth queries from cache
      queryClient.removeQueries({ queryKey: authKeys.user() });

      // Keep public data cached (documents, search results, etc.)
      // This improves UX as users can still browse without re-fetching everything

      // Remove tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
    onError: (error) => {
      // Even if logout fails on server, clear local data
      queryClient.removeQueries({ queryKey: authKeys.all });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }

      toast.error('Error al cerrar sesión, pero se limpió la sesión local.');
    },
  });
}
