#!/usr/bin/env tsx

/**
 * Check Candidatos Document
 * 
 * Verifies that the partidos-candidatos-2026 document is properly indexed
 */

import { createClient } from '@supabase/supabase-js';
import { Logger } from '@ticobot/shared';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('CheckCandidatos');

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
    logger.info('Checking partidos-candidatos-2026 document...\n');

    // Check document
    const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('document_id', 'partidos-candidatos-2026')
        .single();

    if (docError || !doc) {
        logger.error('Document not found:', docError);
        return;
    }

    logger.info('✅ Document found:');
    logger.info(`   ID: ${doc.id}`);
    logger.info(`   Document ID: ${doc.document_id}`);
    logger.info(`   Title: ${doc.title}`);
    logger.info(`   Party ID: ${doc.party_id || 'N/A'}`);
    logger.info(`   Party Name: ${doc.party_name || 'N/A'}`);
    logger.info(`   Pages: ${doc.page_count || 0}`);
    logger.info('');

    // Check chunks
    const { data: chunks, error: chunksError } = await supabase
        .from('chunks')
        .select('id, content, metadata, embedding')
        .eq('document_id', doc.id)
        .limit(5);

    if (chunksError) {
        logger.error('Error fetching chunks:', chunksError);
        return;
    }

    logger.info(`✅ Found ${chunks?.length || 0} chunk(s):`);
    chunks?.forEach((chunk, i) => {
        logger.info(`\n   Chunk ${i + 1}:`);
        logger.info(`   ID: ${chunk.id}`);
        logger.info(`   Content preview: ${chunk.content.substring(0, 150)}...`);
        logger.info(`   Has embedding: ${chunk.embedding ? 'Yes' : 'No'}`);
        logger.info(`   Metadata: ${JSON.stringify(chunk.metadata, null, 2)}`);
    });

    logger.info('\n✅ Document is ready for RAG queries!');
}

main().catch(console.error);

