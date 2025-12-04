#!/usr/bin/env tsx
/**
 * Check Supabase Tables Script
 *
 * This script shows you what tables exist and their current data counts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking Supabase Tables\n');
  console.log(`📍 Database: ${supabaseUrl}\n`);
  console.log('─'.repeat(60));

  // Check documents table
  const { count: docCount, error: docError } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });

  console.log('\n📄 DOCUMENTS TABLE:');
  if (docError) {
    console.log(`   ❌ Error: ${docError.message}`);
  } else {
    console.log(`   ✅ Exists`);
    console.log(`   📊 Row count: ${docCount || 0}`);
  }

  // Check chunks table
  const { count: chunkCount, error: chunkError } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  console.log('\n🧩 CHUNKS TABLE:');
  if (chunkError) {
    console.log(`   ❌ Error: ${chunkError.message}`);
  } else {
    console.log(`   ✅ Exists`);
    console.log(`   📊 Row count: ${chunkCount || 0}`);
  }

  // Check document_stats view
  const { count: statsCount, error: statsError } = await supabase
    .from('document_stats')
    .select('*', { count: 'exact', head: true });

  console.log('\n📈 DOCUMENT_STATS VIEW:');
  if (statsError) {
    console.log(`   ❌ Error: ${statsError.message}`);
  } else {
    console.log(`   ✅ Exists`);
    console.log(`   📊 Row count: ${statsCount || 0}`);
  }

  console.log('\n' + '─'.repeat(60));

  // Show sample data if any exists
  if (docCount && docCount > 0) {
    console.log('\n📋 Sample Documents:');
    const { data: docs } = await supabase
      .from('documents')
      .select('document_id, title, party_name, page_count')
      .limit(5);

    if (docs && docs.length > 0) {
      docs.forEach((doc, i) => {
        console.log(`\n   ${i + 1}. ${doc.title}`);
        console.log(`      Party: ${doc.party_name}`);
        console.log(`      ID: ${doc.document_id}`);
        console.log(`      Pages: ${doc.page_count || 'N/A'}`);
      });
    }
  } else {
    console.log('\n💡 No data yet. Run the ingestion pipeline to populate the database.');
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n🌐 View in Supabase Dashboard:');
  console.log(`   ${supabaseUrl.replace('//', '//app.')}/project/_/editor`);
  console.log('\n');
}

checkTables();
