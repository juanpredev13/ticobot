/**
 * Compare API Service
 * Handles proposal comparison between parties
 */

import { api } from '../client';

/**
 * Proposal state enum
 */
export enum ProposalState {
  COMPLETA = 'completa',
  PARCIAL = 'parcial',
  POCO_CLARA = 'poco_clara',
  SIN_INFORMACION = 'sin_informacion',
}

/**
 * Source information for a proposal
 */
export interface ProposalSource {
  content: string;
  relevance: number;
  pageNumber?: number;
  pageRange?: { start: number; end: number };
  documentId?: string;
  chunkId?: string;
}

/**
 * Comparison result for a single party
 */
export interface PartyComparison {
  party: string;
  partyName: string;
  partyAbbreviation: string | null;
  answer: string;
  state: ProposalState;
  stateLabel: string;
  confidence: number;
  sources: ProposalSource[];
}

/**
 * Comparison request parameters
 */
export interface CompareProposalsParams {
  topic: string;
  partyIds: string[];
  topKPerParty?: number;
  temperature?: number;
}

/**
 * Comparison response
 */
export interface CompareProposalsResponse {
  topic: string;
  comparisons: PartyComparison[];
  metadata: {
    totalParties: number;
    timestamp: string;
  };
}

export const compareService = {
  /**
   * Compare proposals between multiple parties on a specific topic
   */
  compare: async (params: CompareProposalsParams): Promise<CompareProposalsResponse> => {
    // Use longer timeout for compare endpoint (3 minutes)
    // Comparison can take 30-40 seconds PER PARTY with RAG processing
    // For 5 parties: ~150-200 seconds total
    return api.post<CompareProposalsResponse>('/api/compare', params, {
      timeout: 180000, // 3 minutes
    });
  },
};



