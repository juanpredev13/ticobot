/**
 * Ingest Module
 *
 * Handles PDF ingestion pipeline for government plans.
 *
 * @module ingest
 */

// Export types
export type {
    PDFDocument,
    TextChunk,
    ChunkMetadata,
    IngestResult
} from './types/ingest.types.js';
  
  // TODO: Export components when implemented
  // export { PDFDownloader } from './components/PDFDownloader';
  // export { PDFParser } from './components/PDFParser';
  // export { TextCleaner } from './components/TextCleaner';
  // export { TextChunker } from './components/TextChunker';
  // export { IngestPipeline } from './components/IngestPipeline';