#!/usr/bin/env tsx

/**
 * Fix Costa Rica Primero candidate
 *
 * Usage:
 *   tsx backend/scripts/fix-cr1-candidate.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('FixCR1Candidate');

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCandidate() {
    logger.info('🔧 Fixing Costa Rica Primero candidate...\n');

    // Find Costa Rica Primero party
    const { data: party } = await supabase
        .from('parties')
        .select('*')
        .eq('slug', 'costa-rica-primero')
        .single();

    if (!party) {
        logger.error('❌ Costa Rica Primero party not found');
        return false;
    }

    logger.info(`Found party: ${party.name} (${party.abbreviation})`);

    const candidateData = {
        name: 'Douglas Caamaño Quirós',
        slug: 'douglas-caamano-quiros',
        position: 'Candidato a Presidente',
        photo_url: '/candidatos/douglas.webp',
    };

    // Update existing candidate
    const { error } = await supabase
        .from('candidates')
        .update(candidateData)
        .eq('party_id', party.id)
        .eq('position', 'Candidato a Presidente');

    if (error) {
        logger.error(`❌ Error updating candidate: ${error.message}`);
        return false;
    }

    logger.info('✅ Successfully updated to Douglas Caamaño Quirós');
    logger.info(`   Photo: ${candidateData.photo_url}`);
    return true;
}

async function main() {
    logger.info('🔧 Fix Costa Rica Primero Candidate');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        const success = await fixCandidate();

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
