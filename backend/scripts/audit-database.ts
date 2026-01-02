/**
 * Complete Database Audit Script
 *
 * Audits all tables and data quality:
 * - Parties
 * - Documents
 * - Chunks
 * - Embeddings
 * - Comparisons Cache
 * - Users
 *
 * Provides recommendations for maintenance
 */

import { createSupabaseClient } from '../src/db/supabase.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('DatabaseAudit');
const supabase = createSupabaseClient();

interface AuditResult {
  table: string;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  stats: Record<string, any>;
  recommendations: string[];
}

async function auditParties(): Promise<AuditResult> {
  logger.info('\n📋 Auditing PARTIES table...');

  const result: AuditResult = {
    table: 'parties',
    status: 'healthy',
    issues: [],
    stats: {},
    recommendations: []
  };

  try {
    // Total count
    const { count: total, error: countError } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    result.stats.total = total;

    // Get all parties
    const { data: parties, error } = await supabase
      .from('parties')
      .select('id, name, abbreviation, slug, logo_url');

    if (error) throw error;

    // Check for missing required fields
    const missingAbbr = parties?.filter(p => !p.abbreviation).length || 0;
    const missingSlug = parties?.filter(p => !p.slug).length || 0;
    const missingLogo = parties?.filter(p => !p.logo_url).length || 0;

    result.stats.missingAbbreviation = missingAbbr;
    result.stats.missingSlug = missingSlug;
    result.stats.missingLogo = missingLogo;

    // Issues
    if (missingAbbr > 0) {
      result.issues.push(`${missingAbbr} parties missing abbreviation`);
      result.status = 'warning';
    }
    if (missingSlug > 0) {
      result.issues.push(`${missingSlug} parties missing slug`);
      result.status = 'warning';
    }

    // Recommendations
    if (missingLogo > 0) {
      result.recommendations.push(`Upload logos for ${missingLogo} parties`);
    }

    logger.info(`  Total parties: ${total}`);
    logger.info(`  Missing abbreviation: ${missingAbbr}`);
    logger.info(`  Missing slug: ${missingSlug}`);
    logger.info(`  Missing logo: ${missingLogo}`);

  } catch (error) {
    result.status = 'critical';
    result.issues.push(`Error auditing parties: ${error}`);
  }

  return result;
}

