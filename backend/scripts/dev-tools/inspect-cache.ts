import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('InspectCache');
const supabase = createSupabaseClient();

async function inspectCache() {
  logger.info('🔍 Inspecting comparisons_cache table...\n');

  // 1. Contar total de entradas
  const { count, error: countError } = await supabase
    .from('comparisons_cache')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    logger.error('❌ Error counting cache entries:', countError);
    return;
  }

  logger.info(`📊 Total cached comparisons: ${count || 0}\n`);

  if (!count || count === 0) {
    logger.warn('⚠️  Cache is empty! No comparisons have been pre-computed yet.\n');
    return;
  }

  // 2. Obtener todas las entradas
  const { data: entries, error: entriesError } = await supabase
    .from('comparisons_cache')
    .select('*')
    .order('created_at', { ascending: false });

  if (entriesError) {
    logger.error('❌ Error fetching cache entries:', entriesError);
    return;
  }

  // 3. Analizar por tema
  logger.info('📋 Breakdown by Topic:');
  const byTopic: Record<string, number> = {};
  entries?.forEach(entry => {
    byTopic[entry.topic] = (byTopic[entry.topic] || 0) + 1;
  });

  Object.entries(byTopic)
    .sort(([, a], [, b]) => b - a)
    .forEach(([topic, count]) => {
      logger.info(`  ${topic}: ${count} comparisons`);
    });

  // 4. Analizar por combinación de partidos
  logger.info('\n🎭 Breakdown by Party Combinations:');
  const byParties: Record<string, number> = {};
  entries?.forEach(entry => {
    const key = entry.party_ids.join(', ');
    byParties[key] = (byParties[key] || 0) + 1;
  });

  Object.entries(byParties)
    .sort(([, a], [, b]) => b - a)
    .forEach(([parties, count]) => {
      logger.info(`  [${parties}]: ${count} comparisons`);
    });

  // 5. Revisar calidad de comparisons
  logger.info('\n📝 Sample Cache Entry Analysis:');

  if (entries && entries.length > 0) {
    const sample = entries[0];
    logger.info(`\nTopic: ${sample.topic}`);
    logger.info(`Party IDs: ${sample.party_ids.join(', ')}`);
    logger.info(`Comparisons count: ${sample.comparisons?.length || 0}`);
    logger.info(`Created: ${sample.created_at}`);
    logger.info(`Expires: ${sample.expires_at || 'Never'}`);

    if (sample.comparisons && sample.comparisons.length > 0) {
      logger.info('\nFirst comparison:');
      const comp = sample.comparisons[0];
      logger.info(`  Party: ${comp.party}`);
      logger.info(`  State: ${comp.state} (${comp.stateLabel})`);
      logger.info(`  Confidence: ${comp.confidence}`);
      logger.info(`  Answer length: ${comp.answer?.length || 0} chars`);
      logger.info(`  Sources: ${comp.sources?.length || 0}`);

      if (comp.answer) {
        logger.info(`  Answer preview: ${comp.answer.substring(0, 150)}...`);
      } else {
        logger.warn('  ⚠️  No answer content!');
      }
    }
  }

  // 6. Detectar problemas
  logger.info('\n🔍 Detecting Issues:');
  let issuesFound = 0;

  entries?.forEach((entry, idx) => {
    const issues: string[] = [];

    // Sin comparisons
    if (!entry.comparisons || entry.comparisons.length === 0) {
      issues.push('No comparisons array');
    }

    // Comparisons con estado sin_informacion
    const sinInfo = entry.comparisons?.filter((c: any) => c.state === 'sin_informacion').length || 0;
    if (sinInfo > 0) {
      issues.push(`${sinInfo}/${entry.comparisons?.length} parties with "sin_informacion"`);
    }

    // Comparisons sin respuesta
    const sinAnswer = entry.comparisons?.filter((c: any) => !c.answer || c.answer.trim() === '').length || 0;
    if (sinAnswer > 0) {
      issues.push(`${sinAnswer}/${entry.comparisons?.length} parties with empty answer`);
    }

    // Confidence muy baja
    const lowConfidence = entry.comparisons?.filter((c: any) => c.confidence < 0.3).length || 0;
    if (lowConfidence > 0) {
      issues.push(`${lowConfidence}/${entry.comparisons?.length} parties with low confidence (<0.3)`);
    }

    if (issues.length > 0) {
      issuesFound++;
      logger.warn(`\n⚠️  Entry ${idx + 1}: ${entry.topic} [${entry.party_ids.join(', ')}]`);
      issues.forEach(issue => logger.warn(`     - ${issue}`));
    }
  });

  if (issuesFound === 0) {
    logger.info('✅ No issues detected! All cache entries look healthy.');
  } else {
    logger.warn(`\n⚠️  Found issues in ${issuesFound}/${entries?.length} cache entries.`);
  }

  // 7. Estadísticas de expiración
  logger.info('\n⏰ Expiration Status:');
  const now = new Date();
  const neverExpires = entries?.filter(e => !e.expires_at).length || 0;
  const expired = entries?.filter(e => e.expires_at && new Date(e.expires_at) < now).length || 0;
  const valid = (entries?.length || 0) - neverExpires - expired;

  logger.info(`  Never expires: ${neverExpires}`);
  logger.info(`  Valid (not expired): ${valid}`);
  logger.info(`  Expired: ${expired}`);
}

try {
  await inspectCache();
} catch (error) {
  logger.error('Fatal error:', error);
  process.exit(1);
}
