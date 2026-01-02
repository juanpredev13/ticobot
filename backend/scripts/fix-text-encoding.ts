/**
 * Fix Text Encoding Issues
 *
 * This script fixes the systematic text extraction error where ":" replaces "ti"
 * in all chunks from the database.
 *
 * Pattern detected: :vas → tivas, :co → tico, :cipan → ticipan
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('FixTextEncoding');

interface Chunk {
  id: string;
  content: string;
  chunk_index: number;
}

/**
 * Fix the encoding issue where ":" replaces "ti"
 * Pattern: ":" followed by a lowercase letter should be "ti" + that letter
 */
function fixEncodingIssue(text: string): string {
  // Replace :letter with tiletter (where letter is a-z or accented vowels)
  // This regex matches : followed by a lowercase letter
  return text.replace(/:([a-záéíóúñü])/g, 'ti$1');
}

/**
 * Analyze how many chunks have the encoding issue
 */
async function analyzeIssues(): Promise<{ total: number; affected: number; samples: string[] }> {
  const supabase = createSupabaseClient();

  logger.info('Analyzing chunks for encoding issues...');

  const { data: chunks, error } = await supabase
    .from('chunks')
    .select('id, content')
    .limit(1000);

  if (error) {
    throw new Error(`Error fetching chunks: ${error.message}`);
  }

  let affected = 0;
  const samples: string[] = [];
  const pattern = /:([a-záéíóúñü])/g;

  for (const chunk of chunks || []) {
    if (pattern.test(chunk.content)) {
      affected++;
      if (samples.length < 5) {
        // Extract sample of the issue
        const matches = chunk.content.match(/:([a-záéíóúñü])/g);
        if (matches) {
          samples.push(`Found: ${matches.slice(0, 3).join(', ')}`);
        }
      }
    }
  }

  return {
    total: chunks?.length || 0,
    affected,
    samples
  };
}

/**
 * Fix all chunks in the database
 */
async function fixAllChunks(dryRun = true): Promise<void> {
  const supabase = createSupabaseClient();

  logger.info(dryRun ? 'Running in DRY RUN mode...' : 'Running in LIVE mode - will update database');

  // Get total count
  const { count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  logger.info(`Total chunks to process: ${count}`);

  const batchSize = 100;
  let processed = 0;
  let fixed = 0;

  // Process in batches
  for (let offset = 0; offset < (count || 0); offset += batchSize) {
    const { data: chunks, error } = await supabase
      .from('chunks')
      .select('id, content, chunk_index')
      .order('chunk_index', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) {
      logger.error(`Error fetching batch at offset ${offset}:`, error);
      continue;
    }

    for (const chunk of chunks || []) {
      const pattern = /:([a-záéíóúñü])/g;
      if (pattern.test(chunk.content)) {
        const fixedContent = fixEncodingIssue(chunk.content);

        if (dryRun) {
          // Show sample of what would be changed
          if (fixed < 3) {
            logger.info(`\nChunk ${chunk.id} would be fixed:`);
            logger.info(`BEFORE: ${chunk.content.substring(0, 200)}...`);
            logger.info(`AFTER:  ${fixedContent.substring(0, 200)}...`);
          }
        } else {
          // Actually update the database
          const { error: updateError } = await supabase
            .from('chunks')
            .update({ content: fixedContent })
            .eq('id', chunk.id);

          if (updateError) {
            logger.error(`Error updating chunk ${chunk.id}:`, updateError);
          }
        }

        fixed++;
      }

      processed++;

      if (processed % 100 === 0) {
        logger.info(`Progress: ${processed}/${count} chunks processed, ${fixed} fixed`);
      }
    }
  }

  logger.info(`\n✅ Complete!`);
  logger.info(`   Total processed: ${processed}`);
  logger.info(`   Chunks fixed: ${fixed}`);
  logger.info(`   Fix rate: ${((fixed / processed) * 100).toFixed(1)}%`);

  if (dryRun) {
    logger.warn('\n⚠️  This was a DRY RUN - no changes were made to the database');
    logger.info('   Run with --apply flag to actually apply the fixes');
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'analyze') {
      logger.info('📊 Analyzing encoding issues...\n');
      const analysis = await analyzeIssues();

      logger.info(`\nAnalysis Results:`);
      logger.info(`  Total chunks analyzed: ${analysis.total}`);
      logger.info(`  Chunks with issues: ${analysis.affected}`);
      logger.info(`  Percentage affected: ${((analysis.affected / analysis.total) * 100).toFixed(1)}%`);

      if (analysis.samples.length > 0) {
        logger.info(`\n  Sample issues found:`);
        analysis.samples.forEach(sample => logger.info(`    - ${sample}`));
      }

      logger.info(`\n  Example fix:`);
      logger.info(`    Before: "perspec:vas geopolí:co par:cipan"`);
      logger.info(`    After:  "perspectivas geopolítico participan"`);

    } else if (command === 'fix') {
      const apply = args.includes('--apply');
      await fixAllChunks(!apply);

    } else {
      logger.info('Usage:');
      logger.info('  pnpm tsx scripts/fix-text-encoding.ts analyze');
      logger.info('  pnpm tsx scripts/fix-text-encoding.ts fix           (dry run)');
      logger.info('  pnpm tsx scripts/fix-text-encoding.ts fix --apply   (apply changes)');
    }

  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

main();
