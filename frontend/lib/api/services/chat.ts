/**
 * Chat API Service
 * Handles RAG-based chat operations
 */

import { api } from '../client';
import type { ChatRequest, ChatResponse } from '../types';

export const chatService = {
  /**
   * Send a chat message and get response
   * Maps frontend 'query' to backend 'question' field
   */
  ask: async (request: ChatRequest): Promise<ChatResponse> => {
    // Backend expects 'question' but frontend uses 'query'
    const backendRequest: any = {
      question: request.query,
    };
    
    // Add optional filters
    if (request.filters?.party?.[0]) {
      backendRequest.party = request.filters.party[0]; // Backend expects single party string, not array
    }
    
    const response = await api.post<any>('/api/chat', backendRequest);
    
    // Map backend response to frontend ChatResponse format
    return {
      answer: response.answer,
      sources: response.sources?.map((source: any) => ({
        documentId: source.id || '',
        party: source.party || '',
        excerpt: source.content || '',
        score: source.relevanceScore || 0,
        chunkId: source.id,
        document: source.document || '',
        page: source.page || undefined,
      })) || [],
      conversationId: request.conversationId || '', // Backend doesn't return this yet
      confidence: 0, // Not provided by backend
    };
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Get access token
    const accessToken = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken')
      : null;

    // Map frontend request to backend format
    const backendRequest: any = {
      question: request.query,
    };
    
    if (request.filters?.party?.[0]) {
      backendRequest.party = request.filters.party[0];
    }

    try {
      const response = await fetch(`${apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(backendRequest),
        signal: controller.signal,
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Stream failed: ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let sources: any[] = [];

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
                const data = line.slice(6).trim();
                if (!data || data === '[DONE]') {
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  
                  // Handle different event types from backend
                  if (parsed.type === 'chunk' && parsed.content) {
                    accumulatedContent += parsed.content;
                    onChunk(parsed.content);
                  } else if (parsed.type === 'sources') {
                    // Store sources when received (backend now sends content field)
                    sources = parsed.sources || [];
                  } else if (parsed.type === 'done') {
                    // Map backend response to frontend format
                    const chatResponse: ChatResponse = {
                      answer: accumulatedContent,
                      sources: sources.map((source: any) => ({
                        documentId: source.id || '',
                        party: source.party || '',
                        excerpt: source.content || '',
                        score: source.relevanceScore || 0,
                        chunkId: source.id,
                        // Store additional metadata for mapping
                        document: source.document || '',
                        page: source.page || undefined,
                      })),
                      conversationId: request.conversationId || '',
                      confidence: 0,
                    };
                    onComplete(chatResponse);
                  } else if (parsed.type === 'error') {
                    onError(new Error(parsed.message || 'Stream error'));
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/chat/stream`, {
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
