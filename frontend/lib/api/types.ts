/**
 * Shared TypeScript types for API requests and responses
 * These types match the backend API contract
 */

// ============================================================================
// Request Types
// ============================================================================

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

export interface IngestRequest {
  url: string;
  party: string;
  title?: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

// ============================================================================
// Response Types
// ============================================================================

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
  chunkId?: string;
  document?: string;
  page?: string | number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  query: string;
}

export interface SearchResult {
  id: string;
  documentId: string;
  party: string;
  title: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentItem {
  id: string;
  title: string;
  party: string;
  url: string;
  downloadedAt?: string;
  processedAt?: string;
  chunkCount?: number;
}

export interface DocumentDetailResponse extends DocumentItem {
  content?: string;
  metadata?: Record<string, unknown>;
  chunks?: ChunkItem[];
}

export interface ChunkItem {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptime?: number;
  services?: {
    database?: boolean;
    vectorStore?: boolean;
    llm?: boolean;
  };
}

export interface DiagnosticsResponse {
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  database: {
    connected: boolean;
    documentsCount: number;
    chunksCount: number;
  };
  vectorStore: {
    connected: boolean;
    indexName?: string;
  };
  llm: {
    available: boolean;
    provider?: string;
    model?: string;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  tier?: 'free' | 'premium';
  emailVerified?: boolean;
  createdAt: string;
}

export interface IngestResponse {
  success: boolean;
  documentId: string;
  message: string;
  chunksCreated?: number;
}

export interface BulkIngestResponse {
  success: boolean;
  results: IngestResponse[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ============================================================================
// Party & Candidate Types (for frontend-specific features)
// ============================================================================

export interface Party {
  id: string;
  name: string;
  abbreviation?: string;
  logo?: string;
  color?: string;
  website?: string;
  documentCount?: number;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  position: 'president' | 'vice-president' | 'deputy';
  photo?: string;
  bio?: string;
}
