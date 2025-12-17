/**
 * Script to run chat cache migration
 * Executes the SQL migration file in Supabase
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { readFile } from 'fs/promises';
import { Logger } from '@ticobot/shared';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const logger = new Logger('ChatCacheMigration');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    try {
        logger.info('Running chat cache migration...');

        const supabase = createSupabaseClient();

        // Read migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20250115000001_create_chat_cache.sql');
        const sql = await readFile(migrationPath, 'utf-8');

        logger.info(`Migration file loaded: ${migrationPath}`);
        logger.info(`SQL length: ${sql.length} characters`);

        // Supabase JS client doesn't support raw SQL execution directly
        // We need to use the Supabase SQL Editor or CLI
        logger.warn('⚠️  Supabase JS client cannot execute raw SQL directly');
        logger.info('');
        logger.info('Please execute the migration using one of these methods:');
        logger.info('');
        logger.info('📋 Option 1: Supabase Dashboard (Recommended)');
        logger.info('   1. Go to https://app.supabase.com');
        logger.info('   2. Select your project');
        logger.info('   3. Go to SQL Editor');
        logger.info('   4. Copy the contents of:');
        logger.info(`      ${migrationPath}`);
        logger.info('   5. Paste and run in SQL Editor');
        logger.info('');
        logger.info('📋 Option 2: Supabase CLI');
        logger.info('   cd backend');
        logger.info('   npx supabase db push');
        logger.info('');
        logger.info('📋 Option 3: PostgreSQL client');
        logger.info('   psql "postgresql://postgres:[PASSWORD]@[PROJECT-ID].supabase.co:5432/postgres"');
        logger.info(`   \\i ${migrationPath}`);
        logger.info('');

        // Check if chat_cache table exists
        const { data, error } = await supabase
            .from('chat_cache')
            .select('id')
            .limit(1);

        if (!error && data !== null) {
            logger.info('✅ chat_cache table already exists!');
            logger.info('   Migration may have already been applied.');
        } else {
            if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                logger.info('📋 Migration needs to be applied');
                logger.info('   The chat_cache table does not exist yet.');
            } else {
                logger.error('Error checking migration status:', error);
            }
        }

    } catch (error) {
        logger.error('Migration check failed:', error);
        process.exit(1);
    }
}

runMigration();

