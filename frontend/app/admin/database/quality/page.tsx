'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Database,
  Hash,
  Zap,
  Info,
} from 'lucide-react';

interface QualityIssue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  count: number;
  affectedItems: string[];
  recommendation: string;
}

interface QualityReport {
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

async function fetchQualityReport(): Promise<QualityReport> {
  const response = await api.get<{ success: boolean; data: QualityReport }>('/api/quality/analyze');
  return response.data;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function StatusBadge({ status }: { status: 'critical' | 'warning' | 'good' }) {
  const variants = {
    critical: { color: 'bg-red-500/10 text-red-700 dark:text-red-400', label: 'Critical', icon: XCircle },
    warning: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', label: 'Warning', icon: AlertTriangle },
    good: { color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400', label: 'Good', icon: CheckCircle2 },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <Badge className={variant.color}>
      <Icon className="mr-1 size-3" />
      {variant.label}
    </Badge>
  );
}

function IssuesList({ issues }: { issues: QualityIssue[] }) {
  const criticalIssues = issues.filter(i => i.type === 'critical');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  return (
    <div className="space-y-4">
      {criticalIssues.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
            <XCircle className="size-4" />
            Critical Issues ({criticalIssues.length})
          </h3>
          <div className="space-y-2">
            {criticalIssues.map((issue, idx) => (
              <Alert key={idx} className="border-red-500/50">
                <AlertDescription>
                  <div className="font-medium">{issue.category}: {issue.description}</div>
                  {issue.count > 0 && <div className="text-sm text-muted-foreground">Count: {issue.count}</div>}
                  <div className="mt-2 text-sm">
                    💡 <span className="font-medium">Recommendation:</span> {issue.recommendation}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4" />
            Warnings ({warnings.length})
          </h3>
          <div className="space-y-2">
            {warnings.map((issue, idx) => (
              <Alert key={idx} className="border-amber-500/50">
                <AlertDescription>
                  <div className="font-medium">{issue.category}: {issue.description}</div>
                  {issue.count > 0 && <div className="text-sm text-muted-foreground">Count: {issue.count}</div>}
                  <div className="mt-2 text-sm">
                    💡 <span className="font-medium">Recommendation:</span> {issue.recommendation}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {infos.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Info className="size-4" />
            Information ({infos.length})
          </h3>
          <div className="space-y-2">
            {infos.map((issue, idx) => (
              <Alert key={idx}>
                <AlertDescription>
                  <div className="font-medium">{issue.category}: {issue.description}</div>
                  {issue.count > 0 && <div className="text-sm text-muted-foreground">Count: {issue.count}</div>}
                  <div className="mt-2 text-sm text-muted-foreground">{issue.recommendation}</div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {issues.length === 0 && (
        <Alert className="border-teal-500/50">
          <CheckCircle2 className="size-4" />
          <AlertDescription>
            No issues found! Content quality is good.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function QualityAnalysisPage() {
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['quality-analysis'],
    queryFn: fetchQualityReport,
    staleTime: 0, // Always fresh
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Analyzing content quality...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Alert className="max-w-md border-red-500/50">
          <XCircle className="size-4" />
          <AlertDescription>
            Error loading quality report: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Quality Analysis</h1>
          <p className="text-muted-foreground">
            Analyze PDFs, documents, chunks, and embeddings quality
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Overall Status
            <StatusBadge status={report.overallStatus} />
          </CardTitle>
          <CardDescription>
            {report.overallStatus === 'critical' && 'Critical issues found - immediate action required'}
            {report.overallStatus === 'warning' && 'Some warnings - consider addressing before production'}
            {report.overallStatus === 'good' && 'Content quality is good - ready for use'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* PDFs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDFs</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.pdfs.total}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatBytes(report.pdfs.avgSize)}
            </p>
            {report.pdfs.smallFiles.length > 0 && (
              <Badge className="mt-2 bg-amber-500/10 text-amber-700">
                {report.pdfs.smallFiles.length} small files
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <Database className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.documents.total}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(report.documents.byParty).length} parties
            </p>
            {report.documents.total === 0 && (
              <Badge className="mt-2 bg-red-500/10 text-red-700">
                Empty
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Chunks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chunks</CardTitle>
            <Hash className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.chunks.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {report.chunks.avgLength} chars
            </p>
            {(report.chunks.veryShort > 0 || report.chunks.encodingIssues > 0) && (
              <Badge className="mt-2 bg-amber-500/10 text-amber-700">
                Issues found
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Embeddings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Embeddings</CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.embeddings.percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {report.embeddings.withEmbeddings.toLocaleString()} / {report.embeddings.total.toLocaleString()}
            </p>
            {report.embeddings.percentage < 100 && (
              <Badge className="mt-2 bg-amber-500/10 text-amber-700">
                Incomplete
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Issues Found</CardTitle>
          <CardDescription>
            {report.issues.length} total issues detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssuesList issues={report.issues} />
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chunks Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Chunks Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell>{report.chunks.total.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Length</TableCell>
                  <TableCell>{report.chunks.avgLength} chars</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Min / Max</TableCell>
                  <TableCell>{report.chunks.minLength} / {report.chunks.maxLength}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Very Short (&lt; 50)</TableCell>
                  <TableCell>
                    {report.chunks.veryShort}
                    {report.chunks.veryShort > 0 && (
                      <Badge className="ml-2 bg-amber-500/10 text-amber-700">
                        {((report.chunks.veryShort / report.chunks.total) * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Very Long (&gt; 2000)</TableCell>
                  <TableCell>
                    {report.chunks.veryLong}
                    {report.chunks.veryLong > 0 && (
                      <Badge className="ml-2">
                        {((report.chunks.veryLong / report.chunks.total) * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Encoding Issues</TableCell>
                  <TableCell>
                    {report.chunks.encodingIssues}
                    {report.chunks.encodingIssues > 0 && (
                      <Badge className="ml-2 bg-red-500/10 text-red-700">
                        Critical
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Excessive Whitespace</TableCell>
                  <TableCell>
                    {report.chunks.excessiveWhitespace}
                    {report.chunks.excessiveWhitespace > 0 && (
                      <Badge className="ml-2 bg-amber-500/10 text-amber-700">
                        {((report.chunks.excessiveWhitespace / report.chunks.total) * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Embeddings Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Embeddings Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Chunks</TableCell>
                  <TableCell>{report.embeddings.total.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">With Embeddings</TableCell>
                  <TableCell>{report.embeddings.withEmbeddings.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Coverage</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {report.embeddings.percentage}%
                      {report.embeddings.percentage === 100 ? (
                        <CheckCircle2 className="size-4 text-teal-500" />
                      ) : (
                        <AlertTriangle className="size-4 text-amber-500" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Dimensions</TableCell>
                  <TableCell>
                    {report.embeddings.dimensions.join(', ') || 'N/A'}
                    {report.embeddings.dimensions.length > 1 && (
                      <Badge className="ml-2 bg-red-500/10 text-red-700">
                        Inconsistent!
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Sample Chunks */}
      {report.samples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Chunks</CardTitle>
            <CardDescription>
              Random chunks for manual review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.samples.map((sample, idx) => (
              <div key={idx} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge>{sample.party}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {sample.length} chars
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto rounded bg-muted p-3 font-mono text-xs">
                  {sample.content.substring(0, 500)}
                  {sample.content.length > 500 && '...'}
                </div>
                {sample.hasIssues && (
                  <Badge className="mt-2 bg-amber-500/10 text-amber-700">
                    <AlertTriangle className="mr-1 size-3" />
                    Has Issues
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.overallStatus === 'critical' && (
              <>
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">1</div>
                  <p className="text-sm">Fix critical issues before proceeding</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">2</div>
                  <p className="text-sm">Run quality analysis again to verify fixes</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">3</div>
                  <p className="text-sm">Proceed with re-ingestion when ready</p>
                </div>
              </>
            )}
            {report.overallStatus === 'warning' && (
              <>
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">1</div>
                  <p className="text-sm">Review warnings and decide if fixes are needed</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">2</div>
                  <p className="text-sm">Consider re-ingestion with optimized parameters</p>
                </div>
              </>
            )}
            {report.overallStatus === 'good' && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-5 text-teal-500" />
                  <p className="text-sm">Content quality is good - ready for production use</p>
                </div>
                <div className="mt-4">
                  <Button>
                    Proceed to Re-ingestion
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
