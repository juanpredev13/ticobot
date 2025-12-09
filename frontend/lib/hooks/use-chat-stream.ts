/**
 * React hook for streaming chat with Server-Sent Events
 */

import { useState, useCallback, useRef } from 'react';
import { chatService } from '../api/services';
import type { ChatRequest, ChatResponse } from '../api/types';
import { toast } from '../toast';

interface UseChatStreamReturn {
  startStream: (request: ChatRequest) => Promise<void>;
  stopStream: () => void;
  reset: () => void;
  isStreaming: boolean;
  streamedContent: string;
  error: Error | null;
}

/**
 * Hook for streaming chat responses
 *
 * @example
 * ```tsx
 * const { startStream, stopStream, isStreaming, streamedContent } = useChatStream();
 *
 * const handleSend = async () => {
 *   await startStream({ query: 'Hello', conversationId: '123' });
 * };
 * ```
 */
export function useChatStream(): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const startStream = useCallback(async (request: ChatRequest) => {
    setIsStreaming(true);
    setStreamedContent('');
    setError(null);

    try {
      cancelRef.current = await chatService.streamChat(
        request,
        // onChunk - append each chunk to content
        (chunk: string) => {
          setStreamedContent((prev) => prev + chunk);
        },
        // onComplete - streaming finished successfully
        (response: ChatResponse) => {
          setIsStreaming(false);
          // Could store response metadata here if needed
          console.log('Stream completed:', response);
        },
        // onError - streaming failed
        (err: Error) => {
          setError(err);
          setIsStreaming(false);
          toast.error('Error en streaming: ' + err.message);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsStreaming(false);
      toast.error('Error al iniciar streaming');
    }
  }, []);

  const stopStream = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setStreamedContent('');
    setError(null);
  }, []);

  return {
    startStream,
    stopStream,
    reset,
    isStreaming,
    streamedContent,
    error,
  };
}
