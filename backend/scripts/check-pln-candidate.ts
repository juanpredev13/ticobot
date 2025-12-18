#!/usr/bin/env tsx

/**
 * Check PLN candidates
 *
 * Usage:
 *   tsx backend/scripts/check-pln-candidate.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('CheckPLNCandidates');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPLN() {
    logger.info('🔍 Checking PLN party and candidates...\n');

    // Find PLN party
    const { data: parties, error: partyError } = await supabase
        .from('parties')
        .select('*')
        .or('abbreviation.eq.PLN,name.ilike.%liberación nacional%');

    if (partyError) {
        logger.error('Error fetching PLN:', partyError);
        return;
    }

    if (!parties || parties.length === 0) {
        logger.info('❌ PLN party not found in database');
        return;
    }

    logger.info(`Found ${parties.length} PLN party/parties:\n`);
    parties.forEach(party => {
        logger.info(`ID: ${party.id}`);
        logger.info(`Name: ${party.name}`);
        logger.info(`Abbreviation: ${party.abbreviation}`);
        logger.info(`Slug: ${party.slug}`);
        logger.info('---\n');
    });

    // Check candidates for PLN
    for (const party of parties) {
        logger.info(`\n📋 Checking candidates for ${party.name}...\n`);

        const { data: candidates, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('party_id', party.id);

        if (candidateError) {
            logger.error('Error fetching candidates:', candidateError);
            continue;
        }

        if (!candidates || candidates.length === 0) {
            logger.info(`❌ No candidates found for ${party.name}`);
            continue;
        }

        logger.info(`Found ${candidates.length} candidate(s):\n`);
        candidates.forEach(candidate => {
            logger.info(`Name: ${candidate.name}`);
            logger.info(`Position: ${candidate.position}`);
            logger.info(`Photo URL: ${candidate.photo_url || 'No photo'}`);
            logger.info(`Slug: ${candidate.slug}`);
            logger.info('---');
        });
    }
}

async function main() {
    try {
        await checkPLN();
    } catch (error) {
        logger.error('Process failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
