/**
 * React Query hooks for Chat API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../api/services';
import type { ChatRequest, ChatResponse } from '../api/types';

/**
 * Hook for chat mutation
 */
export function useChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ChatRequest) => chatService.ask(request),
    onSuccess: (data: ChatResponse) => {
      // Optionally cache the conversation
      queryClient.setQueryData(['chat', 'conversation', data.conversationId], data);
    },
  });
}

/**
 * Hook for streaming chat (future implementation)
 */
export function useChatStream() {
  return useMutation({
    mutationFn: (request: ChatRequest) => chatService.stream(request),
  });
}
