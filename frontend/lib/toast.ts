/**
 * Toast notification wrapper around Sonner
 * Provides consistent toast notifications across the application
 */

import { toast as sonnerToast } from 'sonner';

export const toast = {
  /**
   * Display a success toast notification
   */
  success: (message: string) => sonnerToast.success(message),

  /**
   * Display an error toast notification
   */
  error: (message: string) => sonnerToast.error(message),

  /**
   * Display a loading toast notification
   */
  loading: (message: string) => sonnerToast.loading(message),

  /**
   * Display an info toast notification
   */
  info: (message: string) => sonnerToast.info(message),

  /**
   * Display a warning toast notification
   */
  warning: (message: string) => sonnerToast.warning(message),

  /**
   * Handle a promise with automatic loading/success/error toasts
   */
  promise: sonnerToast.promise,

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
