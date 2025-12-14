/**
 * Centralized Query Keys Factory
 *
 * Following TanStack Query best practices for query key management.
 * Query keys should be hierarchical and use factories for consistency.
 *
 * @see https://tanstack.com/query/latest/docs/react/guides/query-keys
 */

import type { DocumentListRequest, SearchRequest } from '../api/types';

/**
 * Auth-related query keys
 */
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  token: () => [...authKeys.all, 'token'] as const,
};

/**
 * Documents-related query keys
 */
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params?: DocumentListRequest) => [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  chunks: (id: string) => [...documentKeys.detail(id), 'chunks'] as const,
};

/**
 * Search-related query keys
 */
export const searchKeys = {
  all: ['search'] as const,
  searches: () => [...searchKeys.all, 'searches'] as const,
  search: (request: SearchRequest) => [...searchKeys.searches(), request] as const,
  simple: (query: string, topK?: number) =>
    [...searchKeys.searches(), 'simple', query, topK] as const,
};

/**
 * Chat-related query keys
 */
export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.conversations(), id] as const,
  history: () => [...chatKeys.all, 'history'] as const,
};

/**
 * Parties-related query keys
 */
export const partyKeys = {
  all: ['parties'] as const,
  lists: () => [...partyKeys.all, 'list'] as const,
  list: (params?: { limit?: number; offset?: number }) => [...partyKeys.lists(), params] as const,
  details: () => [...partyKeys.all, 'detail'] as const,
  detail: (id: string) => [...partyKeys.details(), id] as const,
  bySlug: (slug: string) => [...partyKeys.details(), 'slug', slug] as const,
  candidates: (partyId: string) => [...partyKeys.detail(partyId), 'candidates'] as const,
};

export const compareKeys = {
  all: ['compare'] as const,
  compare: (params: { topic: string; partyIds: string[] }) => [...compareKeys.all, params] as const,
};

/**
 * Candidates-related query keys
 */
export const candidateKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidateKeys.all, 'list'] as const,
  list: (params?: { limit?: number; offset?: number; party_id?: string; position?: string }) => 
    [...candidateKeys.lists(), params] as const,
  details: () => [...candidateKeys.all, 'detail'] as const,
  detail: (id: string) => [...candidateKeys.details(), id] as const,
  bySlug: (slug: string) => [...candidateKeys.details(), 'slug', slug] as const,
};

/**
 * Health & Diagnostics query keys
 */
export const healthKeys = {
  all: ['health'] as const,
  check: () => [...healthKeys.all, 'check'] as const,
  diagnostics: () => [...healthKeys.all, 'diagnostics'] as const,
};

/**
 * All query keys combined for easy invalidation
 */
export const queryKeys = {
  auth: authKeys,
  documents: documentKeys,
  search: searchKeys,
  chat: chatKeys,
  health: healthKeys,
  parties: partyKeys,
  candidates: candidateKeys,
  compare: compareKeys,
};
