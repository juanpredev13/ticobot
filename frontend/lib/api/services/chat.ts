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
   * Stream chat response using Server-Sent Events
   * Returns a cancel function to abort the stream
   */
  streamChat: async (
    request: ChatRequest,
    onChunk: (text: string) => void,
    onComplete: (response: ChatResponse) => void,
    onError: (error: Error) => void
  ): Promise<() => void> => {
    const controller = new AbortController();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if token exists
          ...(typeof window !== 'undefined' && localStorage.getItem('accessToken')
            ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            : {}),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Process stream chunks
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE format (Server-Sent Events)
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Stream complete
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.chunk) {
                    onChunk(parsed.chunk);
                  }
                  if (parsed.complete) {
                    onComplete(parsed);
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Stream cancelled');
          } else {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      })();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream cancelled');
      } else {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Return cancel function
    return () => controller.abort();
  },

  /**
   * Legacy stream method (returns ReadableStream)
   * @deprecated Use streamChat instead for better control
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
