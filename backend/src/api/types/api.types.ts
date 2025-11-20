/**
 * Type definitions for API module
 */

// Request types
export interface ChatRequest {
  query: string;
  conversationId?: string;
  filters?: {
    party?: string[];
    section?: string[];
  };
}

export interface DocumentListRequest {
  page?: number;
  limit?: number;
  party?: string;
}

export interface SearchRequest {
  query: string;
  topK?: number;
  filters?: {
    party?: string[];
  };
}

// Response types
export interface ChatResponse {
  answer: string;
  sources: Source[];
  conversationId: string;
  confidence: number;
}

export interface Source {
  documentId: string;
  party: string;
  excerpt: string;
  score: number;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface DocumentItem {
  id: string;
  title: string;
  party: string;
  url: string;
  downloadedAt?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    database: boolean;
    vectorStore: boolean;
    llm: boolean;
  };
}