async function auditDocuments(): Promise<AuditResult> {
  logger.info('\n📄 Auditing DOCUMENTS table...');

  const result: AuditResult = {
    table: 'documents',
    status: 'healthy',
    issues: [],
    stats: {},
    recommendations: []
  };

  try {
    // Total documents
    const { count: total, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    result.stats.total = total || 0;

    if (total === 0) {
      result.status = 'critical';
      result.issues.push('NO DOCUMENTS in database');
      result.recommendations.push('Run: pnpm tsx scripts/reingest-all-plans.ts');
      logger.warn('  ⚠️  NO DOCUMENTS FOUND!');
      return result;
    }

    // Documents per party
    const { data: byParty, error: byPartyError } = await supabase
      .from('documents')
      .select('party_id, parties!inner(abbreviation, name)');

    if (byPartyError) throw byPartyError;

    const partyCounts: Record<string, number> = {};
    byParty?.forEach((doc: any) => {
      const abbr = doc.parties?.abbreviation || 'Unknown';
      partyCounts[abbr] = (partyCounts[abbr] || 0) + 1;
    });

    result.stats.byParty = partyCounts;

    // Check for parties without documents
    const { data: allParties } = await supabase
      .from('parties')
      .select('abbreviation, name');

    const partiesWithoutDocs = allParties?.filter(p =>
      !partyCounts[p.abbreviation || '']
    );

    result.stats.partiesWithoutDocs = partiesWithoutDocs?.length || 0;

    if (partiesWithoutDocs && partiesWithoutDocs.length > 0) {
      result.status = 'warning';
      result.issues.push(`${partiesWithoutDocs.length} parties have no documents`);
      result.recommendations.push(`Ingest documents for: ${partiesWithoutDocs.map(p => p.abbreviation).join(', ')}`);
    }

    logger.info(`  Total documents: ${total}`);
    logger.info(`  Documents by party:`, partyCounts);
    logger.info(`  Parties without docs: ${partiesWithoutDocs?.length || 0}`);

  } catch (error) {
    result.status = 'critical';
    result.issues.push(`Error auditing documents: ${error}`);
  }

  return result;
}

async function auditChunks(): Promise<AuditResult> {
  logger.info('\n📝 Auditing CHUNKS table...');

  const result: AuditResult = {
    table: 'chunks',
    status: 'healthy',
    issues: [],
    stats: {},
    recommendations: []
  };

  try {
    // Total chunks
    const { count: total, error: countError } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    result.stats.total = total || 0;

    if (total === 0) {
      result.status = 'critical';
      result.issues.push('NO CHUNKS in database');
      result.recommendations.push('Documents exist but not chunked - check ingestion pipeline');
      logger.warn('  ⚠️  NO CHUNKS FOUND!');
      return result;
    }

    // Chunks with embeddings
    const { count: withEmbeddings, error: embError } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    if (embError) throw embError;

    const embeddingPercent = total ? ((withEmbeddings || 0) / total * 100).toFixed(2) : '0';
    result.stats.withEmbeddings = withEmbeddings || 0;
    result.stats.withoutEmbeddings = (total || 0) - (withEmbeddings || 0);
    result.stats.embeddingPercent = embeddingPercent;

    if (withEmbeddings === 0) {
      result.status = 'critical';
      result.issues.push('NO EMBEDDINGS generated');
      result.recommendations.push('Run embedding generation script');
    } else if ((withEmbeddings || 0) < (total || 0)) {
      result.status = 'warning';
      result.issues.push(`Only ${embeddingPercent}% of chunks have embeddings`);
      result.recommendations.push('Generate embeddings for remaining chunks');
    }

    // Chunks per party
    const { data: byParty, error: byPartyError } = await supabase
      .from('chunks')
      .select('party_abbreviation');

    if (byPartyError) throw byPartyError;

    const partyCounts: Record<string, number> = {};
    byParty?.forEach((chunk: any) => {
      const abbr = chunk.party_abbreviation || 'Unknown';
      partyCounts[abbr] = (partyCounts[abbr] || 0) + 1;
    });

    result.stats.byParty = partyCounts;

    // Average chunk size
    const { data: sampleChunks } = await supabase
      .from('chunks')
      .select('content')
      .limit(100);

    if (sampleChunks && sampleChunks.length > 0) {
      const avgLength = sampleChunks.reduce((sum, c) => sum + (c.content?.length || 0), 0) / sampleChunks.length;
      result.stats.avgChunkLength = Math.round(avgLength);

      if (avgLength < 100) {
        result.issues.push('Chunks are very short (avg < 100 chars)');
        result.status = 'warning';
      } else if (avgLength > 2000) {
        result.issues.push('Chunks are very long (avg > 2000 chars)');
        result.status = 'warning';
      }
    }

    logger.info(`  Total chunks: ${total}`);
    logger.info(`  With embeddings: ${withEmbeddings} (${embeddingPercent}%)`);
    logger.info(`  Without embeddings: ${result.stats.withoutEmbeddings}`);
    logger.info(`  Average chunk length: ${result.stats.avgChunkLength} chars`);
    logger.info(`  Chunks by party:`, partyCounts);

  } catch (error) {
    result.status = 'critical';
    result.issues.push(`Error auditing chunks: ${error}`);
  }

  return result;
}

async function auditEmbeddings(): Promise<AuditResult> {
  logger.info('\n🔢 Auditing EMBEDDINGS quality...');

  const result: AuditResult = {
    table: 'embeddings',
    status: 'healthy',
    issues: [],
    stats: {},
    recommendations: []
  };

  try {
    // Sample embeddings to check dimensions
    const { data: sampleChunks, error } = await supabase
      .from('chunks')
      .select('id, embedding')
      .not('embedding', 'is', null)
      .limit(10);

    if (error) throw error;

    if (!sampleChunks || sampleChunks.length === 0) {
      result.status = 'critical';
      result.issues.push('No embeddings found to analyze');
      return result;
    }

    // Check embedding dimensions
    const dimensions = new Set<number>();
    sampleChunks.forEach(chunk => {
      if (chunk.embedding && Array.isArray(chunk.embedding)) {
        dimensions.add(chunk.embedding.length);
      }
    });

    result.stats.embeddingDimensions = Array.from(dimensions);
    result.stats.sampleSize = sampleChunks.length;

    if (dimensions.size > 1) {
      result.status = 'critical';
      result.issues.push(`Inconsistent embedding dimensions: ${Array.from(dimensions).join(', ')}`);
      result.recommendations.push('Re-generate all embeddings with same model');
    }

    // Check for null/zero embeddings
    const hasNullValues = sampleChunks.some(chunk =>
      chunk.embedding && chunk.embedding.some((v: number) => v === null || v === undefined)
    );

    if (hasNullValues) {
      result.status = 'warning';
      result.issues.push('Some embeddings contain null values');
    }

    logger.info(`  Sample size: ${sampleChunks.length}`);
    logger.info(`  Embedding dimensions: ${Array.from(dimensions).join(', ')}`);
    logger.info(`  Has null values: ${hasNullValues ? 'Yes ⚠️' : 'No ✅'}`);

  } catch (error) {
    result.status = 'critical';
    result.issues.push(`Error auditing embeddings: ${error}`);
  }

  return result;
}

async function auditComparisonsCache(): Promise<AuditResult> {
  logger.info('\n💾 Auditing COMPARISONS_CACHE table...');

  const result: AuditResult = {
    table: 'comparisons_cache',
    status: 'healthy',
    issues: [],
    stats: {},
    recommendations: []
  };

  try {
    const { count: total, error: countError } = await supabase
      .from('comparisons_cache')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    result.stats.total = total || 0;

    if (total === 0) {
      result.status = 'warning';
      result.issues.push('Cache is empty');
      result.recommendations.push('Run: pnpm tsx scripts/precompute-comparisons.ts');
      logger.warn('  ⚠️  Cache is empty');
      return result;
    }

    // Get all entries
    const { data: entries, error } = await supabase
      .from('comparisons_cache')
      .select('*');

    if (error) throw error;

    // Analyze quality
    let entriesWithIssues = 0;
    let totalSinInfo = 0;
    let totalLowConfidence = 0;
    const now = new Date();
    let expired = 0;

    entries?.forEach(entry => {
      let hasIssue = false;

      // Check expiration
      if (entry.expires_at && new Date(entry.expires_at) < now) {
        expired++;
      }

      // Check comparisons
      if (!entry.comparisons || entry.comparisons.length === 0) {
        hasIssue = true;
      } else {
        entry.comparisons.forEach((comp: any) => {
          if (comp.state === 'sin_informacion') {
            totalSinInfo++;
            hasIssue = true;
          }
          if (comp.confidence < 0.3) {
            totalLowConfidence++;
          }
        });
      }

      if (hasIssue) entriesWithIssues++;
    });

    result.stats.entriesWithIssues = entriesWithIssues;
    result.stats.totalSinInfo = totalSinInfo;
    result.stats.totalLowConfidence = totalLowConfidence;
    result.stats.expired = expired;
    result.stats.issuePercent = ((entriesWithIssues / (total || 1)) * 100).toFixed(2);

    if (entriesWithIssues > total! * 0.3) {
      result.status = 'critical';
      result.issues.push(`${result.stats.issuePercent}% of cache has issues`);
      result.recommendations.push('Clear cache and re-run precompute after fixing documents');
    } else if (entriesWithIssues > 0) {
      result.status = 'warning';
      result.issues.push(`${entriesWithIssues} cache entries have quality issues`);
    }

    if (expired > 0) {
      result.recommendations.push(`Clear ${expired} expired cache entries`);
    }

    logger.info(`  Total entries: ${total}`);
    logger.info(`  Entries with issues: ${entriesWithIssues} (${result.stats.issuePercent}%)`);
    logger.info(`  "Sin información": ${totalSinInfo}`);
    logger.info(`  Low confidence (<0.3): ${totalLowConfidence}`);
    logger.info(`  Expired: ${expired}`);

  } catch (error) {
    result.status = 'critical';
    result.issues.push(`Error auditing cache: ${error}`);
  }

  return result;
}

async function auditUsers(): Promise<AuditResult> {
  logger.info('\n👥 Auditing USERS table...');

  const result: AuditResult = {
    table: 'users',
    status: 'healthy',
    issues: [],
    stats: {},
    recommendations: []
  };

  try {
    const { count: total, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Count by tier
    const { data: users, error } = await supabase
      .from('users')
      .select('tier, created_at');

    if (error) throw error;

    const tierCounts: Record<string, number> = {};
    users?.forEach(user => {
      tierCounts[user.tier] = (tierCounts[user.tier] || 0) + 1;
    });

    result.stats.total = total;
    result.stats.byTier = tierCounts;
    result.stats.adminCount = tierCounts['admin'] || 0;

    if (result.stats.adminCount === 0) {
      result.status = 'warning';
      result.issues.push('No admin users found');
      result.recommendations.push('Create at least one admin user');
    }

    logger.info(`  Total users: ${total}`);
    logger.info(`  By tier:`, tierCounts);

  } catch (error) {
    result.status = 'critical';
    result.issues.push(`Error auditing users: ${error}`);
  }

  return result;
}

async function runFullAudit() {
  logger.info('🔍 Starting Full Database Audit');
  logger.info('='.repeat(60));

  const results: AuditResult[] = [];

  // Run all audits
  results.push(await auditParties());
  results.push(await auditDocuments());
  results.push(await auditChunks());
  results.push(await auditEmbeddings());
  results.push(await auditComparisonsCache());
  results.push(await auditUsers());

  // Summary
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 AUDIT SUMMARY');
  logger.info('='.repeat(60));

  const critical = results.filter(r => r.status === 'critical');
  const warnings = results.filter(r => r.status === 'warning');
  const healthy = results.filter(r => r.status === 'healthy');

  logger.info(`\n🔴 Critical Issues: ${critical.length}`);
  critical.forEach(r => {
    logger.error(`  ${r.table}:`);
    r.issues.forEach(issue => logger.error(`    - ${issue}`));
  });

  logger.info(`\n⚠️  Warnings: ${warnings.length}`);
  warnings.forEach(r => {
    logger.warn(`  ${r.table}:`);
    r.issues.forEach(issue => logger.warn(`    - ${issue}`));
  });

  logger.info(`\n✅ Healthy: ${healthy.length}`);
  healthy.forEach(r => {
    logger.info(`  ${r.table}`);
  });

  // All recommendations
  const allRecommendations = results.flatMap(r => r.recommendations);
  if (allRecommendations.length > 0) {
    logger.info('\n💡 RECOMMENDATIONS:');
    allRecommendations.forEach((rec, idx) => {
      logger.info(`  ${idx + 1}. ${rec}`);
    });
  }

  // Overall health
  logger.info('\n🏥 OVERALL HEALTH:');
  if (critical.length > 0) {
    logger.error('  STATUS: CRITICAL - Immediate action required');
  } else if (warnings.length > 0) {
    logger.warn('  STATUS: WARNING - Attention needed');
  } else {
    logger.info('  STATUS: HEALTHY - All systems operational');
  }

  logger.info('\n' + '='.repeat(60));
}

try {
  await runFullAudit();
} catch (error) {
  logger.error('Fatal error during audit:', error);
  process.exit(1);
}
