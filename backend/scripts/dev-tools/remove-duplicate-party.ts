#!/usr/bin/env tsx

/**
 * Remove duplicate party "De la Clase Trabajadora"
 *
 * Usage:
 *   tsx backend/scripts/remove-duplicate-party.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('RemoveDuplicateParty');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DUPLICATE_PARTY_ID = '4042b041-ff12-4255-8887-e40f63fcc466'; // "De la Clase Trabajadora"
const DUPLICATE_PARTY_NAME = 'De la Clase Trabajadora';

async function removeDuplicate() {
    logger.info('🗑️  Removing duplicate party...\n');
    logger.info(`Party to remove: ${DUPLICATE_PARTY_NAME}`);
    logger.info(`ID: ${DUPLICATE_PARTY_ID}\n`);

    try {
        // Delete the party
        const { error } = await supabase
            .from('parties')
            .delete()
            .eq('id', DUPLICATE_PARTY_ID);

        if (error) {
            logger.error(`❌ Error deleting party: ${error.message}`);
            return false;
        }

        logger.info(`✅ Successfully deleted "${DUPLICATE_PARTY_NAME}"`);
        return true;
    } catch (error) {
        logger.error('❌ Failed to delete party:', error);
        return false;
    }
}

async function main() {
    logger.info('🔧 Remove Duplicate Party');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        const success = await removeDuplicate();

        if (success) {
            logger.info('\n✅ Process completed successfully');
        } else {
            logger.error('\n❌ Process completed with errors');
            process.exit(1);
        }
    } catch (error) {
        logger.error('Process failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
