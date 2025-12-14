/**
 * Script to run hybrid search migration
 * Executes the SQL migration file in Supabase
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { readFile } from 'fs/promises';
import { Logger } from '@ticobot/shared';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const logger = new Logger('MigrationRunner');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    try {
        logger.info('Running hybrid search migration...');

        const supabase = createSupabaseClient();

        // Read migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20251215000001_hybrid_search.sql');
        const sql = await readFile(migrationPath, 'utf-8');

        logger.info(`Migration file loaded: ${migrationPath}`);
        logger.info(`SQL length: ${sql.length} characters`);

        // Execute migration using rpc (raw SQL)
        // Note: Supabase client doesn't have direct SQL execution,
        // so we'll execute it in parts or use the SQL editor in dashboard

        logger.warn('⚠️  Please execute the migration manually:');
        logger.info('1. Go to Supabase Dashboard → SQL Editor');
        logger.info('2. Copy the contents of:');
        logger.info(`   ${migrationPath}`);
        logger.info('3. Paste and run in SQL Editor');
        logger.info('');
        logger.info('OR use the Supabase CLI:');
        logger.info('   supabase db push');
        logger.info('');

        // Check if hybrid_search function exists
        const { data, error } = await supabase.rpc('hybrid_search_stats' as any);

        if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                logger.warn('❌ hybrid_search not yet installed');
                logger.info('📋 Migration needs to be applied');
            } else {
                logger.error('Error checking migration status:', error);
            }
        } else {
            logger.info('✅ Hybrid search is already installed!');
            logger.info(`Stats: ${JSON.stringify(data, null, 2)}`);
        }

    } catch (error) {
        logger.error('Migration check failed:', error);
        process.exit(1);
    }
}

runMigration();
