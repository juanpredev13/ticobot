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
  }
  
  export interface IngestResult {
    documentId: string;
    chunksCreated: number;
    embeddingsGenerated: number;
    status: 'success' | 'partial' | 'failed';
    error?: string;
  }