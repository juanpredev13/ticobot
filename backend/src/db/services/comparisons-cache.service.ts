import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { Logger } from '@ticobot/shared';

/**
 * Service for managing cached comparisons
 */
export class ComparisonsCacheService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Generate hash for topic (normalized)
   */
  private hashTopic(topic: string): string {
    // Normalize: lowercase, trim, remove extra spaces
    const normalized = topic.toLowerCase().trim().replace(/\s+/g, ' ');
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Generate hash for party IDs array (sorted for consistency)
   */
  private hashPartyIds(partyIds: string[]): string {
    // Sort array and hash it for consistent comparison
    const sorted = [...partyIds].sort().join(',');
    return createHash('sha256').update(sorted).digest('hex');
  }

  /**
   * Get cached comparison if available and not expired
   */
  async getCached(
    topic: string,
    partyIds: string[]
  ): Promise<{
    comparisons: any[];
    metadata: any;
  } | null> {
    const logger = new Logger('ComparisonsCacheService');
    const topicHash = this.hashTopic(topic);
    const partyIdsHash = this.hashPartyIds(partyIds);

    logger.info(`Cache lookup - Topic: "${topic}" → Hash: ${topicHash.substring(0, 8)}...`);
    logger.info(`Cache lookup - Parties: [${partyIds.join(', ')}] → Hash: ${partyIdsHash.substring(0, 8)}...`);

    const { data, error } = await this.supabase
      .from('comparisons_cache')
      .select('comparisons, metadata, expires_at, topic, party_ids')
      .eq('topic_hash', topicHash)
      .eq('party_ids_hash', partyIdsHash)
      .maybeSingle();

    if (error) {
      logger.warn('Error fetching cache:', error);
      // Check if table exists
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.error('❌ Cache table does not exist!');
        logger.error('   Run migration: supabase/migrations/20250115000000_create_comparisons_cache.sql');
        logger.error('   Or execute manually in Supabase SQL Editor');
      }
      return null;
    }

    if (!data) {
      logger.info(`Cache MISS - No entry found for topic: "${topic}" with parties: [${partyIds.join(', ')}]`);
      return null;
    }

    logger.info(`Cache entry found - Topic: "${data.topic}", Parties: [${(data.party_ids as string[]).join(', ')}]`);

    // Check expiration
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        // Expired, delete it
        await this.supabase
          .from('comparisons_cache')
          .delete()
          .eq('topic_hash', topicHash)
          .eq('party_ids_hash', partyIdsHash);
        return null;
      }
    }

    return {
      comparisons: data.comparisons as any[],
      metadata: data.metadata || {},
    };
  }

  /**
   * Store comparison result in cache
   */
  async setCached(
    topic: string,
    partyIds: string[],
    comparisons: any[],
    metadata?: {
      processingTime?: number;
      expiresInHours?: number;
    }
  ): Promise<void> {
    const topicHash = this.hashTopic(topic);
    const partyIdsHash = this.hashPartyIds(partyIds);

    const expiresAt = metadata?.expiresInHours
      ? new Date(Date.now() + metadata.expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await this.supabase
      .from('comparisons_cache')
      .upsert(
        {
          topic,
          party_ids: partyIds,
          topic_hash: topicHash,
          party_ids_hash: partyIdsHash,
          comparisons,
          metadata: {
            ...metadata,
            cached_at: new Date().toISOString(),
          },
          expires_at: expiresAt,
        },
        {
          onConflict: 'topic_hash,party_ids_hash',
        }
      );

    if (error) {
      const logger = new Logger('ComparisonsCacheService');
      logger.warn('Error storing cache:', error);
    }
  }

  /**
   * Invalidate cache for a specific topic and parties
   */
  async invalidate(topic: string, partyIds: string[]): Promise<void> {
    const topicHash = this.hashTopic(topic);
    const partyIdsHash = this.hashPartyIds(partyIds);

    await this.supabase
      .from('comparisons_cache')
      .delete()
      .eq('topic_hash', topicHash)
      .eq('party_ids_hash', partyIdsHash);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpired(): Promise<number> {
    const { data, error } = await this.supabase
      .from('comparisons_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)
      .select();

    if (error) {
      const logger = new Logger('ComparisonsCacheService');
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
      .from('comparisons_cache')
      .select('*', { count: 'exact', head: true });

    const { count: expired } = await this.supabase
      .from('comparisons_cache')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null);

    const { count: neverExpires } = await this.supabase
      .from('comparisons_cache')
      .select('*', { count: 'exact', head: true })
      .is('expires_at', null);

    return {
      total: total || 0,
      expired: expired || 0,
      neverExpires: neverExpires || 0,
    };
  }
}

