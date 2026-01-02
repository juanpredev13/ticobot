#!/usr/bin/env tsx

/**
 * Check Parties Table
 * 
 * This script checks the parties table to see which parties are registered
 * and compares with documents table
 * 
 * Usage:
 *   tsx backend/scripts/check-parties-table.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('CheckPartiesTable');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check parties table
 */
async function checkPartiesTable() {
    logger.info('📋 Checking parties table...\n');

    const { data: parties, error } = await supabase
        .from('parties')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        logger.error('Error querying parties table:', error);
        logger.info('\nNote: If table does not exist, this is expected.');
        return null;
    }

    if (!parties || parties.length === 0) {
        logger.warn('No parties found in parties table');
        return [];
    }

    logger.info(`Found ${parties.length} party/parties in parties table:\n`);
    
    parties.forEach((party, index) => {
        logger.info(`${index + 1}. Party:`);
        logger.info(`   id: ${party.id}`);
        logger.info(`   name: ${party.name}`);
        logger.info(`   abbreviation: ${party.abbreviation || 'N/A'}`);
        logger.info(`   slug: ${party.slug || 'N/A'}`);
        logger.info('');
    });

    return parties;
}

/**
 * Compare with documents table
 */
async function compareWithDocuments() {
    logger.info('🔍 Comparing with documents table...\n');

    // Get unique party_ids from documents
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
    const documentPartyIds = new Set(documents.map(d => d.party_id));
    
    logger.info(`Found ${documentPartyIds.size} unique party_id(s) in documents table:`);
    Array.from(documentPartyIds).sort().forEach((partyId) => {
        logger.info(`  - ${partyId}`);
    });

    // Check if parties table exists and compare
    const parties = await checkPartiesTable();
    
    if (parties) {
        const partyIds = new Set(parties.map(p => p.abbreviation || p.id));
        
        logger.info('\n📊 Comparison:');
        logger.info(`  Parties in parties table: ${parties.length}`);
        logger.info(`  Unique party_ids in documents: ${documentPartyIds.size}`);
        
        // Find missing parties
        const missingInParties = Array.from(documentPartyIds).filter(
            docPartyId => !Array.from(partyIds).some(partyId => 
                partyId.toUpperCase() === docPartyId.toUpperCase()
            )
        );
        
        if (missingInParties.length > 0) {
            logger.warn(`\n⚠️  Parties in documents but NOT in parties table:`);
            missingInParties.forEach(partyId => {
                logger.warn(`  - ${partyId}`);
            });
        } else {
            logger.info('\n✅ All document parties are in parties table');
        }

        // Find parties not in documents
        const missingInDocuments = Array.from(partyIds).filter(
            partyId => !Array.from(documentPartyIds).some(docPartyId => 
                docPartyId.toUpperCase() === partyId.toUpperCase()
            )
        );
        
        if (missingInDocuments.length > 0) {
            logger.info(`\n📝 Parties in parties table but NOT in documents:`);
            missingInDocuments.forEach(partyId => {
                logger.info(`  - ${partyId}`);
            });
        }
    }
}

/**
 * Check specifically for FA
 */
async function checkFA() {
    logger.info('\n🔍 Checking specifically for FA (Frente Amplio)...\n');

    // Check in documents
    const { data: faDocuments } = await supabase
        .from('documents')
        .select('*')
        .eq('party_id', 'FA');

    if (faDocuments && faDocuments.length > 0) {
        logger.info('✅ FA found in documents table:');
        faDocuments.forEach(doc => {
            logger.info(`  - ${doc.document_id} (${doc.title})`);
        });
    } else {
        logger.warn('❌ FA NOT found in documents table');
    }

    // Check in parties table
    const { data: faParties } = await supabase
        .from('parties')
        .select('*')
        .or('abbreviation.eq.FA,name.ilike.%Frente Amplio%');

    if (faParties && faParties.length > 0) {
        logger.info('✅ FA found in parties table:');
        faParties.forEach(party => {
            logger.info(`  - ${party.name} (${party.abbreviation || 'N/A'})`);
        });
    } else {
        logger.warn('❌ FA NOT found in parties table');
    }
}

/**
 * Main function
 */
async function main() {
    logger.info('🔍 Parties Table Check');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        await compareWithDocuments();
        await checkFA();

        logger.info('\n' + '='.repeat(60));
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

