#!/usr/bin/env tsx

/**
 * List all parties with their slugs
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('ListAllParties');
const supabase = createSupabaseClient();

async function listAllParties() {
    logger.info('📋 Listing all parties...\n');

    try {
        const { data: parties, error } = await supabase
            .from('parties')
            .select('id, name, abbreviation, slug')
            .order('name', { ascending: true });

        if (error) {
            logger.error('❌ Error:', error);
            return;
        }

        logger.info(`Found ${parties?.length || 0} parties:\n`);
        parties?.forEach((p, i) => {
            logger.info(`${i + 1}. ${p.abbreviation || 'N/A'} - ${p.name} (slug: ${p.slug})`);
        });

        // Check for the top 5 we need
        const requiredSlugs = ['pln', 'cac', 'pueblo-soberano', 'fa', 'pusc'];
        logger.info('\n🔍 Checking required top 5 parties:');
        requiredSlugs.forEach(slug => {
            const party = parties?.find(p => p.slug === slug);
            if (party) {
                logger.info(`  ✅ ${slug} - ${party.abbreviation || party.name}`);
            } else {
                logger.error(`  ❌ ${slug} - NOT FOUND`);
            }
        });

    } catch (error) {
        logger.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    listAllParties()
        .then(() => process.exit(0))
        .catch((error) => {
            logger.error('❌ Script failed:', error);
            process.exit(1);
        });
}


