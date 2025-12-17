import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { Logger } from '@ticobot/shared';

/**
 * Service for managing cached chat responses
 */
export class ChatCacheService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Generate hash for question (normalized)
   */
  private hashQuestion(question: string): string {
    // Normalize: lowercase, trim, remove extra spaces
    const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Generate hash for cache key (question + party filter + other params)
   */
  private hashCacheKey(question: string, party?: string, topK?: number, minRelevanceScore?: number): string {
    // Create a consistent key from all parameters
    const keyParts = [
      question.toLowerCase().trim().replace(/\s+/g, ' '),
      party || 'all',
      topK?.toString() || '5',
      minRelevanceScore?.toString() || '0.1',
    ];
    const key = keyParts.join('|');
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Get cached chat response if available and not expired
   */
  async getCached(
    question: string,
    party?: string,
    topK?: number,
    minRelevanceScore?: number
  ): Promise<{
    answer: string;
    sources: any[];
    metadata: any;
  } | null> {
    const logger = new Logger('ChatCacheService');
    const questionHash = this.hashQuestion(question);
    const cacheKeyHash = this.hashCacheKey(question, party, topK, minRelevanceScore);

    logger.info(`Cache lookup - Question: "${question}" → Hash: ${questionHash.substring(0, 8)}...`);
    logger.info(`Cache lookup - Key: ${cacheKeyHash.substring(0, 8)}... (party=${party || 'all'})`);

    const { data, error } = await this.supabase
      .from('chat_cache')
      .select('answer, sources, metadata, expires_at, question, party')
      .eq('question_hash', questionHash)
      .eq('cache_key_hash', cacheKeyHash)
      .maybeSingle();

    if (error) {
      logger.warn('Error fetching cache:', error);
      // Check if table exists
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.error('❌ Cache table does not exist!');
        logger.error('   Run migration: supabase/migrations/20250115000000_create_chat_cache.sql');
        logger.error('   Or execute manually in Supabase SQL Editor');
      }
      return null;
    }

    if (!data) {
      logger.info(`Cache MISS - No entry found for question: "${question}"`);
      return null;
    }

    logger.info(`Cache entry found - Question: "${data.question}", Party: ${data.party || 'all'}`);

    // Check expiration
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        // Expired, delete it
        await this.supabase
          .from('chat_cache')
          .delete()
          .eq('question_hash', questionHash)
          .eq('cache_key_hash', cacheKeyHash);
        return null;
      }
    }

    return {
      answer: data.answer as string,
      sources: (data.sources as any[]) || [],
      metadata: data.metadata || {},
    };
  }

  /**
   * Store chat response in cache
   */
  async setCached(
    question: string,
    answer: string,
    sources: any[],
    metadata?: {
      processingTime?: number;
      tokensUsed?: number;
      model?: string;
      expiresInHours?: number;
    },
    party?: string,
    topK?: number,
    minRelevanceScore?: number
  ): Promise<void> {
    const questionHash = this.hashQuestion(question);
    const cacheKeyHash = this.hashCacheKey(question, party, topK, minRelevanceScore);

    const expiresAt = metadata?.expiresInHours
      ? new Date(Date.now() + metadata.expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await this.supabase
      .from('chat_cache')
      .upsert(
        {
          question,
          party: party || null,
          question_hash: questionHash,
          cache_key_hash: cacheKeyHash,
          answer,
          sources,
          metadata: {
            ...metadata,
            cached_at: new Date().toISOString(),
          },
          expires_at: expiresAt,
        },
        {
          onConflict: 'question_hash,cache_key_hash',
        }
      );

    if (error) {
      const logger = new Logger('ChatCacheService');
      logger.warn('Error storing cache:', error);
    }
  }

  /**
   * Invalidate cache for a specific question
   */
  async invalidate(question: string, party?: string): Promise<void> {
    const questionHash = this.hashQuestion(question);
    const cacheKeyHash = this.hashCacheKey(question, party);

    await this.supabase
      .from('chat_cache')
      .delete()
      .eq('question_hash', questionHash)
      .eq('cache_key_hash', cacheKeyHash);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpired(): Promise<number> {
    const { data, error } = await this.supabase
      .from('chat_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)
      .select();

    if (error) {
      const logger = new Logger('ChatCacheService');
      logger.warn('Error cleaning up expired cache:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    total: number;
    expired: number;
    neverExpires: number;
  }> {
    const { count: total } = await this.supabase
      .from('chat_cache')
      .select('*', { count: 'exact', head: true });

    const { count: expired } = await this.supabase
      .from('chat_cache')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null);

    const { count: neverExpires } = await this.supabase
      .from('chat_cache')
      .select('*', { count: 'exact', head: true })
      .is('expires_at', null);

    return {
      total: total || 0,
      expired: expired || 0,
      neverExpires: neverExpires || 0,
    };
  }
}

