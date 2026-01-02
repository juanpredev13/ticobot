/**
 * Analyze Content Quality
 *
 * This script performs a comprehensive analysis of:
 * 1. Downloaded PDFs quality
 * 2. Extracted text quality
 * 3. Chunks quality (length, coherence, overlap)
 * 4. Common issues detection
 *
 * Helps identify what needs cleaning/maintenance before re-ingestion
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger('ContentQuality');
const supabase = createSupabaseClient();

interface QualityIssue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  affectedItems: string[];
  recommendation: string;
}

const issues: QualityIssue[] = [];

/**
 * Analyze downloaded PDFs
 */
async function analyzePDFs(): Promise<void> {
  logger.info('\n📄 Analyzing Downloaded PDFs...');

  const pdfDir = path.join(process.cwd(), 'backend', 'downloads', 'pdfs');

  try {
    const files = await fs.readdir(pdfDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));

    logger.info(`  Found ${pdfFiles.length} PDF files`);

    // Check file sizes
    const fileSizes: Record<string, number> = {};
    for (const file of pdfFiles) {
      const filePath = path.join(pdfDir, file);
      const stats = await fs.stat(filePath);
      fileSizes[file] = stats.size;
    }

    // Detect suspiciously small PDFs (< 100KB)
    const smallFiles = Object.entries(fileSizes)
      .filter(([, size]) => size < 100 * 1024)
      .map(([name]) => name);

    if (smallFiles.length > 0) {
      issues.push({
        type: 'warning',
        category: 'PDFs',
        description: `${smallFiles.length} PDFs are suspiciously small (< 100KB)`,
        affectedItems: smallFiles,
        recommendation: 'Re-download these PDFs - they may be corrupted or incomplete'
      });
    }

    // Detect suspiciously large PDFs (> 50MB)
    const largeFiles = Object.entries(fileSizes)
      .filter(([, size]) => size > 50 * 1024 * 1024)
      .map(([name]) => name);

    if (largeFiles.length > 0) {
      issues.push({
        type: 'info',
        category: 'PDFs',
        description: `${largeFiles.length} PDFs are very large (> 50MB)`,
        affectedItems: largeFiles,
        recommendation: 'These may take longer to process - consider optimizing if needed'
      });
    }

    // Show size distribution
    const avgSize = Object.values(fileSizes).reduce((a, b) => a + b, 0) / pdfFiles.length;
    logger.info(`  Average size: ${(avgSize / 1024 / 1024).toFixed(2)} MB`);
    logger.info(`  Smallest: ${Math.min(...Object.values(fileSizes)) / 1024} KB`);
    logger.info(`  Largest: ${(Math.max(...Object.values(fileSizes)) / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    logger.warn(`  ⚠️  Could not analyze PDFs: ${error}`);
    issues.push({
      type: 'critical',
      category: 'PDFs',
      description: 'PDF directory not found or inaccessible',
      affectedItems: [],
      recommendation: 'Run ingestion to download PDFs first'
    });
  }
}

/**
 * Analyze documents in database
 */
async function analyzeDocuments(): Promise<void> {
  logger.info('\n📚 Analyzing Documents in Database...');

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*');

  if (error) {
    logger.error('  ❌ Error fetching documents:', error);
    return;
  }

  if (!documents || documents.length === 0) {
    logger.warn('  ⚠️  NO DOCUMENTS in database!');
    issues.push({
      type: 'critical',
      category: 'Documents',
      description: 'No documents found in database',
      affectedItems: [],
      recommendation: 'Run ingestion script to populate database'
    });
    return;
  }

  logger.info(`  Total documents: ${documents.length}`);

  // Analyze by party
  const byParty: Record<string, number> = {};
  documents.forEach((doc: any) => {
    const party = doc.party_id || 'Unknown';
    byParty[party] = (byParty[party] || 0) + 1;
  });

  logger.info(`  Documents by party:`, byParty);

  // Check for missing page counts
  const missingPages = documents.filter((doc: any) => !doc.page_count || doc.page_count === 0);
  if (missingPages.length > 0) {
    issues.push({
      type: 'warning',
      category: 'Documents',
      description: `${missingPages.length} documents missing page count`,
      affectedItems: missingPages.map((d: any) => d.document_id),
      recommendation: 'Re-ingest these documents with proper PDF parsing'
    });
  }
}

/**
 * Analyze chunks quality
 */
async function analyzeChunks(): Promise<void> {
  logger.info('\n📝 Analyzing Chunks Quality...');

  // Get total count
  const { count: totalChunks, error: countError } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    logger.error('  ❌ Error counting chunks:', countError);
    return;
  }

  if (!totalChunks || totalChunks === 0) {
    logger.warn('  ⚠️  NO CHUNKS in database!');
    issues.push({
      type: 'critical',
      category: 'Chunks',
      description: 'No chunks found in database',
      affectedItems: [],
      recommendation: 'Run ingestion with chunking enabled'
    });
    return;
  }

  logger.info(`  Total chunks: ${totalChunks}`);

  // Sample chunks for analysis (limit to 1000 for performance)
  const { data: chunks, error: chunksError } = await supabase
    .from('chunks')
    .select('id, content, party_abbreviation, chunk_index, metadata')
    .limit(1000);

  if (chunksError || !chunks) {
    logger.error('  ❌ Error fetching chunks:', chunksError);
    return;
  }

  logger.info(`  Analyzing sample of ${chunks.length} chunks...`);

  // Analyze chunk lengths
  const lengths = chunks.map(c => c.content?.length || 0);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);

  logger.info(`\n  📏 Chunk Length Analysis:`);
  logger.info(`     Average: ${Math.round(avgLength)} characters`);
  logger.info(`     Min: ${minLength} characters`);
  logger.info(`     Max: ${maxLength} characters`);

  // Detect very short chunks (< 50 chars)
  const veryShort = chunks.filter(c => (c.content?.length || 0) < 50);
  if (veryShort.length > 0) {
    const percentage = (veryShort.length / chunks.length * 100).toFixed(1);
    issues.push({
      type: 'warning',
      category: 'Chunks',
      description: `${veryShort.length} chunks (${percentage}%) are very short (< 50 chars)`,
      affectedItems: veryShort.slice(0, 5).map(c => c.id),
      recommendation: 'These may be headers or formatting artifacts - consider filtering during ingestion'
    });
    logger.warn(`     ⚠️  ${veryShort.length} very short chunks (< 50 chars)`);
  }

  // Detect very long chunks (> 2000 chars)
  const veryLong = chunks.filter(c => (c.content?.length || 0) > 2000);
  if (veryLong.length > 0) {
    const percentage = (veryLong.length / chunks.length * 100).toFixed(1);
    issues.push({
      type: 'info',
      category: 'Chunks',
      description: `${veryLong.length} chunks (${percentage}%) are very long (> 2000 chars)`,
      affectedItems: veryLong.slice(0, 5).map(c => c.id),
      recommendation: 'Consider using larger maxChunkSize or these may contain tables/lists'
    });
    logger.info(`     ℹ️  ${veryLong.length} very long chunks (> 2000 chars)`);
  }

  // Analyze content quality
  logger.info(`\n  🔍 Content Quality Analysis:`);

  // Detect chunks with excessive whitespace
  const excessiveWhitespace = chunks.filter(c => {
    const content = c.content || '';
    const whitespaceRatio = (content.match(/\s/g) || []).length / content.length;
    return whitespaceRatio > 0.4; // More than 40% whitespace
  });

  if (excessiveWhitespace.length > 0) {
    const percentage = (excessiveWhitespace.length / chunks.length * 100).toFixed(1);
    logger.warn(`     ⚠️  ${excessiveWhitespace.length} chunks (${percentage}%) have excessive whitespace`);
    issues.push({
      type: 'warning',
      category: 'Text Quality',
      description: `${excessiveWhitespace.length} chunks have > 40% whitespace`,
      affectedItems: excessiveWhitespace.slice(0, 5).map(c => c.id),
      recommendation: 'Improve text cleaning during PDF extraction'
    });
  }

  // Detect chunks with special characters (possible encoding issues)
  const encodingIssues = chunks.filter(c => {
    const content = c.content || '';
    // Check for common encoding issue patterns
    return content.includes('�') || content.includes('\ufffd');
  });

  if (encodingIssues.length > 0) {
    logger.error(`     ❌ ${encodingIssues.length} chunks have encoding issues (� characters)`);
    issues.push({
      type: 'critical',
      category: 'Text Quality',
      description: `${encodingIssues.length} chunks have encoding issues`,
      affectedItems: encodingIssues.slice(0, 5).map(c => c.id),
      recommendation: 'Fix PDF extraction encoding - use UTF-8 and proper character handling'
    });
  }

  // Detect chunks with URLs/emails (metadata that should be cleaned)
  const hasUrls = chunks.filter(c => {
    const content = c.content || '';
    return /https?:\/\/|www\./i.test(content) || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(content);
  });

  if (hasUrls.length > 0) {
    const percentage = (hasUrls.length / chunks.length * 100).toFixed(1);
    logger.info(`     ℹ️  ${hasUrls.length} chunks (${percentage}%) contain URLs/emails`);
  }

  // Detect chunks that are mostly numbers (tables/data)
  const mostlyNumbers = chunks.filter(c => {
    const content = c.content || '';
    const numbers = content.match(/\d/g) || [];
    return numbers.length / content.length > 0.3; // > 30% digits
  });

  if (mostlyNumbers.length > 0) {
    const percentage = (mostlyNumbers.length / chunks.length * 100).toFixed(1);
    logger.info(`     ℹ️  ${mostlyNumbers.length} chunks (${percentage}%) are mostly numbers (tables/data)`);
  }

  // Analyze by party
  logger.info(`\n  🎭 Chunks by Party:`);
  const byParty: Record<string, number> = {};
  chunks.forEach(c => {
    const party = c.party_abbreviation || 'Unknown';
    byParty[party] = (byParty[party] || 0) + 1;
  });

  Object.entries(byParty)
    .sort(([, a], [, b]) => b - a)
    .forEach(([party, count]) => {
      logger.info(`     ${party}: ${count} chunks`);
    });
}

/**
 * Analyze embeddings quality
 */
async function analyzeEmbeddings(): Promise<void> {
  logger.info('\n🔢 Analyzing Embeddings...');

  // Count chunks with embeddings
  const { count: withEmbeddings, error: embError } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  const { count: total } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  if (embError) {
    logger.error('  ❌ Error counting embeddings:', embError);
    return;
  }

  const percentage = total ? ((withEmbeddings || 0) / total * 100).toFixed(1) : 0;
  logger.info(`  Chunks with embeddings: ${withEmbeddings}/${total} (${percentage}%)`);

  if ((withEmbeddings || 0) < (total || 1)) {
    const missing = (total || 0) - (withEmbeddings || 0);
    issues.push({
      type: 'warning',
      category: 'Embeddings',
      description: `${missing} chunks missing embeddings (${(100 - parseFloat(percentage.toString())).toFixed(1)}%)`,
      affectedItems: [],
      recommendation: 'Run embedding generation: pnpm --filter backend run generate:embeddings'
    });
  }

  // Sample embeddings to check dimensions
  const { data: sample, error: sampleError } = await supabase
    .from('chunks')
    .select('id, embedding')
    .not('embedding', 'is', null)
    .limit(10);

  if (sampleError || !sample || sample.length === 0) {
    logger.warn('  ⚠️  Could not sample embeddings');
    return;
  }

  // Check dimensions
  const dimensions = new Set(sample.map(s => (s.embedding as number[])?.length));
  logger.info(`  Embedding dimensions: ${Array.from(dimensions).join(', ')}`);

  if (dimensions.size > 1) {
    issues.push({
      type: 'critical',
      category: 'Embeddings',
      description: `Inconsistent embedding dimensions: ${Array.from(dimensions).join(', ')}`,
      affectedItems: [],
      recommendation: 'Re-generate all embeddings with same model to ensure consistency'
    });
  }
}

/**
 * Show sample chunks for manual review
 */
async function showSampleChunks(): Promise<void> {
  logger.info('\n📖 Sample Chunks for Manual Review:');

  const { data: samples } = await supabase
    .from('chunks')
    .select('party_abbreviation, content')
    .limit(3);

  if (!samples || samples.length === 0) {
    logger.warn('  No chunks available');
    return;
  }

  samples.forEach((sample, idx) => {
    logger.info(`\n  Sample ${idx + 1} (${sample.party_abbreviation}):`);
    logger.info(`  ${'-'.repeat(60)}`);
    const preview = sample.content.substring(0, 300);
    logger.info(`  ${preview}${sample.content.length > 300 ? '...' : ''}`);
    logger.info(`  ${'-'.repeat(60)}`);
    logger.info(`  Length: ${sample.content.length} chars`);
  });
}

/**
 * Generate quality report
 */
async function generateReport(): Promise<void> {
  logger.info('\n' + '='.repeat(70));
  logger.info('📊 QUALITY REPORT SUMMARY');
  logger.info('='.repeat(70));

  const critical = issues.filter(i => i.type === 'critical');
  const warnings = issues.filter(i => i.type === 'warning');
  const info = issues.filter(i => i.type === 'info');

  logger.info(`\n🔴 Critical Issues: ${critical.length}`);
  critical.forEach(issue => {
    logger.error(`\n  ${issue.category}: ${issue.description}`);
    if (issue.affectedItems.length > 0) {
      logger.error(`  Affected (showing first 5): ${issue.affectedItems.slice(0, 5).join(', ')}`);
    }
    logger.error(`  💡 Recommendation: ${issue.recommendation}`);
  });

  logger.info(`\n⚠️  Warnings: ${warnings.length}`);
  warnings.forEach(issue => {
    logger.warn(`\n  ${issue.category}: ${issue.description}`);
    if (issue.affectedItems.length > 0) {
      logger.warn(`  Affected (showing first 5): ${issue.affectedItems.slice(0, 5).join(', ')}`);
    }
    logger.warn(`  💡 Recommendation: ${issue.recommendation}`);
  });

  if (info.length > 0) {
    logger.info(`\nℹ️  Info: ${info.length}`);
    info.forEach(issue => {
      logger.info(`\n  ${issue.category}: ${issue.description}`);
      logger.info(`  💡 Note: ${issue.recommendation}`);
    });
  }

  // Overall assessment
  logger.info('\n' + '='.repeat(70));
  logger.info('🏥 OVERALL ASSESSMENT:');

  if (critical.length > 0) {
    logger.error('  STATUS: CRITICAL - Immediate action required before re-ingestion');
  } else if (warnings.length > 0) {
    logger.warn('  STATUS: NEEDS ATTENTION - Consider fixing warnings before re-ingestion');
  } else {
    logger.info('  STATUS: GOOD - Content quality is acceptable for re-ingestion');
  }

  logger.info('\n💡 RECOMMENDED NEXT STEPS:');
  if (critical.length > 0 || warnings.length > 0) {
    logger.info('  1. Fix critical issues first');
    logger.info('  2. Address warnings if possible');
    logger.info('  3. Run this analysis again');
    logger.info('  4. Proceed with quality re-ingestion');
  } else {
    logger.info('  1. Proceed with quality re-ingestion:');
    logger.info('     pnpm --filter backend run reingest:top5');
    logger.info('  2. Run pre-compute with quality settings:');
    logger.info('     pnpm --filter backend run precompute:quality');
  }

  logger.info('\n' + '='.repeat(70));
}

/**
 * Main execution
 */
async function main() {
  logger.info('🔍 Starting Content Quality Analysis');
  logger.info('='.repeat(70));

  await analyzePDFs();
  await analyzeDocuments();
  await analyzeChunks();
  await analyzeEmbeddings();
  await showSampleChunks();
  await generateReport();
}

try {
  await main();
} catch (error) {
  logger.error('Fatal error:', error);
  process.exit(1);
}
