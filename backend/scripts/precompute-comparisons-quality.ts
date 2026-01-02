/**
 * Pre-compute Top 5 Comparisons with Quality Settings
 *
 * This script generates comparisons for the top 5 parties with optimized
 * quality parameters for better results
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { RAGPipeline } from '../src/rag/components/RAGPipeline.js';
import { ComparisonsCacheService } from '../src/db/services/comparisons-cache.service.js';
import { PartiesService } from '../src/db/services/parties.service.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('PrecomputeQuality');

// Common topics to pre-compute (8 temas principales)
const COMMON_TOPICS = [
  'Educación',
  'Salud',
  'Empleo',
  'Seguridad',
  'Ambiente',
  'Economía',
  'Infraestructura',
  'Corrupción',
];

// Top 5 party slugs
const TOP_5_SLUGS = {
  PLN: 'pln',
  PUSC: 'pusc',
  CAC: 'cac',
  FA: 'fa',
  PUEBLO_SOBERANO: 'pueblo-soberano',
};

// Common party combinations for top 5
const TOP_5_COMBINATIONS = [
  // Individuales (5 partidos)
  [TOP_5_SLUGS.PLN],
  [TOP_5_SLUGS.PUSC],
  [TOP_5_SLUGS.CAC],
  [TOP_5_SLUGS.FA],
  [TOP_5_SLUGS.PUEBLO_SOBERANO],

  // Combinaciones principales (5 combinaciones)
  [TOP_5_SLUGS.PLN, TOP_5_SLUGS.PUSC, TOP_5_SLUGS.CAC, TOP_5_SLUGS.FA], // Top 4
  [TOP_5_SLUGS.PLN, TOP_5_SLUGS.PUSC],                                   // Tradicionales
  [TOP_5_SLUGS.PLN, TOP_5_SLUGS.CAC],                                    // PLN vs nuevo
  [TOP_5_SLUGS.PUSC, TOP_5_SLUGS.CAC],                                   // PUSC vs nuevo
  [TOP_5_SLUGS.PLN, TOP_5_SLUGS.PUSC, TOP_5_SLUGS.CAC],                 // Top 3
];

async function precomputeComparison(
  topic: string,
  partySlugs: string[],
  ragPipeline: RAGPipeline,
  cacheService: ComparisonsCacheService,
  partiesService: PartiesService
): Promise<{ skipped: boolean }> {
  try {
    logger.info(`Pre-computing: "${topic}" for parties: ${partySlugs.join(', ')}`);

    // Check if already cached
    const existingCache = await cacheService.getCached(topic, partySlugs);
    if (existingCache) {
      logger.info(`⏭️  SKIPPED: "${topic}" for ${partySlugs.join(', ')} - Already cached and not expired`);
      return { skipped: true };
    }

    // Map slugs to document party IDs (abbreviations)
    const partyAbbreviations: string[] = [];
    for (const slug of partySlugs) {
      try {
        const party = await partiesService.findBySlug(slug);
        if (party?.abbreviation) {
          partyAbbreviations.push(party.abbreviation);
        } else {
          partyAbbreviations.push(slug.toUpperCase());
        }
      } catch (error) {
        logger.warn(`Could not find party ${slug}, using slug as abbreviation:`, error instanceof Error ? error.message : String(error));
        partyAbbreviations.push(slug.toUpperCase());
      }
    }

    // Generate comparison using RAG with QUALITY SETTINGS
    const startTime = Date.now();
    const result = await ragPipeline.compareParties(topic, partyAbbreviations, {
      topKPerParty: 5,        // INCREASED from 3 for better context
      temperature: 0.7,
    });

    // Determine proposal states
    const enrichedComparisons = result.comparisons.map((comparison) => {
      const sourcesCount = comparison.sources.length;
      let state: string;

      if (sourcesCount === 0 || comparison.confidence < 0.2) {
        state = 'sin_informacion';
      } else if (comparison.confidence < 0.4) {
        state = 'poco_clara';
      } else if (comparison.answer.length > 200 && sourcesCount >= 2 && comparison.confidence >= 0.7) {
        state = 'completa';
      } else if (comparison.answer.length > 100 && sourcesCount >= 1 && comparison.confidence >= 0.5) {
        state = 'parcial';
      } else {
        state = 'poco_clara';
      }

      // Determine state label
      let stateLabel: string;
      if (state === 'completa') {
        stateLabel = 'Completa';
      } else if (state === 'parcial') {
        stateLabel = 'Parcial';
      } else if (state === 'poco_clara') {
        stateLabel = 'Poco clara';
      } else {
        stateLabel = 'Sin información';
      }

      return {
        party: comparison.party,
        answer: comparison.answer,
        state,
        stateLabel,
        confidence: comparison.confidence,
        sources: comparison.sources,
      };
    });

    // Store in cache with longer expiration
    await cacheService.setCached(
      topic,
      partySlugs,
      enrichedComparisons,
      {
        processingTime: Date.now() - startTime,
        expiresInHours: 24 * 30, // 30 days for quality cache
      }
    );

    const processingTime = Date.now() - startTime;
    logger.info(`✅ Cached: "${topic}" (${partySlugs.length} parties) in ${processingTime}ms`);
    logger.info(`   Sources: ${enrichedComparisons.map(c => c.sources.length).join(', ')}`);
    logger.info(`   States: ${enrichedComparisons.map(c => c.state).join(', ')}`);

    return { skipped: false };
  } catch (error) {
    logger.error(`❌ Failed to pre-compute "${topic}" for ${partySlugs.join(', ')}:`, error);
    throw error;
  }
}

async function main() {
  logger.info('🚀 Starting QUALITY pre-computation for top 5 parties...');
  logger.info('Quality Settings:');
  logger.info('  - topKPerParty: 5 (more context per party)');
  logger.info('  - Cache expiration: 30 days');
  logger.info('  - Parties: PLN, PUSC, CAC, FA, Pueblo Soberano');
  logger.info('');

  const supabase = createSupabaseClient();
  const cacheService = new ComparisonsCacheService(supabase);
  const partiesService = new PartiesService(supabase);
  const ragPipeline = new RAGPipeline({ maxContextLength: 4000 }); // Increased from 3000

  let total = 0;
  let success = 0;
  let skipped = 0;
  let failed = 0;

  // Pre-compute all combinations
  for (const topic of COMMON_TOPICS) {
    for (const partyCombination of TOP_5_COMBINATIONS) {
      total++;
      try {
        const result = await precomputeComparison(
          topic,
          partyCombination,
          ragPipeline,
          cacheService,
          partiesService
        );

        if (result.skipped) {
          skipped++;
        } else {
          success++;
        }

        // Small delay to avoid rate limiting (only if not skipped)
        if (!result.skipped) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay
        }
      } catch (error) {
        failed++;
        logger.error(`Failed combination: ${topic} + ${partyCombination.join(', ')}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  logger.info(`\n📊 Pre-computation complete:`);
  logger.info(`   Total: ${total}`);
  logger.info(`   ✅ Newly cached: ${success}`);
  logger.info(`   ⏭️  Skipped (already cached): ${skipped}`);
  logger.info(`   ❌ Failed: ${failed}`);
  logger.info(`\n💡 Cache is now warmed up with quality data!`);

  // Show cache stats
  const stats = await cacheService.getStats();
  logger.info(`\n📈 Cache Statistics:`);
  logger.info(`   Total entries: ${stats.total}`);
  logger.info(`   Never expires: ${stats.neverExpires}`);
  logger.info(`   Expired: ${stats.expired}`);
}

try {
  await main();
} catch (error) {
  logger.error('Fatal error:', error);
  process.exit(1);
}
