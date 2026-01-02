import { SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

export interface QualityIssue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  count: number;
  affectedItems: string[];
  recommendation: string;
}

export interface ContentQualityReport {
  pdfs: {
    total: number;
    avgSize: number;
    minSize: number;
    maxSize: number;
    smallFiles: string[];
    largeFiles: string[];
  };
  documents: {
    total: number;
    byParty: Record<string, number>;
    missingPageCount: number;
  };
  chunks: {
    total: number;
    avgLength: number;
    minLength: number;
    maxLength: number;
    veryShort: number;
    veryLong: number;
    excessiveWhitespace: number;
    encodingIssues: number;
    byParty: Record<string, number>;
  };
  embeddings: {
    total: number;
    withEmbeddings: number;
    percentage: number;
    dimensions: number[];
  };
  samples: Array<{
    party: string;
    content: string;
    length: number;
    hasIssues: boolean;
  }>;
  issues: QualityIssue[];
  overallStatus: 'critical' | 'warning' | 'good';
}

export class QualityAnalysisService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Run complete quality analysis
   */
  async analyzeQuality(): Promise<ContentQualityReport> {
    const issues: QualityIssue[] = [];

    // Analyze PDFs
    const pdfAnalysis = await this.analyzePDFs();
    if (pdfAnalysis.smallFiles.length > 0) {
      issues.push({
        type: 'warning',
        category: 'PDFs',
        description: 'PDFs suspiciously small (< 100KB)',
        count: pdfAnalysis.smallFiles.length,
        affectedItems: pdfAnalysis.smallFiles,
        recommendation: 'Re-download these PDFs - they may be corrupted'
      });
    }

    // Analyze documents
    const docsAnalysis = await this.analyzeDocuments();
    if (docsAnalysis.total === 0) {
      issues.push({
        type: 'critical',
        category: 'Documents',
        description: 'No documents in database',
        count: 0,
        affectedItems: [],
        recommendation: 'Run ingestion to populate database'
      });
    }

    // Analyze chunks
    const chunksAnalysis = await this.analyzeChunks();
    if (chunksAnalysis.total === 0) {
      issues.push({
        type: 'critical',
        category: 'Chunks',
        description: 'No chunks in database',
        count: 0,
        affectedItems: [],
        recommendation: 'Run ingestion with chunking enabled'
      });
    }

    if (chunksAnalysis.veryShort > 0) {
      issues.push({
        type: 'warning',
        category: 'Chunks',
        description: 'Very short chunks (< 50 chars)',
        count: chunksAnalysis.veryShort,
        affectedItems: [],
        recommendation: 'These may be headers or artifacts - filter during ingestion'
      });
    }

    if (chunksAnalysis.encodingIssues > 0) {
      issues.push({
        type: 'critical',
        category: 'Text Quality',
        description: 'Chunks with encoding issues (� characters)',
        count: chunksAnalysis.encodingIssues,
        affectedItems: [],
        recommendation: 'Fix PDF extraction encoding - use UTF-8'
      });
    }

    if (chunksAnalysis.excessiveWhitespace > 0) {
      issues.push({
        type: 'warning',
        category: 'Text Quality',
        description: 'Chunks with excessive whitespace (> 40%)',
        count: chunksAnalysis.excessiveWhitespace,
        affectedItems: [],
        recommendation: 'Improve text cleaning during PDF extraction'
      });
    }

    // Analyze embeddings
    const embAnalysis = await this.analyzeEmbeddings();
    if (embAnalysis.withEmbeddings < embAnalysis.total) {
      const missing = embAnalysis.total - embAnalysis.withEmbeddings;
      issues.push({
        type: 'warning',
        category: 'Embeddings',
        description: 'Chunks missing embeddings',
        count: missing,
        affectedItems: [],
        recommendation: 'Run embedding generation script'
      });
    }

    if (embAnalysis.dimensions.length > 1) {
      issues.push({
        type: 'critical',
        category: 'Embeddings',
        description: 'Inconsistent embedding dimensions',
        count: embAnalysis.dimensions.length,
        affectedItems: embAnalysis.dimensions.map(String),
        recommendation: 'Re-generate all embeddings with same model'
      });
    }

    // Get samples
    const samples = await this.getSamples();

    // Determine overall status
    const critical = issues.filter(i => i.type === 'critical');
    const warnings = issues.filter(i => i.type === 'warning');

    let overallStatus: 'critical' | 'warning' | 'good';
    if (critical.length > 0) {
      overallStatus = 'critical';
    } else if (warnings.length > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'good';
    }

    return {
      pdfs: pdfAnalysis,
      documents: docsAnalysis,
      chunks: chunksAnalysis,
      embeddings: embAnalysis,
      samples,
      issues,
      overallStatus
    };
  }

  /**
   * Analyze PDFs
   */
  private async analyzePDFs(): Promise<ContentQualityReport['pdfs']> {
    const pdfDir = path.join(process.cwd(), 'backend', 'downloads', 'pdfs');

    try {
      const files = await fs.readdir(pdfDir);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));

      const fileSizes: Record<string, number> = {};
      for (const file of pdfFiles) {
        const filePath = path.join(pdfDir, file);
        const stats = await fs.stat(filePath);
        fileSizes[file] = stats.size;
      }

      const sizes = Object.values(fileSizes);
      const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length || 0;

      return {
        total: pdfFiles.length,
        avgSize: Math.round(avgSize),
        minSize: Math.min(...sizes, 0),
        maxSize: Math.max(...sizes, 0),
        smallFiles: Object.entries(fileSizes)
          .filter(([, size]) => size < 100 * 1024)
          .map(([name]) => name),
        largeFiles: Object.entries(fileSizes)
          .filter(([, size]) => size > 50 * 1024 * 1024)
          .map(([name]) => name)
      };
    } catch {
      return {
        total: 0,
        avgSize: 0,
        minSize: 0,
        maxSize: 0,
        smallFiles: [],
        largeFiles: []
      };
    }
  }

  /**
   * Analyze documents
   */
  private async analyzeDocuments(): Promise<ContentQualityReport['documents']> {
    const { data: documents } = await this.supabase
      .from('documents')
      .select('party_id, page_count');

    if (!documents || documents.length === 0) {
      return {
        total: 0,
        byParty: {},
        missingPageCount: 0
      };
    }

    const byParty: Record<string, number> = {};
    documents.forEach((doc: any) => {
      const party = doc.party_id || 'Unknown';
      byParty[party] = (byParty[party] || 0) + 1;
    });

    const missingPageCount = documents.filter(
      (doc: any) => !doc.page_count || doc.page_count === 0
    ).length;

    return {
      total: documents.length,
      byParty,
      missingPageCount
    };
  }

  /**
   * Analyze chunks
   */
  private async analyzeChunks(): Promise<ContentQualityReport['chunks']> {
    const { count: total } = await this.supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true });

    if (!total) {
      return {
        total: 0,
        avgLength: 0,
        minLength: 0,
        maxLength: 0,
        veryShort: 0,
        veryLong: 0,
        excessiveWhitespace: 0,
        encodingIssues: 0,
        byParty: {}
      };
    }

    // Sample for analysis
    const { data: chunks } = await this.supabase
      .from('chunks')
      .select('content, party_abbreviation')
      .limit(1000);

    if (!chunks) {
      return {
        total: total || 0,
        avgLength: 0,
        minLength: 0,
        maxLength: 0,
        veryShort: 0,
        veryLong: 0,
        excessiveWhitespace: 0,
        encodingIssues: 0,
        byParty: {}
      };
    }

    const lengths = chunks.map(c => c.content?.length || 0);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    const byParty: Record<string, number> = {};
    chunks.forEach(c => {
      const party = c.party_abbreviation || 'Unknown';
      byParty[party] = (byParty[party] || 0) + 1;
    });

    return {
      total: total || 0,
      avgLength: Math.round(avgLength),
      minLength: Math.min(...lengths, 0),
      maxLength: Math.max(...lengths, 0),
      veryShort: chunks.filter(c => (c.content?.length || 0) < 50).length,
      veryLong: chunks.filter(c => (c.content?.length || 0) > 2000).length,
      excessiveWhitespace: chunks.filter(c => {
        const content = c.content || '';
        const whitespaceRatio = (content.match(/\s/g) || []).length / content.length;
        return whitespaceRatio > 0.4;
      }).length,
      encodingIssues: chunks.filter(c => {
        const content = c.content || '';
        return content.includes('�') || content.includes('\ufffd');
      }).length,
      byParty
    };
  }

  /**
   * Analyze embeddings
   */
  private async analyzeEmbeddings(): Promise<ContentQualityReport['embeddings']> {
    const { count: total } = await this.supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true });

    const { count: withEmbeddings } = await this.supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    const percentage = total ? ((withEmbeddings || 0) / total * 100) : 0;

    // Sample to check dimensions
    const { data: sample } = await this.supabase
      .from('chunks')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(10);

    const dimensions = sample
      ? Array.from(new Set(sample.map(s => (s.embedding as number[])?.length)))
      : [];

    return {
      total: total || 0,
      withEmbeddings: withEmbeddings || 0,
      percentage: Math.round(percentage),
      dimensions
    };
  }

  /**
   * Get sample chunks
   */
  private async getSamples(): Promise<ContentQualityReport['samples']> {
    const { data: chunks } = await this.supabase
      .from('chunks')
      .select('party_abbreviation, content')
      .limit(5);

    if (!chunks) return [];

    return chunks.map(chunk => ({
      party: chunk.party_abbreviation || 'Unknown',
      content: chunk.content || '',
      length: chunk.content?.length || 0,
      hasIssues:
        (chunk.content?.length || 0) < 50 ||
        (chunk.content || '').includes('�')
    }));
  }
}
