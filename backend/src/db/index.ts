/**
 * Database Module
 *
 * Provides database utilities and data access layer.
 *
 * @module db
 */

// TODO: Export repositories when implemented
// export { DocumentRepository } from './repositories/DocumentRepository';
// export { ChunkRepository } from './repositories/ChunkRepository';
// export { BaseRepository } from './repositories/BaseRepository';

// TODO: Export migration runner
// export { runMigrations } from './migrations/migration-runner';

// Export services
export { PartiesService } from './services/parties.service.js';
export type { Party, CreatePartyData, UpdatePartyData } from './services/parties.service.js';

export { CandidatesService } from './services/candidates.service.js';
export type { Candidate, CreateCandidateData, UpdateCandidateData } from './services/candidates.service.js';

// Export Supabase client factory
export { createSupabaseClient, createAnonSupabaseClient } from './supabase.js';