/**
 * React Query hooks for Authentication API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../api/services';
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthRefreshRequest,
} from '../api/types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

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
    onSuccess: (data) => {
      // Cache user data after registration
      queryClient.setQueryData(authKeys.user(), data.user);
      // Store tokens (in real app, use httpOnly cookies or secure storage)
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
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
    onSuccess: (data) => {
      // Cache user data after login
      queryClient.setQueryData(authKeys.user(), data.user);
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
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
    onSuccess: (data) => {
      // Update tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
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
      // Clear all cached data
      queryClient.clear();
      // Remove tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
  });
}
