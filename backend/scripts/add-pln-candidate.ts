#!/usr/bin/env tsx

/**
 * Add Álvaro Ramos as PLN presidential candidate
 *
 * Usage:
 *   tsx backend/scripts/add-pln-candidate.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('AddPLNCandidate');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PLN_PARTY_ID = '0c2ee9fd-3b2f-4212-91a6-07b737881640';

const CANDIDATE_DATA = {
    party_id: PLN_PARTY_ID,
    name: 'Álvaro Ramos',
    slug: 'alvaro-ramos',
    position: 'Candidato a Presidente',
    photo_url: '/candidatos/alvaro ramos.jpg',
};

async function addCandidate() {
    logger.info('👤 Adding Álvaro Ramos as PLN presidential candidate...\n');

    try {
        // Check if candidate already exists
        const { data: existing } = await supabase
            .from('candidates')
            .select('*')
            .eq('slug', CANDIDATE_DATA.slug)
            .single();

        if (existing) {
            logger.warn('⚠️  Candidate already exists. Updating instead...');

            const { data, error } = await supabase
                .from('candidates')
                .update(CANDIDATE_DATA)
                .eq('slug', CANDIDATE_DATA.slug)
                .select()
                .single();

            if (error) {
                logger.error(`❌ Error updating candidate: ${error.message}`);
                return false;
            }

            logger.info('✅ Successfully updated Álvaro Ramos');
            return true;
        }

        // Insert new candidate
        const { data, error } = await supabase
            .from('candidates')
            .insert(CANDIDATE_DATA)
            .select()
            .single();

        if (error) {
            logger.error(`❌ Error adding candidate: ${error.message}`);
            return false;
        }

        logger.info('✅ Successfully added Álvaro Ramos as PLN presidential candidate');
        logger.info(`   Photo: ${CANDIDATE_DATA.photo_url}`);
        return true;
    } catch (error) {
        logger.error('❌ Failed to add candidate:', error);
        return false;
    }
}

async function main() {
    logger.info('🔧 Add PLN Presidential Candidate');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        const success = await addCandidate();

        if (success) {
            logger.info('\n' + '='.repeat(60));
            logger.info('✅ Process completed successfully');
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
