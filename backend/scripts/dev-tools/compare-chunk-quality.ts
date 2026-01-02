#!/usr/bin/env tsx

/**
 * Compare chunk quality between PLN and PPSO
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('CompareChunkQuality');
const supabase = createSupabaseClient();

async function compareChunkQuality() {
    logger.info('🔍 Comparing chunk quality: PLN vs PPSO...\n');

    try {
        // Find parties
        const { data: plnParty } = await supabase
            .from('parties')
            .select('id, name, abbreviation')
            .eq('slug', 'liberacion-nacional')
            .single();

        const { data: ppsoParty } = await supabase
            .from('parties')
            .select('id, name, abbreviation')
            .eq('slug', 'pueblo-soberano')
            .single();

        if (!plnParty || !ppsoParty) {
            logger.error('❌ Parties not found');
            return;
        }

        logger.info(`✅ PLN: ${plnParty.name}`);
        logger.info(`✅ PPSO: ${ppsoParty.name}\n`);

        // Get documents
        const { data: plnDoc } = await supabase
            .from('documents')
            .select('id, document_id')
            .eq('party_id', plnParty.id)
            .single();

        const { data: ppsoDoc } = await supabase
            .from('documents')
            .select('id, document_id')
            .eq('party_id', ppsoParty.id)
            .single();

        if (!plnDoc) {
            logger.warn('⚠️  PLN document not found');
        }
        if (!ppsoDoc) {
            logger.warn('⚠️  PPSO document not found');
        }

        // Get sample chunks
        if (plnDoc) {
            const { data: plnChunks } = await supabase
                .from('chunks')
                .select('chunk_index, content, metadata')
                .eq('document_id', plnDoc.id)
                .in('chunk_index', [0, 1, 2])
                .order('chunk_index', { ascending: true });

            logger.info(`\n📄 PLN Chunks (first 3):`);
            if (plnChunks && plnChunks.length > 0) {
                plnChunks.forEach((chunk, idx) => {
                    logger.info(`\n--- Chunk ${chunk.chunk_index} ---`);
                    logger.info(`Length: ${chunk.content.length} chars`);
                    logger.info(`Quality Score: ${chunk.metadata?.qualityScore || 'N/A'}`);
                    
                    // Check for issues
                    const hasSpecialChars = /[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s.,;:!?¿¡\-]/.test(chunk.content);
                    const hasManyCommas = (chunk.content.match(/,/g) || []).length > chunk.content.length / 20;
                    const hasSingleChars = /\b[a-zA-Z]\b/g.test(chunk.content);
                    
                    if (hasSpecialChars) logger.warn('  ⚠️  Contains special characters');
                    if (hasManyCommas) logger.warn('  ⚠️  Contains many commas');
                    if (hasSingleChars && chunk.content.length < 100) logger.warn('  ⚠️  Contains single character words');
                    
                    // Show preview
                    logger.info(`Preview (first 200 chars):`);
                    logger.info(chunk.content.substring(0, 200) + '...');
                });
            }
        }

        if (ppsoDoc) {
            const { data: ppsoChunks } = await supabase
                .from('chunks')
                .select('chunk_index, content, metadata')
                .eq('document_id', ppsoDoc.id)
                .in('chunk_index', [0, 1, 2])
                .order('chunk_index', { ascending: true });

            logger.info(`\n\n📄 PPSO Chunks (first 3):`);
            if (ppsoChunks && ppsoChunks.length > 0) {
                ppsoChunks.forEach((chunk, idx) => {
                    logger.info(`\n--- Chunk ${chunk.chunk_index} ---`);
                    logger.info(`Length: ${chunk.content.length} chars`);
                    logger.info(`Quality Score: ${chunk.metadata?.qualityScore || 'N/A'}`);
                    
                    // Check for issues
                    const hasSpecialChars = /[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s.,;:!?¿¡\-]/.test(chunk.content);
                    const hasManyCommas = (chunk.content.match(/,/g) || []).length > chunk.content.length / 20;
                    const hasSingleChars = /\b[a-zA-Z]\b/g.test(chunk.content);
                    
                    if (hasSpecialChars) logger.warn('  ⚠️  Contains special characters');
                    if (hasManyCommas) logger.warn('  ⚠️  Contains many commas');
                    if (hasSingleChars && chunk.content.length < 100) logger.warn('  ⚠️  Contains single character words');
                    
                    // Show preview
                    logger.info(`Preview (first 200 chars):`);
                    logger.info(chunk.content.substring(0, 200) + '...');
                });
            }
        }

        // Summary
        logger.info('\n\n📊 Summary:');
        if (plnDoc) {
            const { count: plnCount } = await supabase
                .from('chunks')
                .select('*', { count: 'exact', head: true })
                .eq('document_id', plnDoc.id);
            logger.info(`PLN: ${plnCount || 0} chunks`);
        }
        if (ppsoDoc) {
            const { count: ppsoCount } = await supabase
                .from('chunks')
                .select('*', { count: 'exact', head: true })
                .eq('document_id', ppsoDoc.id);
            logger.info(`PPSO: ${ppsoCount || 0} chunks`);
        }

    } catch (error) {
        logger.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    compareChunkQuality()
        .then(() => process.exit(0))
        .catch((error) => {
            logger.error('❌ Script failed:', error);
            process.exit(1);
        });
}


