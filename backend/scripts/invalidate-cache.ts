#!/usr/bin/env tsx

/**
 * Invalidate specific cache entries
 * 
 * Usage:
 *   tsx backend/scripts/invalidate-cache.ts "Corrupción" pln pusc
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { ComparisonsCacheService } from '../src/db/services/comparisons-cache.service.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('InvalidateCache');
const supabase = createSupabaseClient();
const cacheService = new ComparisonsCacheService(supabase);

async function invalidateCache(topic: string, partyIds: string[]) {
    logger.info(`🗑️  Invalidating cache for topic: "${topic}"`);
    logger.info(`   Parties: ${partyIds.join(', ')}\n`);

    try {
        await cacheService.invalidate(topic, partyIds);
        logger.info('✅ Cache invalidated successfully!');
        logger.info('   The next comparison request will regenerate the cache with fresh data.\n');
    } catch (error) {
        logger.error('❌ Error invalidating cache:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const topic = process.argv[2];
    const partyIds = process.argv.slice(3);

    if (!topic || partyIds.length === 0) {
        logger.error('❌ Usage: tsx backend/scripts/invalidate-cache.ts <topic> <party1> [party2] ...');
        logger.info('\nExample:');
        logger.info('  tsx backend/scripts/invalidate-cache.ts "Corrupción" pln pusc');
        process.exit(1);
    }

    invalidateCache(topic, partyIds)
        .then(() => process.exit(0))
        .catch((error) => {
            logger.error('❌ Script failed:', error);
            process.exit(1);
        });
}


