#!/usr/bin/env tsx

/**
 * Analyze UNKNOWN Party (CR1)
 * 
 * This script analyzes the UNKNOWN party entry to understand:
 * - What documents exist for this party
 * - What data is stored in the database
 * - If the partyId needs to be corrected
 * 
 * Usage:
 *   tsx backend/scripts/analyze-unknown-party.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import { TSE_PLANS } from '../scraped-plans.js';

const logger = new Logger('AnalyzeUnknownParty');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Find UNKNOWN party in TSE_PLANS
 */
function findUnknownParty() {
    const unknownParty = TSE_PLANS.find(p => p.partyId === 'UNKNOWN' || p.documentId === 'unknown-2026');
    
    if (!unknownParty) {
        logger.error('UNKNOWN party not found in TSE_PLANS');
        return null;
    }

    logger.info('Found UNKNOWN party in TSE_PLANS:');
    logger.info(`  partyName: ${unknownParty.partyName}`);
    logger.info(`  partyId: ${unknownParty.partyId}`);
    logger.info(`  documentId: ${unknownParty.documentId}`);
    logger.info(`  pdfUrl: ${unknownParty.pdfUrl}`);

    return unknownParty;
}

/**
 * Check documents in database
 */
async function checkDocumentsInDB(documentId: string) {
    logger.info(`\nChecking documents in database for documentId: ${documentId}`);

    const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_id', documentId);

    if (error) {
        logger.error('Error querying documents:', error);
        return null;
    }

    if (!documents || documents.length === 0) {
        logger.warn(`No documents found with document_id: ${documentId}`);
        return null;
    }

    logger.info(`Found ${documents.length} document(s):`);
    documents.forEach((doc, index) => {
        logger.info(`\nDocument ${index + 1}:`);
        logger.info(`  id: ${doc.id}`);
        logger.info(`  document_id: ${doc.document_id}`);
        logger.info(`  title: ${doc.title}`);
        logger.info(`  party_id: ${doc.party_id}`);
        logger.info(`  party_name: ${doc.party_name}`);
        logger.info(`  url: ${doc.url}`);
        logger.info(`  page_count: ${doc.page_count}`);
        logger.info(`  file_size_bytes: ${doc.file_size_bytes}`);
        logger.info(`  metadata: ${JSON.stringify(doc.metadata, null, 2)}`);
    });

    return documents;
}

/**
 * Check chunks for a document
 */
async function checkChunksForDocument(documentId: string) {
    logger.info(`\nChecking chunks for document: ${documentId}`);

    // First get the document UUID
    const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('document_id', documentId)
        .limit(1);

    if (!documents || documents.length === 0) {
        logger.warn(`No document found with document_id: ${documentId}`);
        return;
    }

    const documentUuid = documents[0].id;

    const { data: chunks, error } = await supabase
        .from('chunks')
        .select('id, chunk_index, content, metadata, token_count')
        .eq('document_id', documentUuid)
        .order('chunk_index', { ascending: true })
        .limit(5); // Just show first 5 chunks

    if (error) {
        logger.error('Error querying chunks:', error);
        return;
    }

    if (!chunks || chunks.length === 0) {
        logger.warn(`No chunks found for document: ${documentId}`);
        return;
    }

    logger.info(`Found ${chunks.length} chunk(s) (showing first 5):`);
    chunks.forEach((chunk, index) => {
        logger.info(`\nChunk ${index + 1}:`);
        logger.info(`  id: ${chunk.id}`);
        logger.info(`  chunk_index: ${chunk.chunk_index}`);
        logger.info(`  token_count: ${chunk.token_count}`);
        logger.info(`  content preview: ${chunk.content.substring(0, 100)}...`);
        if (chunk.metadata) {
            logger.info(`  metadata: ${JSON.stringify(chunk.metadata, null, 2)}`);
        }
    });

    // Get total count
    const { count } = await supabase
        .from('chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentUuid);

    logger.info(`\nTotal chunks for this document: ${count || 0}`);
}

/**
 * Check all documents with UNKNOWN or CR1 party_id
 */
async function checkAllUnknownDocuments() {
    logger.info('\nChecking all documents with party_id = UNKNOWN or CR1:');

    const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .in('party_id', ['UNKNOWN', 'CR1', 'unknown']);

    if (error) {
        logger.error('Error querying documents:', error);
        return;
    }

    if (!documents || documents.length === 0) {
        logger.warn('No documents found with party_id UNKNOWN or CR1');
        return;
    }

    logger.info(`Found ${documents.length} document(s):`);
    documents.forEach((doc, index) => {
        logger.info(`\nDocument ${index + 1}:`);
        logger.info(`  document_id: ${doc.document_id}`);
        logger.info(`  title: ${doc.title}`);
        logger.info(`  party_id: ${doc.party_id}`);
        logger.info(`  party_name: ${doc.party_name}`);
    });
}

/**
 * Main analysis function
 */
async function analyzeUnknownParty() {
    logger.info('🔍 Analyzing UNKNOWN Party (CR1)');
    logger.info('='.repeat(60));

    // 1. Find in TSE_PLANS
    const unknownParty = findUnknownParty();
    if (!unknownParty) {
        return;
    }

    // 2. Check documents in database
    const documents = await checkDocumentsInDB(unknownParty.documentId);

    // 3. Check chunks if document exists
    if (documents && documents.length > 0) {
        await checkChunksForDocument(unknownParty.documentId);
    }

    // 4. Check all UNKNOWN/CR1 documents
    await checkAllUnknownDocuments();

    // 5. Summary and recommendations
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`Party Name: ${unknownParty.partyName} (CR1)`);
    logger.info(`Current partyId: ${unknownParty.partyId} (should be CR1)`);
    logger.info(`Document ID: ${unknownParty.documentId}`);
    
    if (documents && documents.length > 0) {
        const doc = documents[0];
        logger.info(`\nDatabase Status:`);
        logger.info(`  Document exists: ✅`);
        logger.info(`  Stored party_id: ${doc.party_id}`);
        logger.info(`  Stored party_name: ${doc.party_name}`);
        
        if (doc.party_id === 'UNKNOWN' || doc.party_id === 'unknown') {
            logger.warn(`\n⚠️  ISSUE: party_id is "${doc.party_id}" but should be "CR1"`);
            logger.info(`\nRecommendation: Update party_id from "${doc.party_id}" to "CR1"`);
        } else if (doc.party_id === 'CR1') {
            logger.info(`\n✅ party_id is correctly set to "CR1"`);
        }
    } else {
        logger.warn(`\n⚠️  Document not found in database`);
        logger.info(`\nRecommendation: Run re-ingestion for this document`);
    }

    logger.info('='.repeat(60));
}

/**
 * Main entry point
 */
async function main() {
    try {
        await analyzeUnknownParty();
        process.exit(0);
    } catch (error) {
        logger.error('Analysis failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

