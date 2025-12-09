/**
 * Chat API Service
 * Handles RAG-based chat operations
 */

import { api } from '../client';
import type { ChatRequest, ChatResponse } from '../types';

export const chatService = {
  /**
   * Send a chat message and get response
   */
  ask: async (request: ChatRequest): Promise<ChatResponse> => {
    return api.post<ChatResponse>('/api/chat', request);
  },

  /**
   * Stream chat response (for future implementation)
   * Note: This would need special handling for SSE/streaming
   */
  stream: async (request: ChatRequest): Promise<ReadableStream> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat stream failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  },
};
