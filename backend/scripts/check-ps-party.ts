import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Check parties with PS, PPSO, or Soberano
  const { data: parties, error: partiesError } = await supabase
    .from('parties')
    .select('id, name, abbreviation, slug')
    .or('slug.ilike.%soberano%,abbreviation.in.(PS,PPSO),name.ilike.%soberano%,name.ilike.%progreso%');

  console.log('=== PARTIES ===');
  if (partiesError) console.error('Error:', partiesError);
  else console.log(JSON.stringify(parties, null, 2));

  // Check documents - get unique party_ids
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id, title, party_id');

  console.log('\n=== ALL DOCUMENTS party_id values ===');
  if (docsError) console.error('Error:', docsError);
  else {
    const partyIds = [...new Set(docs?.map(d => d.party_id))];
    console.log('Unique party_ids:', partyIds);

    // Show documents with non-UUID party_ids
    const nonUuidDocs = docs?.filter(d => d.party_id && !d.party_id.includes('-'));
    if (nonUuidDocs && nonUuidDocs.length > 0) {
      console.log('\n=== DOCUMENTS with TEXT party_id (not UUID) ===');
      console.log(JSON.stringify(nonUuidDocs, null, 2));
    }
  }

  // Find Pueblo Soberano party
  const { data: psParty } = await supabase
    .from('parties')
    .select('*')
    .eq('slug', 'pueblo-soberano')
    .single();

  if (psParty) {
    console.log('\n=== PUEBLO SOBERANO PARTY ===');
    console.log(JSON.stringify(psParty, null, 2));

    // Check documents for this party
    const { data: psDocs } = await supabase
      .from('documents')
      .select('id, title, party_id')
      .eq('party_id', psParty.id);

    console.log('\n=== DOCUMENTS for Pueblo Soberano (by UUID) ===');
    console.log(`Found ${psDocs?.length || 0} documents`);
    if (psDocs) console.log(JSON.stringify(psDocs, null, 2));
  }
}

check().catch(console.error);
