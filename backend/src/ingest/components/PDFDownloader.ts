import fs from 'fs/promises';
import path from 'path';
import axios, { AxiosError } from 'axios';
import type { PDFDocument } from '../types/ingest.types.js';

interface DownloadConfig {
    maxConcurrentDownloads: number;
    retryAttempts: number;
    retryDelayMs: number;
    downloadTimeout: number;
    outputDir: string;
}

interface DocumentMetadata {
    party: string;
    candidate: string;
    year: number;
    sourceUrl: string;
}

interface DownloadResult {
    documentId: string;
    filePath: string;
    fileSize: number;
    downloadedAt: Date;
    status: 'success' | 'failed';
    metadata?: DocumentMetadata;
    error?: string;
    errorType?: 'network' | 'timeout' | 'validation' | 'filesystem' | 'unknown';
    httpStatus?: number;
}
interface ErrorClassification {
    type: 'network' | 'timeout' | 'validation' | 'filesystem' | 'unknown';
    httpStatus?: number;
}

interface DownloadRequest {
    url: string;
    documentId: string;
    metadata?: DocumentMetadata;
}

export class PDFDownloader {
    private config: DownloadConfig;
    private isInitialized = false;

    constructor(config: Partial<DownloadConfig> = {}) {
        this.config = {
            maxConcurrentDownloads: config.maxConcurrentDownloads || 3,
            retryAttempts: config.retryAttempts || 3,
            retryDelayMs: config.retryDelayMs || 1000,
            downloadTimeout: config.downloadTimeout || 30000,
            outputDir: config.outputDir || './downloads/pdfs',
        };
    }

    /**
     * Ensure output directory exists
     * Called once before first download
     */
    private async ensureOutputDir(): Promise<void> {
        if (!this.isInitialized) {
            await fs.mkdir(this.config.outputDir, { recursive: true });
            this.isInitialized = true;
        }
    }

    /**
     * Validate PDF file by checking magic bytes
     * PDFs start with "%PDF-" (bytes: 0x25 0x50 0x44 0x46 0x2D)
     */
    private isPDF(buffer: Buffer): boolean {
        if (buffer.length < 5) return false;
        const header = buffer.slice(0, 5).toString('ascii');
        return header === '%PDF-';
    }

    /**
     * Classify error type for better error handling
     */
    private classifyError(error: unknown): ErrorClassification {
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                return { type: 'timeout' };
            }
            if (error.response) {
                return { type: 'network', httpStatus: error.response.status };
            }
            return { type: 'network' };
        }
        if (error instanceof Error && error.message.includes('ENOENT')) {
            return { type: 'filesystem' };
        }
        return { type: 'unknown' };
    }

    /**
     * Download a single PDF file
     * @param url - PDF URL to download
     * @param documentId - Unique identifier for the document
     * @param metadata - Optional metadata (party, candidate, year, sourceUrl)
     */
    async download(
        url: string,
        documentId: string,
        metadata?: DocumentMetadata
    ): Promise<DownloadResult> {
        let lastError: Error | null = null;
        let errorClassification: ErrorClassification = { type: 'unknown' };

        // Ensure output directory exists
        await this.ensureOutputDir();

        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            try {
                const filePath = path.join(this.config.outputDir, `${documentId}.pdf`);

                // Download the PDF file
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: this.config.downloadTimeout,
                });

                // Validate it's actually a PDF
                const buffer = Buffer.from(response.data);
                if (!this.isPDF(buffer)) {
                    throw new Error('Downloaded file is not a valid PDF');
                }

                // Save to disk
                await fs.writeFile(filePath, buffer);

                // Get file stats
                const stats = await fs.stat(filePath);

                return {
                    documentId,
                    filePath,
                    fileSize: stats.size,
                    downloadedAt: new Date(),
                    status: 'success',
                    metadata,
                };
            } catch (error) {
                lastError = error as Error;
                errorClassification = this.classifyError(error);

                console.error(
                    `Failed to download PDF ${documentId} (attempt ${attempt + 1}/${this.config.retryAttempts}):`,
                    {
                        error: lastError.message,
                        type: errorClassification.type,
                        httpStatus: errorClassification.httpStatus,
                        url,
                    }
                );

                if (attempt < this.config.retryAttempts - 1) {
                    await this.sleep(this.config.retryDelayMs * (attempt + 1));
                }
            }
        }

        // If we get here, all retry attempts failed
        return {
            documentId,
            filePath: '',
            fileSize: 0,
            downloadedAt: new Date(),
            status: 'failed',
            metadata,
            error: lastError?.message,
            errorType: errorClassification.type,
            httpStatus: errorClassification.httpStatus,
        };
    }

    /**
     * Download multiple PDFs in batches with concurrency control
     * @param requests - Array of download requests
     */
    async downloadBatch(requests: DownloadRequest[]): Promise<DownloadResult[]> {
        const results: DownloadResult[] = [];
        const batches = this.chunkArray(requests, this.config.maxConcurrentDownloads);

        for (const batch of batches) {
            const batchResults = await Promise.all(
                batch.map(({ url, documentId, metadata }) =>
                    this.download(url, documentId, metadata)
                )
            );
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Split array into chunks of specified size
     */
    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}