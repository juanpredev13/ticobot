#!/usr/bin/env tsx

/**
 * Remove expiration from all comparisons_cache entries
 * 
 * This script sets expires_at to NULL for all entries in the comparisons_cache table,
 * making them never expire.
 * 
 * Usage:
 *   tsx backend/scripts/remove-cache-expiration.ts
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('RemoveCacheExpiration');
const supabase = createSupabaseClient();

async function removeExpiration() {
    logger.info('🔄 Removing expiration from all comparisons_cache entries...\n');

    try {
        // First, check current state
        const { count: totalCount } = await supabase
            .from('comparisons_cache')
            .select('*', { count: 'exact', head: true });

        const { count: expiringCount } = await supabase
            .from('comparisons_cache')
            .select('*', { count: 'exact', head: true })
            .not('expires_at', 'is', null);

        logger.info(`📊 Current state:`);
        logger.info(`   Total entries: ${totalCount || 0}`);
        logger.info(`   Entries with expiration: ${expiringCount || 0}`);
        logger.info(`   Entries without expiration: ${(totalCount || 0) - (expiringCount || 0)}\n`);

        if (expiringCount === 0) {
            logger.info('✅ All entries already have no expiration!');
            return;
        }

        // Update all entries to remove expiration
        const { data, error } = await supabase
            .from('comparisons_cache')
            .update({ expires_at: null })
            .not('expires_at', 'is', null)
            .select('id');

        if (error) {
            throw error;
        }

        logger.info(`✅ Successfully removed expiration from ${data?.length || 0} entries\n`);

        // Verify the update
        const { count: newExpiringCount } = await supabase
            .from('comparisons_cache')
            .select('*', { count: 'exact', head: true })
            .not('expires_at', 'is', null);

        const { count: neverExpireCount } = await supabase
            .from('comparisons_cache')
            .select('*', { count: 'exact', head: true })
            .is('expires_at', null);

        logger.info('📊 Final state:');
        logger.info(`   Total entries: ${totalCount || 0}`);
        logger.info(`   Entries with expiration: ${newExpiringCount || 0}`);
        logger.info(`   Entries without expiration: ${neverExpireCount || 0}`);
        logger.info('');

        if (newExpiringCount === 0) {
            logger.info('✅ All entries now have no expiration!');
        } else {
            logger.warn(`⚠️  Warning: ${newExpiringCount} entries still have expiration`);
        }

    } catch (error) {
        logger.error('❌ Error removing expiration:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    removeExpiration()
        .then(() => {
            logger.info('\n✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('❌ Script failed:', error);
            process.exit(1);
        });
}


