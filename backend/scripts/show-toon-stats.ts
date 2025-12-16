#!/usr/bin/env tsx

/**
 * Show TOON Token Savings Statistics
 * 
 * Displays cumulative token savings from using TOON format
 * 
 * Usage:
 *   tsx backend/scripts/show-toon-stats.ts
 */

import { toonStatsTracker } from '../src/rag/utils/toonStats.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('TOONStats');

async function main() {
    const summary = toonStatsTracker.getSummary();
    const stats = toonStatsTracker.getStats();

    logger.info('\n' + '='.repeat(80));
    logger.info('📊 TOON TOKEN SAVINGS STATISTICS');
    logger.info('='.repeat(80));

    if (summary.totalQueries === 0) {
        logger.info('\n⚠️  No queries processed yet.');
        logger.info('   Run some queries through the QueryProcessor to see statistics.');
        logger.info('='.repeat(80));
        return;
    }

    logger.info('\n📈 Summary:');
    logger.info(`   Total queries processed: ${summary.totalQueries.toLocaleString()}`);
    logger.info(`   Total TOON tokens used: ${summary.totalToonTokens.toLocaleString()}`);
    logger.info(`   Total JSON tokens (estimated): ${summary.totalJsonTokens.toLocaleString()}`);
    logger.info(`   Total tokens saved: ${summary.totalSavedTokens.toLocaleString()}`);
    logger.info(`   Average savings: ${summary.avgSavingsPercent.toFixed(1)}%`);

    logger.info('\n💰 Cost Savings (estimated at $0.0001 per 1K tokens):');
    logger.info(`   Saved: $${summary.estimatedCostSavings.toFixed(4)}`);

    if (stats.queries.length > 0) {
        logger.info('\n📋 Recent Queries (last 10):');
        const recentQueries = stats.queries.slice(-10).reverse();
        recentQueries.forEach((q, i) => {
            const savingsPercent = (q.savedTokens / q.jsonTokens) * 100;
            logger.info(
                `\n   ${i + 1}. "${q.query.substring(0, 50)}${q.query.length > 50 ? '...' : ''}"`
            );
            logger.info(`      TOON: ${q.toonTokens} tokens | JSON: ${q.jsonTokens} tokens | Saved: ${q.savedTokens} tokens (${savingsPercent.toFixed(1)}%)`);
        });
    }

    logger.info('\n' + '='.repeat(80));
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Failed to show statistics:', error);
        process.exit(1);
    });

