/**
 * Pre-compute common comparisons to warm up the cache
 * This script generates comparisons for popular topics and party combinations
 * to avoid expensive RAG processing on first user request
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { RAGPipeline } from '../src/rag/components/RAGPipeline.js';
import { ComparisonsCacheService } from '../src/db/services/comparisons-cache.service.js';
import { PartiesService } from '../src/db/services/parties.service.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('PrecomputeComparisons');

// Common topics to pre-compute
const COMMON_TOPICS = [
  'Educación',
  'Salud',
  'Empleo',
  'Seguridad',
  'Ambiente',
  'Economía',
  'Infraestructura',
  'Corrupción',
  'Vivienda',
  'Transporte',
];

// Common party combinations (top 4 parties by popularity)
const COMMON_PARTY_COMBINATIONS = [
  ['pln', 'pusc', 'pac', 'fa'], // Top 4
  ['pln', 'pusc'], // Top 2
  ['pln', 'pac'], // PLN vs PAC
  ['pusc', 'pac'], // PUSC vs PAC
  ['pln', 'pusc', 'pac'], // Top 3
];

async function precomputeComparison(
  topic: string,
  partySlugs: string[],
  ragPipeline: RAGPipeline,
  cacheService: ComparisonsCacheService,
  partiesService: PartiesService
): Promise<void> {
  try {
    logger.info(`Pre-computing: "${topic}" for parties: ${partySlugs.join(', ')}`);

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

    // Generate comparison using RAG
    const startTime = Date.now();
    const result = await ragPipeline.compareParties(topic, partyAbbreviations, {
      topKPerParty: 3,
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

    // Store in cache
    await cacheService.setCached(
      topic,
      partySlugs,
      enrichedComparisons,
      {
        processingTime: Date.now() - startTime,
        expiresInHours: 24 * 7, // 7 days
      }
    );

    const processingTime = Date.now() - startTime;
    logger.info(`✅ Cached: "${topic}" (${partySlugs.length} parties) in ${processingTime}ms`);
  } catch (error) {
    logger.error(`❌ Failed to pre-compute "${topic}" for ${partySlugs.join(', ')}:`, error);
  }
}

async function main() {
  logger.info('🚀 Starting pre-computation of common comparisons...');

  const supabase = createSupabaseClient();
  const cacheService = new ComparisonsCacheService(supabase);
  const partiesService = new PartiesService(supabase);
  const ragPipeline = new RAGPipeline({ maxContextLength: 3000 });

  let total = 0;
  let success = 0;
  let failed = 0;

  // Pre-compute all combinations
  for (const topic of COMMON_TOPICS) {
    for (const partyCombination of COMMON_PARTY_COMBINATIONS) {
      total++;
      try {
        await precomputeComparison(
          topic,
          partyCombination,
          ragPipeline,
          cacheService,
          partiesService
        );
        success++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        logger.error(`Failed combination: ${topic} + ${partyCombination.join(', ')}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  logger.info(`\n📊 Pre-computation complete:`);
  logger.info(`   Total: ${total}`);
  logger.info(`   ✅ Success: ${success}`);
  logger.info(`   ❌ Failed: ${failed}`);
  logger.info(`\n💡 Cache is now warmed up! Users will get instant responses for these comparisons.`);

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

