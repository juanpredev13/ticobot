/**
 * Type definitions for RAG module
 */

export interface QueryRequest {
    query: string;
    topK?: number;
    filters?: QueryFilters;
    conversationHistory?: ConversationMessage[];
  }
  
  export interface QueryFilters {
    party?: string[];
    section?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  }
  
  export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }
  
  export interface SearchResult {
    documentId: string;
    chunkId: string;
    content: string;
    score: number;
    metadata: {
      party: string;
      section?: string;
      page?: number;
    };
  }
  
  export interface RAGResponse {
    answer: string;
    sources: SearchResult[];
    confidence: number;
    processingTime: number;
    metadata: {
      model: string;
      tokensUsed?: number;
    };
  }