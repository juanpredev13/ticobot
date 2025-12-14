/**
 * Type definitions for Ingest module
 */

export interface PDFDocument {
    id: string;
    url: string;
    title: string;
    party: string;
    downloadedAt?: Date;
    filePath?: string;
  }
  
  export interface TextChunk {
    id: string;
    documentId: string;
    content: string;
    index: number;
    metadata: ChunkMetadata;
  }
  
  export interface ChunkMetadata {
    page?: number;
    section?: string;
    tokens?: number;
    characterCount: number;
    // Quality scoring (Issue #33)
    qualityScore?: number;
    qualityMetrics?: {
      lengthScore: number;
      specialCharRatio: number;
      hasKeywords: boolean;
      readability: number;
    };
    // Keyword extraction (Issue #32)
    keywords?: string[];
    entities?: string[];
  }
  
  export interface IngestResult {
    documentId: string;
    chunksCreated: number;
    embeddingsGenerated: number;
    status: 'success' | 'partial' | 'failed';
    error?: string;
  }