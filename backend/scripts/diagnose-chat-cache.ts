/**
 * Script to diagnose chat cache issues
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { ChatCacheService } from '../src/db/services/chat-cache.service.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('ChatCacheDiagnostic');

async function diagnose() {
    try {
        logger.info('🔍 Diagnosing chat cache...');
        
        const supabase = createSupabaseClient();
        const cacheService = new ChatCacheService(supabase);

        // 1. Check if table exists
        logger.info('\n1. Checking if chat_cache table exists...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('chat_cache')
            .select('id')
            .limit(1);

        if (tableError) {
            if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
                logger.error('❌ Table chat_cache does NOT exist!');
                logger.error('   Please run the migration:');
                logger.error('   backend/supabase/migrations/20250115000001_create_chat_cache.sql');
                return;
            } else {
                logger.error('Error checking table:', tableError);
                return;
            }
        }

        logger.info('✅ Table chat_cache exists');

        // 2. Check cache entries
        logger.info('\n2. Checking cache entries...');
        const { count, error: countError } = await supabase
            .from('chat_cache')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            logger.error('Error counting entries:', countError);
        } else {
            logger.info(`   Total cache entries: ${count || 0}`);
        }

        // 3. Get recent entries
        logger.info('\n3. Recent cache entries:');
        const { data: recentEntries, error: entriesError } = await supabase
            .from('chat_cache')
            .select('question, party, created_at, expires_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (entriesError) {
            logger.error('Error fetching entries:', entriesError);
        } else {
            if (recentEntries && recentEntries.length > 0) {
                recentEntries.forEach((entry, idx) => {
                    logger.info(`   ${idx + 1}. "${entry.question.substring(0, 50)}..." (party: ${entry.party || 'all'})`);
                    logger.info(`      Created: ${entry.created_at}, Expires: ${entry.expires_at || 'never'}`);
                });
            } else {
                logger.info('   No cache entries found');
            }
        }

        // 4. Test cache lookup with a sample question
        logger.info('\n4. Testing cache lookup...');
        const testQuestion = '¿Qué proponen los partidos sobre educación superior y universidades públicas?';
        const cached = await cacheService.getCached(testQuestion);
        
        if (cached) {
            logger.info(`✅ Cache HIT for test question`);
            logger.info(`   Answer length: ${cached.answer.length} chars`);
            logger.info(`   Sources: ${cached.sources.length}`);
        } else {
            logger.info(`❌ Cache MISS for test question`);
            logger.info('   This question has not been cached yet');
        }

        // 5. Test cache stats
        logger.info('\n5. Cache statistics:');
        const stats = await cacheService.getStats();
        logger.info(`   Total: ${stats.total}`);
        logger.info(`   Expired: ${stats.expired}`);
        logger.info(`   Never expires: ${stats.neverExpires}`);

        logger.info('\n✅ Diagnosis complete!');

    } catch (error) {
        logger.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();

