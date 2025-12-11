/**
 * React Query hooks for Chat API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../api/services';
import { chatKeys } from './query-keys';
import { toast } from '../toast';
import { APIError } from '../api/client';
import type { ChatRequest, ChatResponse } from '../api/types';

/**
 * Hook for chat mutation
 */
export function useChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ChatRequest) => chatService.ask(request),
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429) or validation errors (4xx)
      if (error instanceof APIError && error.statusCode === 429) {
        return false;
      }
      if (error instanceof APIError && error.statusCode < 500) {
        return false;
      }
      // Retry up to 1 time on server errors (5xx)
      return failureCount < 1;
    },
    onSuccess: (data: ChatResponse) => {
      // Cache the conversation
      queryClient.setQueryData(chatKeys.conversation(data.conversationId), data);
      // No toast notification for successful chat (UI shows the response)
    },
    onError: (error) => {
      let message = 'Error al enviar mensaje. Por favor, intenta de nuevo.';

      if (error instanceof APIError) {
        if (error.statusCode === 429) {
          message = 'Has alcanzado el límite de mensajes. Por favor, espera un momento.';
        } else if (error.statusCode === 401) {
          message = 'Debes iniciar sesión para usar el chat.';
        } else {
          message = error.message;
        }
      }

      toast.error(message);
    },
  });
}
