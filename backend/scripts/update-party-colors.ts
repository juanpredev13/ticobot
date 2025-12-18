#!/usr/bin/env tsx

/**
 * Update Party Colors in Database
 *
 * This script updates the colors for specific parties in the database.
 *
 * Usage:
 *   tsx backend/scripts/update-party-colors.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('UpdatePartyColors');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Party color updates
 */
const PARTY_COLOR_UPDATES = [
    {
        slug: 'aqui-costa-rica-manda',
        name: 'Aquí Costa Rica Manda',
        colors: {
            primary: '#dc793e',
            secondary: '#263056'
        }
    },
    {
        slug: 'partido-avanza',
        name: 'Partido Avanza',
        colors: {
            primary: '#1B3F90',
            secondary: '#FF3432'
        }
    },
    {
        slug: 'frente-amplio',
        name: 'Frente Amplio',
        colors: {
            primary: '#E5C727',
            secondary: '#121212'
        }
    },
    {
        slug: 'esperanza-nacional',
        name: 'Esperanza Nacional',
        colors: {
            primary: '#005689',
            secondary: '#FFFFFF'
        }
    },
    {
        slug: 'costa-rica-primero',
        name: 'Costa Rica Primero',
        colors: {
            primary: '#EE2979',
            secondary: '#FFFFFF'
        }
    },
    {
        slug: 'esperanza-y-libertad',
        name: 'Esperanza y Libertad',
        colors: {
            primary: '#CAA705',
            secondary: '#150857'
        }
    }
];

/**
 * Update party colors
 */
async function updatePartyColors() {
    logger.info('🎨 Updating party colors...\n');

    const results = [];

    for (const update of PARTY_COLOR_UPDATES) {
        try {
            logger.info(`Updating ${update.name}...`);

            const { data, error } = await supabase
                .from('parties')
                .update({ colors: update.colors })
                .eq('slug', update.slug)
                .select();

            if (error) {
                logger.error(`  ❌ Error: ${error.message}`);
                results.push({ party: update.name, status: 'error', error: error.message });
            } else if (!data || data.length === 0) {
                logger.warn(`  ⚠️  Party not found`);
                results.push({ party: update.name, status: 'not_found' });
            } else {
                logger.info(`  ✅ Updated successfully`);
                results.push({ party: update.name, status: 'updated' });
            }
        } catch (error) {
            logger.error(`  ❌ Failed to update ${update.name}:`, error);
            results.push({
                party: update.name,
                status: 'error',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 SUMMARY');
    logger.info('='.repeat(60));

    const updated = results.filter(r => r.status === 'updated').length;
    const notFound = results.filter(r => r.status === 'not_found').length;
    const errors = results.filter(r => r.status === 'error').length;

    logger.info(`✅ Updated: ${updated}`);
    logger.info(`⚠️  Not found: ${notFound}`);
    logger.info(`❌ Errors: ${errors}`);

    if (errors > 0 || notFound > 0) {
        logger.info('\nDetails:');
        results
            .filter(r => r.status !== 'updated')
            .forEach(r => {
                logger.info(`  - ${r.party}: ${r.status}${r.error ? ` - ${r.error}` : ''}`);
            });
    }

    logger.info('='.repeat(60));
}

/**
 * Main function
 */
async function main() {
    logger.info('🔧 Update Party Colors');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        await updatePartyColors();
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
