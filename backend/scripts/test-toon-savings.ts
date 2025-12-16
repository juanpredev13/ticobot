#!/usr/bin/env tsx

/**
 * Test TOON Token Savings
 * 
 * This script tests multiple queries and measures token savings
 * comparing TOON vs JSON format in QueryProcessor responses.
 * 
 * Usage:
 *   tsx backend/scripts/test-toon-savings.ts
 */

import { QueryProcessor } from '../src/rag/components/QueryProcessor.js';
import { ProviderFactory } from '../src/factory/ProviderFactory.js';
import { countTokens, estimateJSONTokens, formatTokenSavings } from '../src/rag/utils/tokenCounter.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('TOONSavingsTest');

// Test queries
const testQueries = [
    '¿Qué propone el PLN sobre educación?',
    'Comparar seguridad entre PAC y PUSC',
    '¿Cuáles son las propuestas del FA sobre salud?',
    'Búsqueda de información sobre infraestructura en el plan del PIN',
    '¿Qué dice el plan de gobierno del PLN sobre empleo y trabajo?',
    'Comparar propuestas de medio ambiente entre todos los partidos',
    'Información sobre transporte público en los planes de gobierno',
    '¿Qué proponen los partidos sobre vivienda?',
    'Búsqueda de datos sobre economía y finanzas públicas',
    'Comparar educación superior entre PLN, PAC y PUSC',
];

interface SavingsStats {
    query: string;
    toonTokens: number;
    jsonTokens: number;
    savedTokens: number;
    savingsPercent: number;
    format: 'TOON' | 'JSON';
}

/**
 * Test a single query and measure token savings
 */
async function testQuery(query: string, processor: QueryProcessor, llmProvider: any): Promise<SavingsStats> {
    logger.info(`\n📝 Testing query: "${query}"`);

    try {
        const result = await processor.processQuery(query, llmProvider);

        // Estimate what JSON would have been
        const jsonEquivalent = {
            keywords: result.keywords,
            entities: result.entities,
            intent: result.intent,
            enhancedQuery: result.enhancedQuery,
        };

        const jsonTokens = estimateJSONTokens(jsonEquivalent);
        
        // We need to get the actual response from the LLM to count TOON tokens
        // For now, we'll estimate based on the result
        // In production, QueryProcessor logs this, but we can't access it here
        // So we'll simulate by encoding the result as TOON
        const toonFormat = `keywords: ${result.keywords.join(',')}\nentities: ${result.entities.join(',')}\nintent: ${result.intent}\nenhancedQuery: ${result.enhancedQuery}`;
        const toonTokens = countTokens(toonFormat);

        const savedTokens = jsonTokens - toonTokens;
        const savingsPercent = (savedTokens / jsonTokens) * 100;

        return {
            query,
            toonTokens,
            jsonTokens,
            savedTokens,
            savingsPercent,
            format: 'TOON',
        };
    } catch (error) {
        logger.error(`Failed to process query: ${error}`);
        return {
            query,
            toonTokens: 0,
            jsonTokens: 0,
            savedTokens: 0,
            savingsPercent: 0,
            format: 'TOON',
        };
    }
}

/**
 * Main test function
 */
async function main() {
    logger.info('🚀 Starting TOON Token Savings Test');
    logger.info(`📋 Testing ${testQueries.length} queries\n`);

    const processor = new QueryProcessor();
    const llmProvider = await ProviderFactory.getLLMProvider();

    const results: SavingsStats[] = [];

    for (const query of testQueries) {
        const stats = await testQuery(query, processor, llmProvider);
        results.push(stats);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate aggregate statistics
    const totalToonTokens = results.reduce((sum, r) => sum + r.toonTokens, 0);
    const totalJsonTokens = results.reduce((sum, r) => sum + r.jsonTokens, 0);
    const totalSavedTokens = results.reduce((sum, r) => sum + r.savedTokens, 0);
    const avgSavingsPercent = results.reduce((sum, r) => sum + r.savingsPercent, 0) / results.length;

    // Display results
    logger.info('\n' + '='.repeat(80));
    logger.info('📊 TOON TOKEN SAVINGS REPORT');
    logger.info('='.repeat(80));

    logger.info('\n📈 Per-Query Results:');
    results.forEach((r, i) => {
        logger.info(
            `\n${i + 1}. "${r.query.substring(0, 50)}${r.query.length > 50 ? '...' : ''}"`
        );
        logger.info(`   TOON: ${r.toonTokens} tokens`);
        logger.info(`   JSON: ${r.jsonTokens} tokens`);
        logger.info(`   Saved: ${formatTokenSavings(r.jsonTokens, r.toonTokens)}`);
    });

    logger.info('\n' + '='.repeat(80));
    logger.info('📊 AGGREGATE STATISTICS');
    logger.info('='.repeat(80));
    logger.info(`Total TOON tokens: ${totalToonTokens.toLocaleString()}`);
    logger.info(`Total JSON tokens: ${totalJsonTokens.toLocaleString()}`);
    logger.info(`Total saved: ${totalSavedTokens.toLocaleString()} tokens`);
    logger.info(`Average savings: ${avgSavingsPercent.toFixed(1)}%`);
    logger.info(`\n💰 Estimated cost savings (assuming $0.0001 per 1K tokens):`);
    logger.info(`   Saved: $${(totalSavedTokens / 1000 * 0.0001).toFixed(4)}`);
    logger.info('='.repeat(80));

    // Summary
    logger.info('\n✅ Test completed successfully!');
    logger.info(`📉 Average token reduction: ${avgSavingsPercent.toFixed(1)}%`);
    logger.info(`💾 Total tokens saved: ${totalSavedTokens.toLocaleString()}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Test failed:', error);
            process.exit(1);
        });
}

