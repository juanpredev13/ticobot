#!/usr/bin/env tsx

/**
 * Ingest Partidos y Candidatos 2026 PDF
 * 
 * This script ingests the partidos_candidatos_2026.pdf file
 * 
 * Usage:
 *   tsx backend/scripts/ingest-partidos-candidatos.ts
 * 
 * Environment Variables Required:
 *   - EMBEDDING_PROVIDER (default: 'openai')
 *   - OPENAI_API_KEY (if using OpenAI)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { IngestPipeline } from '../src/ingest/components/IngestPipeline.js';
import { Logger } from '@ticobot/shared';
import path from 'path';
import fs from 'fs/promises';

const logger = new Logger('IngestPartidosCandidatos');

// PDF file path
const PDF_PATH = '/home/juanpredev/Desktop/dev/juanpredev/ticobot/backend/downloads/pdfs/partidos_candidatos_2026.pdf';
const DOCUMENT_ID = 'partidos-candidatos-2026';

/**
 * Main function
 */
async function main() {
    logger.info('🚀 Starting ingestion of partidos_candidatos_2026.pdf');
    logger.info('='.repeat(60));

    try {
        // Check if PDF exists
        try {
            await fs.access(PDF_PATH);
            logger.info(`✅ PDF found: ${PDF_PATH}`);
        } catch (error) {
            logger.error(`❌ PDF not found: ${PDF_PATH}`);
            logger.error('Please ensure the file exists at the specified path');
            process.exit(1);
        }

        // Get file stats
        const stats = await fs.stat(PDF_PATH);
        logger.info(`📄 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // Copy file to expected location if needed
        const downloadPath = path.join(process.cwd(), 'downloads', 'pdfs');
        const expectedPath = path.join(downloadPath, `${DOCUMENT_ID}.pdf`);
        
        try {
            await fs.access(expectedPath);
            logger.info(`✅ File already exists at expected location: ${expectedPath}`);
        } catch {
            // Copy file to expected location
            logger.info(`📋 Copying file to expected location...`);
            await fs.mkdir(downloadPath, { recursive: true });
            await fs.copyFile(PDF_PATH, expectedPath);
            logger.info(`✅ File copied to: ${expectedPath}`);
        }

        // Initialize pipeline
        const pipeline = new IngestPipeline();

        // Ingest options
        const options = {
            downloadPath: downloadPath,
            generateEmbeddings: true,
            storeInVectorDB: true,
        };

        logger.info(`\n📝 Document ID: ${DOCUMENT_ID}`);
        logger.info(`📁 Download path: ${options.downloadPath}`);
        logger.info(`🔗 Using local file (no download needed)\n`);

        // Run ingestion
        // Pass a dummy URL since we're using local file
        // IngestPipeline will check for local file first based on documentId
        const result = await pipeline.ingest(
            `file://${PDF_PATH}`, // Dummy URL, pipeline will use local file
            DOCUMENT_ID,
            options
        );

        // Display results
        logger.info('\n' + '='.repeat(60));
        if (result.success) {
            logger.info('✅ Ingestion completed successfully!');
            logger.info(`📊 Chunks created: ${result.chunks?.length || 0}`);
            logger.info(`⏱️  Total time: ${(result.stats.totalTime / 1000).toFixed(2)}s`);
            logger.info(`\n📈 Statistics:`);
            logger.info(`   Download: ${(result.stats.downloadTime / 1000).toFixed(2)}s`);
            logger.info(`   Parse: ${(result.stats.parseTime / 1000).toFixed(2)}s`);
            logger.info(`   Clean: ${(result.stats.cleanTime / 1000).toFixed(2)}s`);
            logger.info(`   Chunk: ${(result.stats.chunkTime / 1000).toFixed(2)}s`);
            if (result.stats.embeddingTime) {
                logger.info(`   Embedding: ${(result.stats.embeddingTime / 1000).toFixed(2)}s`);
            }
        } else {
            logger.error('❌ Ingestion failed!');
            logger.error(`Error: ${result.error}`);
            process.exit(1);
        }

        logger.info('='.repeat(60));

        // Cleanup
        pipeline.dispose();

    } catch (error) {
        logger.error('Ingestion failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

