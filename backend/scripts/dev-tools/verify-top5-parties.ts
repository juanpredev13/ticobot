#!/usr/bin/env tsx

/**
 * Verify top 5 parties order
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { PartiesService } from '../src/db/services/parties.service.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('VerifyTop5Parties');
const supabase = createSupabaseClient();

async function verifyTop5() {
    logger.info('🔍 Verifying top 5 parties order...\n');

    try {
        const service = new PartiesService(supabase);
        const parties = await service.findAll();

        logger.info('Top 5 parties (should be: PLN, CAC, PS, FA, PUSC):\n');
        parties.slice(0, 5).forEach((p, i) => {
            logger.info(`${i + 1}. ${p.abbreviation || p.slug.toUpperCase()} - ${p.name}`);
        });

        const expectedOrder = ['liberacion-nacional', 'coalicion-agenda-ciudadana', 'pueblo-soberano', 'frente-amplio', 'unidad-social-cristiana'];
        const actualOrder = parties.slice(0, 5).map(p => p.slug);

        const isCorrect = expectedOrder.every((slug, idx) => actualOrder[idx] === slug);
        
        if (isCorrect) {
            logger.info('\n✅ Order is correct!');
        } else {
            logger.error('\n❌ Order is incorrect!');
            logger.error(`Expected: ${expectedOrder.join(', ')}`);
            logger.error(`Actual: ${actualOrder.join(', ')}`);
        }

    } catch (error) {
        logger.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyTop5()
        .then(() => process.exit(0))
        .catch((error) => {
            logger.error('❌ Script failed:', error);
            process.exit(1);
        });
}

