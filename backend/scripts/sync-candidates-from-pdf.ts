#!/usr/bin/env tsx

/**
 * Sync candidates from PDF data
 *
 * Usage:
 *   tsx backend/scripts/sync-candidates-from-pdf.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('SyncCandidates');

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Candidate data from PDF with photo mappings
 */
const CANDIDATES_DATA = [
    { party: 'CAC', candidate: 'Claudia Dobles', photo: 'claudia.webp' },
    { party: 'Unidos Podemos', candidate: 'Natalia Díaz Quintana', photo: 'natalia.webp' },
    { party: 'Pueblo Soberano', candidate: 'Laura Fernández Delgado', photo: 'Laura.webp' },
    { party: 'PUSC', candidate: 'Juan Carlos Hidalgo', photo: 'Juan Carlos.jpg' },
    { party: 'PLN', candidate: 'Álvaro Ramos Chaves', photo: 'alvaro ramos.jpg' },
    { party: 'Avanza', candidate: 'José Aguilar', photo: 'José.webp' },
    { party: 'Progreso Social Democrático', candidate: 'Luz Mary Alpízar', photo: 'luz.webp' },
    { party: 'Esperanza Nacional', candidate: 'Claudio Alpízar', photo: 'Claudio.webp' },
    { party: 'Esperanza y Libertad', candidate: 'Marco Rodríguez', photo: 'marco.webp' },
    { party: 'Aquí Costa Rica Manda', candidate: 'Ronny Castillo', photo: 'ronny.webp' },
    { party: 'Centro Democrático y Social', candidate: 'Ana Virginia Calzada', photo: 'ana.webp' },
    { party: 'De la Clase Trabajadora', candidate: 'David Hernández', photo: 'david.jpg' },
    { party: 'Justicia Social Costarricense', candidate: 'Wálter Hernández', photo: 'walter.webp' },
    { party: 'Liberal Progresista', candidate: 'Eliécer Feinzaig', photo: 'Eliécer.webp' },
    { party: 'Nueva República', candidate: 'Fabricio Alvarado', photo: 'fabri.webp' },
    { party: 'Nueva Generación', candidate: 'Fernando Zamora', photo: 'fernando.webp' },
    { party: 'Integración Nacional', candidate: 'Luis Amador', photo: 'luis amador.webp' },
    { party: 'Unión Costarricense Democrática', candidate: 'Boris Molina', photo: 'boris.webp' },
];

/**
 * Find party by name or abbreviation
 */
async function findParty(identifier: string) {
    const { data } = await supabase
        .from('parties')
        .select('*')
        .or(`name.ilike.%${identifier}%,abbreviation.ilike.%${identifier}%`)
        .limit(1)
        .single();

    return data;
}

/**
 * Sync candidates
 */
async function syncCandidates() {
    logger.info('🔄 Syncing candidates from PDF data...\n');

    const results = {
        added: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
    };

    for (const item of CANDIDATES_DATA) {
        try {
            logger.info(`Processing ${item.candidate} (${item.party})...`);

            // Find party
            const party = await findParty(item.party);
            if (!party) {
                logger.warn(`  ⚠️  Party not found: ${item.party}`);
                results.errors.push(`${item.candidate}: Party not found`);
                continue;
            }

            // Create slug from candidate name
            const slug = item.candidate
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/\s+/g, '-');

            const candidateData = {
                party_id: party.id,
                name: item.candidate,
                slug,
                position: 'Candidato a Presidente',
                photo_url: `/candidatos/${item.photo}`,
            };

            // Check if candidate exists
            const { data: existing } = await supabase
                .from('candidates')
                .select('*')
                .eq('party_id', party.id)
                .eq('position', 'Candidato a Presidente')
                .single();

            if (existing) {
                // Update existing candidate
                const { error } = await supabase
                    .from('candidates')
                    .update(candidateData)
                    .eq('id', existing.id);

                if (error) {
                    logger.error(`  ❌ Error updating: ${error.message}`);
                    results.errors.push(`${item.candidate}: ${error.message}`);
                } else {
                    logger.info(`  ✅ Updated`);
                    results.updated++;
                }
            } else {
                // Insert new candidate
                const { error } = await supabase
                    .from('candidates')
                    .insert(candidateData);

                if (error) {
                    logger.error(`  ❌ Error adding: ${error.message}`);
                    results.errors.push(`${item.candidate}: ${error.message}`);
                } else {
                    logger.info(`  ✅ Added`);
                    results.added++;
                }
            }
        } catch (error) {
            logger.error(`  ❌ Failed: ${error}`);
            results.errors.push(`${item.candidate}: ${error}`);
        }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`✅ Added: ${results.added}`);
    logger.info(`🔄 Updated: ${results.updated}`);
    logger.info(`⚠️  Skipped: ${results.skipped}`);
    logger.info(`❌ Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
        logger.info('\nErrors:');
        results.errors.forEach(err => logger.info(`  - ${err}`));
    }

    logger.info('='.repeat(60));
}

async function main() {
    logger.info('🔧 Sync Candidates from PDF');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        await syncCandidates();
        logger.info('\n✅ Process completed');
    } catch (error) {
        logger.error('Process failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
