import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('CheckChunks');

async function checkChunks() {
  const supabase = createSupabaseClient();
  const partyIds = ['PPSO', 'PA', 'CAC', 'PUSC', 'PS'];

  logger.info('First, checking documents table for party_id values:\n');

  for (const partyId of partyIds) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, document_id, party_id, party_name')
      .eq('party_id', partyId)
      .limit(1);

    if (docs && docs.length > 0) {
      logger.info(`${partyId.padEnd(6)} → Document found: ${docs[0].document_id} (UUID: ${docs[0].id})`);
    } else {
      logger.warn(`${partyId.padEnd(6)} → No document found`);
    }
  }

  logger.info('\n' + '='.repeat(80));
  logger.info('Now checking chunks:\n');

  for (const partyId of partyIds) {
    // Get document first
    const { data: docs } = await supabase
      .from('documents')
      .select('id')
      .eq('party_id', partyId)
      .limit(1);

    if (!docs || docs.length === 0) {
      logger.warn(`${partyId}: No document found`);
      continue;
    }

    const documentId = docs[0].id;

    // Now count chunks for this document
    const { count, error } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId);

    if (error) {
      logger.error(`${partyId}: Error - ${error.message}`);
    } else {
      logger.info(`${partyId.padEnd(6)}: ${count || 0} chunks`);
    }
  }
}

checkChunks().catch((error) => {
  logger.error('Error:', error);
  process.exit(1);
});
