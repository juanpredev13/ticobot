#!/usr/bin/env tsx

/**
 * Add missing presidential candidates
 *
 * Usage:
 *   tsx backend/scripts/add-missing-candidates.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('AddMissingCandidates');

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CANDIDATES = [
    {
        partySlug: 'frente-amplio',
        partyName: 'Frente Amplio',
        candidateName: 'Ariel Robles',
        photo: 'ariel.jpeg'
    },
    {
        partySlug: 'costa-rica-primero',
        partyName: 'Costa Rica Primero',
        candidateName: 'Carlos Moya Bonilla',
        photo: null // No photo available
    }
];

async function addCandidates() {
    logger.info('👥 Adding missing presidential candidates...\n');

    const results = {
        added: 0,
        updated: 0,
        errors: [] as string[]
    };

    for (const item of CANDIDATES) {
        try {
            logger.info(`Processing ${item.candidateName} (${item.partyName})...`);

            // Find party
            const { data: party } = await supabase
                .from('parties')
                .select('*')
                .eq('slug', item.partySlug)
                .single();

            if (!party) {
                logger.error(`  ❌ Party not found: ${item.partyName}`);
                results.errors.push(`${item.candidateName}: Party not found`);
                continue;
            }

            // Create slug
            const slug = item.candidateName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-');

            const candidateData = {
                party_id: party.id,
                name: item.candidateName,
                slug,
                position: 'Candidato a Presidente',
                photo_url: item.photo ? `/candidatos/${item.photo}` : null,
            };

            // Check if candidate exists
            const { data: existing } = await supabase
                .from('candidates')
                .select('*')
                .eq('party_id', party.id)
                .eq('position', 'Candidato a Presidente')
                .single();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('candidates')
                    .update(candidateData)
                    .eq('id', existing.id);

                if (error) {
                    logger.error(`  ❌ Error updating: ${error.message}`);
                    results.errors.push(`${item.candidateName}: ${error.message}`);
                } else {
                    logger.info('  ✅ Updated');
                    results.updated++;
                }
            } else {
                // Insert
                const { error } = await supabase
                    .from('candidates')
                    .insert(candidateData);

                if (error) {
                    logger.error(`  ❌ Error adding: ${error.message}`);
                    results.errors.push(`${item.candidateName}: ${error.message}`);
                } else {
                    logger.info('  ✅ Added');
                    results.added++;
                }
            }
        } catch (error) {
            logger.error(`  ❌ Failed: ${error}`);
            results.errors.push(`${item.candidateName}: ${error}`);
        }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`✅ Added: ${results.added}`);
    logger.info(`🔄 Updated: ${results.updated}`);
    logger.info(`❌ Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
        logger.info('\nErrors:');
        results.errors.forEach(err => logger.info(`  - ${err}`));
    }

    logger.info('='.repeat(60));
}

async function main() {
    logger.info('🔧 Add Missing Presidential Candidates');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        await addCandidates();
        logger.info('\n✅ Process completed');
    } catch (error) {
        logger.error('Process failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
