/**
 * API Services Index
 * Exports all API services for easy importing
 */

export { documentsService } from './documents';
export { searchService } from './search';
export { chatService } from './chat';
export { healthService } from './health';
export { authService } from './auth';
export { partiesService } from './parties';
export { candidatesService } from './candidates';

// Re-export types
export * from '../types';
export type { Party, Candidate, PartiesListResponse, PartyDetailResponse, PartyCandidatesResponse, ListPartiesParams } from './parties';
export type { CandidatesListResponse, CandidateDetailResponse, ListCandidatesParams } from './candidates';
