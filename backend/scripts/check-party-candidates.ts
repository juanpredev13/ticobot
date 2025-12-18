#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('CheckPartyCandidates');

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const partySlugs = ['coalicion-agenda-ciudadana', 'frente-amplio', 'costa-rica-primero'];

for (const slug of partySlugs) {
    const { data: party } = await supabase
        .from('parties')
        .select('id, name, abbreviation')
        .eq('slug', slug)
        .single();

    if (!party) {
        logger.warn(`\n❌ Party not found: ${slug}`);
        continue;
    }

    logger.info(`\n${party.name} (${party.abbreviation}):`);

    const { data: candidates } = await supabase
        .from('candidates')
        .select('name, position, photo_url')
        .eq('party_id', party.id);

    if (!candidates || candidates.length === 0) {
        logger.warn(`  ❌ No candidates found`);
    } else {
        candidates.forEach(c => {
            logger.info(`  - ${c.name} (${c.position}) - Photo: ${c.photo_url || 'No photo'}`);
        });
    }
}
