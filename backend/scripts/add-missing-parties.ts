#!/usr/bin/env tsx

/**
 * Add Missing Parties to parties table
 * 
 * This script adds parties that exist in documents table but are missing
 * from the parties table. Specifically focuses on FA (Frente Amplio) and others.
 * 
 * Usage:
 *   tsx backend/scripts/add-missing-parties.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('AddMissingParties');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Party data for missing parties
 * Based on document party_ids that don't exist in parties table
 */
const MISSING_PARTIES = [
    {
        name: 'Frente Amplio',
        abbreviation: 'FA',
        slug: 'frente-amplio',
        colors: {
            primary: '#E63946', // Red
            secondary: '#F1FAEE'
        },
        description: 'Partido político costarricense de izquierda',
    },
    {
        name: 'Aquí Costa Rica Manda',
        abbreviation: 'ACRM',
        slug: 'aqui-costa-rica-manda',
        colors: {
            primary: '#457B9D',
            secondary: '#A8DADC'
        },
    },
    {
        name: 'Partido Avanza',
        abbreviation: 'PA',
        slug: 'partido-avanza',
        colors: {
            primary: '#1D3557',
            secondary: '#F1FAEE'
        },
    },
    {
        name: 'Partido de la Clase Trabajadora',
        abbreviation: 'PDLCT',
        slug: 'partido-de-la-clase-trabajadora',
        colors: {
            primary: '#E63946',
            secondary: '#FFB703'
        },
    },
    {
        name: 'Esperanza y Libertad',
        abbreviation: 'PEL',
        slug: 'esperanza-y-libertad',
        colors: {
            primary: '#023047',
            secondary: '#8ECAE6'
        },
    },
    {
        name: 'Esperanza Nacional',
        abbreviation: 'PEN',
        slug: 'esperanza-nacional',
        colors: {
            primary: '#219EBC',
            secondary: '#FFB703'
        },
    },
    {
        name: 'Integración Nacional',
        abbreviation: 'PIN',
        slug: 'integracion-nacional',
        colors: {
            primary: '#126782',
            secondary: '#A8DADC'
        },
    },
    {
        name: 'Justicia Social Costarricense',
        abbreviation: 'PJSC',
        slug: 'justicia-social-costarricense',
        colors: {
            primary: '#1D3557',
            secondary: '#E63946'
        },
    },
    {
        name: 'Liberal Progresista',
        abbreviation: 'PLP',
        slug: 'liberal-progresista',
        colors: {
            primary: '#023047',
            secondary: '#FFB703'
        },
    },
    {
        name: 'Nueva Generación',
        abbreviation: 'PNG',
        slug: 'nueva-generacion',
        colors: {
            primary: '#219EBC',
            secondary: '#8ECAE6'
        },
    },
    {
        name: 'Nueva República',
        abbreviation: 'PNR',
        slug: 'nueva-republica',
        colors: {
            primary: '#126782',
            secondary: '#A8DADC'
        },
    },
    {
        name: 'Pueblo Soberano',
        abbreviation: 'PPSO',
        slug: 'pueblo-soberano',
        colors: {
            primary: '#1D3557',
            secondary: '#E63946'
        },
    },
    {
        name: 'Unión Costarricense Democrática',
        abbreviation: 'PUCD',
        slug: 'union-costarricense-democratica',
        colors: {
            primary: '#023047',
            secondary: '#FFB703'
        },
    },
];

/**
 * Check which parties are missing
 */
async function checkMissingParties() {
    logger.info('🔍 Checking which parties are missing...\n');

    const { data: existingParties } = await supabase
        .from('parties')
        .select('abbreviation');

    if (!existingParties) {
        logger.error('Could not fetch existing parties');
        return [];
    }

    const existingAbbrevs = new Set(
        existingParties
            .map(p => p.abbreviation)
            .filter(Boolean)
    );

    const missing = MISSING_PARTIES.filter(
        party => !existingAbbrevs.has(party.abbreviation)
    );

    logger.info(`Found ${missing.length} missing party/parties:\n`);
    missing.forEach(party => {
        logger.info(`  - ${party.name} (${party.abbreviation})`);
    });

    return missing;
}

/**
 * Add missing parties
 */
async function addMissingParties() {
    logger.info('\n📝 Adding missing parties...\n');

    const missing = await checkMissingParties();

    if (missing.length === 0) {
        logger.info('✅ All parties already exist in parties table');
        return;
    }

    const results = [];

    for (const party of missing) {
        try {
            logger.info(`Adding ${party.name} (${party.abbreviation})...`);

            const { data, error } = await supabase
                .from('parties')
                .insert({
                    name: party.name,
                    abbreviation: party.abbreviation,
                    slug: party.slug,
                    colors: party.colors,
                    description: party.description || null,
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    logger.warn(`  ⚠️  ${party.name} already exists (unique constraint)`);
                    results.push({ party: party.name, status: 'exists' });
                } else {
                    logger.error(`  ❌ Error: ${error.message}`);
                    results.push({ party: party.name, status: 'error', error: error.message });
                }
            } else {
                logger.info(`  ✅ Added successfully`);
                results.push({ party: party.name, status: 'added' });
            }
        } catch (error) {
            logger.error(`  ❌ Failed to add ${party.name}:`, error);
            results.push({ 
                party: party.name, 
                status: 'error', 
                error: error instanceof Error ? error.message : String(error) 
            });
        }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 SUMMARY');
    logger.info('='.repeat(60));
    
    const added = results.filter(r => r.status === 'added').length;
    const exists = results.filter(r => r.status === 'exists').length;
    const errors = results.filter(r => r.status === 'error').length;

    logger.info(`✅ Added: ${added}`);
    logger.info(`⚠️  Already exists: ${exists}`);
    logger.info(`❌ Errors: ${errors}`);

    if (errors > 0) {
        logger.info('\nParties with errors:');
        results
            .filter(r => r.status === 'error')
            .forEach(r => {
                logger.info(`  - ${r.party}: ${r.error}`);
            });
    }

    logger.info('='.repeat(60));
}

/**
 * Main function
 */
async function main() {
    logger.info('🔧 Add Missing Parties');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        await addMissingParties();
        logger.info('\n✅ Process completed');
    } catch (error) {
        logger.error('Process failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

