/**
 * Script to check if chat_cache table exists and test cache functionality
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { ChatCacheService } from '../src/db/services/chat-cache.service.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('ChatCacheCheck');

async function checkCache() {
    try {
        const supabase = createSupabaseClient();
        const cacheService = new ChatCacheService(supabase);

        // Check if table exists
        logger.info('Checking if chat_cache table exists...');
        const { data, error } = await supabase
            .from('chat_cache')
            .select('id')
            .limit(1);

        if (error) {
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                logger.error('❌ chat_cache table does NOT exist!');
                logger.error('');
                logger.error('Please run the migration:');
                logger.error('   backend/supabase/migrations/20250115000001_create_chat_cache.sql');
                logger.error('');
                logger.error('You can execute it:');
                logger.error('   1. In Supabase Dashboard → SQL Editor');
                logger.error('   2. Or using Supabase CLI: npx supabase db push');
                return;
            } else {
                logger.error('Error checking table:', error);
                return;
            }
        }

        logger.info('✅ chat_cache table exists!');

        // Check cache stats
        logger.info('');
        logger.info('Checking cache statistics...');
        const stats = await cacheService.getStats();
        logger.info(`   Total entries: ${stats.total}`);
        logger.info(`   Expired entries: ${stats.expired}`);
        logger.info(`   Never expires: ${stats.neverExpires}`);

        // Test cache with a sample question
        logger.info('');
        logger.info('Testing cache with sample question...');
        const testQuestion = '¿Qué proponen los partidos sobre educación superior?';
        
        const cached = await cacheService.getCached(testQuestion);
        if (cached) {
            logger.info(`✅ Cache HIT for test question`);
            logger.info(`   Answer length: ${cached.answer.length} chars`);
            logger.info(`   Sources: ${cached.sources.length}`);
        } else {
            logger.info(`❌ Cache MISS for test question`);
            logger.info('   This is expected if the question was never asked before');
        }

        // List recent cache entries
        logger.info('');
        logger.info('Recent cache entries (last 5):');
        const { data: recentEntries, error: recentError } = await supabase
            .from('chat_cache')
            .select('question, party, created_at, expires_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            logger.warn('Error fetching recent entries:', recentError);
        } else if (recentEntries && recentEntries.length > 0) {
            recentEntries.forEach((entry, index) => {
                logger.info(`   ${index + 1}. "${entry.question.substring(0, 50)}..." (party: ${entry.party || 'all'})`);
                logger.info(`      Created: ${new Date(entry.created_at).toLocaleString()}`);
                if (entry.expires_at) {
                    logger.info(`      Expires: ${new Date(entry.expires_at).toLocaleString()}`);
                } else {
                    logger.info(`      Expires: Never`);
                }
            });
        } else {
            logger.info('   No cache entries found');
        }

    } catch (error) {
        logger.error('Check failed:', error);
        process.exit(1);
    }
}

checkCache();

