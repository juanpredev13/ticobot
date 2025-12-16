#!/usr/bin/env tsx

/**
 * Fix UNKNOWN Party to CR1
 * 
 * This script updates the database to change:
 * - party_id: UNKNOWN -> CR1
 * - party_name: UNKNOWN -> CR1
 * - document_id: unknown-2026 -> cr1-2026 (optional)
 * 
 * Usage:
 *   tsx backend/scripts/fix-unknown-party.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('FixUnknownParty');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fix documents table
 */
async function fixDocuments() {
    logger.info('📝 Fixing documents table...');

    // First, check what exists
    const { data: existingDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('document_id', 'unknown-2026');

    if (!existingDocs || existingDocs.length === 0) {
        logger.warn('No document found with document_id: unknown-2026');
        return false;
    }

    logger.info(`Found document: ${existingDocs[0].title}`);
    logger.info(`Current party_id: ${existingDocs[0].party_id}`);
    logger.info(`Current party_name: ${existingDocs[0].party_name}`);

    // Update the document
    const { data, error } = await supabase
        .from('documents')
        .update({
            party_id: 'CR1',
            party_name: 'CR1',
            title: 'Plan de Gobierno CR1 2026',
            // Optionally update document_id (commented out to avoid breaking references)
            // document_id: 'cr1-2026',
        })
        .eq('document_id', 'unknown-2026')
        .select();

    if (error) {
        logger.error('Error updating document:', error);
        return false;
    }

    if (data && data.length > 0) {
        logger.info('✅ Document updated successfully:');
        logger.info(`   party_id: ${data[0].party_id}`);
        logger.info(`   party_name: ${data[0].party_name}`);
        logger.info(`   title: ${data[0].title}`);
        return true;
    }

    return false;
}

/**
 * Fix chunks metadata
 */
async function fixChunksMetadata(documentUuid: string) {
    logger.info('\n📝 Fixing chunks metadata...');

    // Get all chunks for this document
    const { data: chunks, error: fetchError } = await supabase
        .from('chunks')
        .select('id, metadata')
        .eq('document_id', documentUuid);

    if (fetchError) {
        logger.error('Error fetching chunks:', fetchError);
        return;
    }

    if (!chunks || chunks.length === 0) {
        logger.warn('No chunks found for this document');
        return;
    }

    logger.info(`Found ${chunks.length} chunk(s) to update`);

    let updatedCount = 0;
    for (const chunk of chunks) {
        const metadata = chunk.metadata || {};
        
        // Update partyId in metadata if it exists
        if (metadata.partyId === 'UNKNOWN' || metadata.partyId === 'unknown') {
            const updatedMetadata = {
                ...metadata,
                partyId: 'CR1',
            };

            const { error: updateError } = await supabase
                .from('chunks')
                .update({ metadata: updatedMetadata })
                .eq('id', chunk.id);

            if (updateError) {
                logger.error(`Error updating chunk ${chunk.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    logger.info(`✅ Updated ${updatedCount} chunk(s)`);
}

/**
 * Main function
 */
async function main() {
    logger.info('🔧 Fixing UNKNOWN Party to CR1');
    logger.info('='.repeat(60));
    logger.info('');

    try {
        // 1. Fix documents table
        const documentUpdated = await fixDocuments();

        if (!documentUpdated) {
            logger.error('Failed to update document. Aborting.');
            process.exit(1);
        }

        // 2. Get document UUID to update chunks
        const { data: doc } = await supabase
            .from('documents')
            .select('id')
            .eq('document_id', 'unknown-2026')
            .single();

        if (doc) {
            await fixChunksMetadata(doc.id);
        }

        logger.info('\n' + '='.repeat(60));
        logger.info('✅ Fix completed successfully!');
        logger.info('='.repeat(60));
        logger.info('\nNext steps:');
        logger.info('1. Update scraped-plans.ts to use partyId: "CR1"');
        logger.info('2. Optionally re-ingest the document with documentId: "cr1-2026"');

    } catch (error) {
        logger.error('Fix failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

