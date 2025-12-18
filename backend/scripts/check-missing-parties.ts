#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('CheckMissingParties');

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const partiesToCheck = ['CAC', 'Frente Amplio', 'Costa Rica Primero'];

for (const party of partiesToCheck) {
    logger.info(`\nChecking: ${party}`);
    const { data } = await supabase
        .from('parties')
        .select('id, name, abbreviation, slug')
        .or(`name.ilike.%${party}%,abbreviation.ilike.%${party}%`);

    if (!data || data.length === 0) {
        logger.warn(`  ❌ Not found`);
    } else {
        logger.info(`  ✅ Found:`);
        data.forEach(p => {
            logger.info(`     - ${p.name} (${p.abbreviation}) - ${p.slug}`);
        });
    }
}
