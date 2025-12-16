#!/usr/bin/env tsx

/**
 * Check Database for Party Information
 * 
 * This script queries the database to see what party information exists
 * for CR1, UNKNOWN, or unknown-2026
 * 
 * Usage:
 *   tsx backend/scripts/check-database-party.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('CheckDatabaseParty');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check all documents
 */
async function checkAllDocuments() {
    logger.info('📋 Checking all documents in database...\n');

    const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Error querying documents:', error);
        return;
    }

    if (!documents || documents.length === 0) {
        logger.warn('No documents found in database');
        return;
    }

    logger.info(`Found ${documents.length} document(s):\n`);
    
    documents.forEach((doc, index) => {
        logger.info(`${index + 1}. Document:`);
        logger.info(`   document_id: ${doc.document_id}`);
        logger.info(`   title: ${doc.title}`);
        logger.info(`   party_id: ${doc.party_id}`);
        logger.info(`   party_name: ${doc.party_name}`);
        logger.info(`   page_count: ${doc.page_count}`);
        logger.info(`   url: ${doc.url}`);
        logger.info('');
    });
}

/**
 * Check specific document IDs
 */
async function checkSpecificDocuments() {
    logger.info('🔍 Checking for specific document IDs...\n');

    const documentIds = ['unknown-2026', 'cr1-2026'];
    
    for (const docId of documentIds) {
        logger.info(`Checking document_id: ${docId}`);
        
        const { data: documents, error } = await supabase
            .from('documents')
            .select('*')
            .eq('document_id', docId);

        if (error) {
            logger.error(`Error querying ${docId}:`, error);
            continue;
        }

        if (!documents || documents.length === 0) {
            logger.warn(`  ❌ Not found`);
        } else {
            documents.forEach((doc) => {
                logger.info(`  ✅ Found:`);
                logger.info(`     id: ${doc.id}`);
                logger.info(`     document_id: ${doc.document_id}`);
                logger.info(`     title: ${doc.title}`);
                logger.info(`     party_id: ${doc.party_id}`);
                logger.info(`     party_name: ${doc.party_name}`);
            });
        }
        logger.info('');
    }
}

/**
 * Check by party_id
 */
async function checkByPartyId() {
    logger.info('🔍 Checking by party_id...\n');

    const partyIds = ['UNKNOWN', 'CR1', 'unknown', 'cr1'];
    
    for (const partyId of partyIds) {
        logger.info(`Checking party_id: ${partyId}`);
        
        const { data: documents, error } = await supabase
            .from('documents')
            .select('*')
            .eq('party_id', partyId);

        if (error) {
            logger.error(`Error querying party_id ${partyId}:`, error);
            continue;
        }

        if (!documents || documents.length === 0) {
            logger.warn(`  ❌ No documents found with party_id: ${partyId}`);
        } else {
            logger.info(`  ✅ Found ${documents.length} document(s):`);
            documents.forEach((doc) => {
                logger.info(`     - ${doc.document_id} (${doc.title})`);
            });
        }
        logger.info('');
    }
}

/**
 * Get unique party_ids
 */
async function getUniquePartyIds() {
    logger.info('📊 Getting all unique party_ids in database...\n');

    const { data: documents, error } = await supabase
        .from('documents')
        .select('party_id, party_name')
        .order('party_id');

    if (error) {
        logger.error('Error querying documents:', error);
        return;
    }

    if (!documents || documents.length === 0) {
        logger.warn('No documents found');
        return;
    }

    // Get unique party_ids
    const uniqueParties = new Map();
    documents.forEach((doc) => {
        if (!uniqueParties.has(doc.party_id)) {
            uniqueParties.set(doc.party_id, {
                party_id: doc.party_id,
                party_name: doc.party_name,
                count: 0
            });
        }
        uniqueParties.get(doc.party_id).count++;
    });

    logger.info('Unique party_ids:');
    Array.from(uniqueParties.values()).forEach((party) => {
        logger.info(`  ${party.party_id} (${party.party_name}) - ${party.count} document(s)`);
    });
}

/**
 * Main function
 */
async function main() {
    logger.info('🔍 Database Party Check');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        await checkAllDocuments();
        await checkSpecificDocuments();
        await checkByPartyId();
        await getUniquePartyIds();

        logger.info('='.repeat(60));
        logger.info('✅ Check completed');
    } catch (error) {
        logger.error('Check failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

