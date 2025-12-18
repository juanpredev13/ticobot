#!/usr/bin/env tsx

/**
 * Fix Avanza duplicate and update colors
 *
 * Usage:
 *   tsx backend/scripts/fix-avanza-duplicate.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('FixAvanzaDuplicate');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DUPLICATE_ID = '4990637e-d33d-47f0-8052-a09485e54a8b'; // "Avanza" (AVAN)
const CORRECT_ID = '58829b90-ed7e-4b37-9439-2cf0363bcfd1'; // "Partido Avanza" (PA)

async function fixAvanza() {
    logger.info('🔧 Fixing Avanza duplicate...\n');

    // Step 1: Delete duplicate "Avanza" (AVAN)
    logger.info('Step 1: Deleting duplicate "Avanza" (AVAN)...');
    try {
        const { error: deleteError } = await supabase
            .from('parties')
            .delete()
            .eq('id', DUPLICATE_ID);

        if (deleteError) {
            logger.error(`❌ Error deleting duplicate: ${deleteError.message}`);
            return false;
        }

        logger.info('✅ Successfully deleted duplicate "Avanza" (AVAN)\n');
    } catch (error) {
        logger.error('❌ Failed to delete duplicate:', error);
        return false;
    }

    // Step 2: Update colors for "Partido Avanza" (PA)
    logger.info('Step 2: Updating colors for "Partido Avanza" (PA)...');
    try {
        const { error: updateError } = await supabase
            .from('parties')
            .update({
                colors: {
                    primary: '#009ee0',
                    secondary: '#263056'
                }
            })
            .eq('id', CORRECT_ID);

        if (updateError) {
            logger.error(`❌ Error updating colors: ${updateError.message}`);
            return false;
        }

        logger.info('✅ Successfully updated colors for "Partido Avanza" (PA)\n');
    } catch (error) {
        logger.error('❌ Failed to update colors:', error);
        return false;
    }

    return true;
}

async function main() {
    logger.info('🔧 Fix Avanza Duplicate');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        const success = await fixAvanza();

        if (success) {
            logger.info('='.repeat(60));
            logger.info('✅ Process completed successfully');
            logger.info('   - Deleted: "Avanza" (AVAN)');
            logger.info('   - Updated: "Partido Avanza" (PA) colors to #009ee0 / #263056');
            logger.info('='.repeat(60));
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
