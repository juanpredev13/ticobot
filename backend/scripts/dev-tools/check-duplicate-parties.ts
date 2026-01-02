#!/usr/bin/env tsx

/**
 * Check for duplicate parties
 *
 * Usage:
 *   tsx backend/scripts/check-duplicate-parties.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('CheckDuplicateParties');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    logger.info('🔍 Checking for parties with "clase trabajadora" in name...\n');

    const { data: parties, error } = await supabase
        .from('parties')
        .select('*')
        .ilike('name', '%clase trabajadora%');

    if (error) {
        logger.error('Error fetching parties:', error);
        return;
    }

    if (!parties || parties.length === 0) {
        logger.info('No parties found with "clase trabajadora" in name');
        return;
    }

    logger.info(`Found ${parties.length} party/parties:\n`);
    parties.forEach(party => {
        logger.info(`ID: ${party.id}`);
        logger.info(`Name: ${party.name}`);
        logger.info(`Abbreviation: ${party.abbreviation}`);
        logger.info(`Slug: ${party.slug}`);
        logger.info(`Colors: ${JSON.stringify(party.colors)}`);
        logger.info(`Created: ${party.created_at}`);
        logger.info('---');
    });
}

async function main() {
    try {
        await checkDuplicates();
    } catch (error) {
        logger.error('Process failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
