/**
 * API Module
 *
 * Exposes HTTP API endpoints for TicoBot.
 *
 * @module api
 */

// Export types
export type {
    ChatRequest,
    ChatResponse,
    DocumentListRequest,
    DocumentListResponse,
    SearchRequest,
    Source,
    DocumentItem,
    ErrorResponse,
    HealthResponse
  } from './types/api.types.js';
  
  // TODO: Export routes when implemented
  // export { chatRouter } from './routes/chat.routes';
  // export { documentsRouter } from './routes/documents.routes';
  // export { searchRouter } from './routes/search.routes';
  // export { healthRouter } from './routes/health.routes';
  
  // TODO: Export server setup
  // export { startServer } from './server';
  
  export {};