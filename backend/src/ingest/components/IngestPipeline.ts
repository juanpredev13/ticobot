import { PDFDownloader } from "./PDFDownloader";
import { PDFParser } from "./PDFParser";
import { TextCleaner } from "./TextCleaner";
import { TextChunker, TextChunk } from "./TextChunker";
import { ProviderFactory } from "./../../factory/ProviderFactory";
import { Logger } from "@ticobot/shared";
import path from "path";
import fs from "fs/promises";

export interface IngestOptions {
    downloadPath?: string;
    cleaningOptions?: any;
    chunkingOptions?: any;
    generateEmbeddings?: boolean;
    storeInVectorDB?: boolean;
}

export interface IngestResult {
    documentId: string;
    success: boolean;
    chunks?: TextChunk[];
    error?: string;
    stats: {
        downloadTime: number;
        parseTime: number;
        cleanTime: number;
        chunkTime: number;
        embeddingTime?: number;
        totalTime: number;
    };
}

export class IngestPipeline {
    private downloader: PDFDownloader;
    private parser: PDFParser;
    private cleaner: TextCleaner;
    private chunker: TextChunker;
    private logger: Logger;

    constructor() {
        this.downloader = new PDFDownloader();
        this.parser = new PDFParser();
        this.cleaner = new TextCleaner();
        this.chunker = new TextChunker();
        this.logger = new Logger("IngestPipeline");
    }

    /**
     * Run the complete ingestion pipeline for a PDF
     * @param url - PDF URL to download
     * @param documentId - Unique document identifier
     * @param options - Pipeline options
     * @returns Ingestion result with chunks
     */
    async ingest(
        url: string,
        documentId: string,
        options: IngestOptions = {}
    ): Promise<IngestResult> {
        const startTime = Date.now();
        const stats = {
            downloadTime: 0,
            parseTime: 0,
            cleanTime: 0,
            chunkTime: 0,
            embeddingTime: 0,
            totalTime: 0,
        };

        this.logger.info(`Starting ingestion pipeline for ${documentId}`);

        try {
            // 1. Download PDF
            const downloadStart = Date.now();
            const downloadPath =
                options.downloadPath || path.join(process.cwd(), "downloads");

            // Create a downloader with the specified output directory
            const downloader = new PDFDownloader({ outputDir: downloadPath });

            const downloadResult = await downloader.download(
                url,
                documentId
            );
            stats.downloadTime = Date.now() - downloadStart;
            this.logger.info(`Downloaded PDF (${stats.downloadTime}ms)`);

            // 2. Parse PDF
            const parseStart = Date.now();
            const parseResult = await this.parser.parse(
                downloadResult.filePath,
                documentId
            );
            stats.parseTime = Date.now() - parseStart;
            this.logger.info(
                `Parsed PDF: ${parseResult.pageCount} pages (${stats.parseTime}ms)`
            );

            // 3. Clean text
            const cleanStart = Date.now();
            const cleanedText = this.cleaner.clean(
                parseResult.text,
                options.cleaningOptions
            );
            stats.cleanTime = Date.now() - cleanStart;
            this.logger.info(`Cleaned text (${stats.cleanTime}ms)`);

            // 4. Chunk text
            const chunkStart = Date.now();
            const chunks = await this.chunker.chunk(
                cleanedText,
                documentId,
                options.chunkingOptions
            );
            stats.chunkTime = Date.now() - chunkStart;
            this.logger.info(
                `Created ${chunks.length} chunks (${stats.chunkTime}ms)`
            );

            // 5. Generate embeddings (optional)
            if (options.generateEmbeddings) {
                const embeddingStart = Date.now();
                await this.generateEmbeddings(chunks);
                stats.embeddingTime = Date.now() - embeddingStart;
                this.logger.info(`Generated embeddings (${stats.embeddingTime}ms)`);
            }

            // 6. Store in vector DB (optional)
            if (options.storeInVectorDB) {
                await this.storeChunks(
                    chunks,
                    documentId,
                    url,
                    parseResult.pageCount,
                    downloadResult.fileSize
                );
                this.logger.info("Stored chunks in vector database");
            }

            stats.totalTime = Date.now() - startTime;

            this.logger.info(
                `Ingestion completed for ${documentId} (${stats.totalTime}ms)`
            );

            return {
                documentId,
                success: true,
                chunks,
                stats,
            };
        } catch (error) {
            stats.totalTime = Date.now() - startTime;

            this.logger.error(`Ingestion failed for ${documentId}`, error);

            return {
                documentId,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                stats,
            };
        }
    }

    /**
     * Generate embeddings for chunks
     */
    private async generateEmbeddings(chunks: TextChunk[]): Promise<void> {
        const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

        for (const chunk of chunks) {
            const result = await embeddingProvider.generateEmbedding(chunk.content);
            // Store embedding in chunk or database
            // Implementation depends on your data model
        }
    }

    /**
     * Store chunks in vector database
     */
    private async storeChunks(
        chunks: TextChunk[],
        documentId: string,
        url: string,
        pageCount: number,
        fileSize: number
    ): Promise<void> {
        const vectorStore = await ProviderFactory.getVectorStore();
        const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

        // Cast to SupabaseVectorStore to access upsertDocument
        const supabaseStore = vectorStore as any;

        // Extract party info from documentId (e.g., "pln-2026" -> "PLN")
        const partyId = documentId.split('-')[0].toUpperCase();

        // 1. First, insert the document metadata
        const documentUuid = await supabaseStore.upsertDocument({
            documentId,
            title: `Plan de Gobierno ${partyId} 2026`,
            partyId,
            partyName: partyId, // TODO: Map to full party name
            url,
            pageCount,
            fileSizeBytes: fileSize,
            metadata: {
                source: 'TSE',
                year: 2026,
            },
        });

        this.logger.info(`Document UUID: ${documentUuid}`);

        // 2. Build array of VectorDocuments with embeddings
        const vectorDocs = [];

        for (const chunk of chunks) {
            // Generate embedding
            const embeddingResult = await embeddingProvider.generateEmbedding(
                chunk.content
            );

            // Build VectorDocument with document UUID
            // Note: id will be auto-generated by Supabase (gen_random_uuid())
            vectorDocs.push({
                id: undefined, // Let Supabase generate UUID
                content: chunk.content,
                embedding: embeddingResult.embedding,
                metadata: {
                    documentId: documentUuid, // Use UUID instead of string ID
                    chunkIndex: chunk.chunkIndex,
                    tokens: chunk.tokens,
                    cleanContent: chunk.content,
                },
            });
        }

        // 3. Batch upsert all chunks at once
        await vectorStore.upsert(vectorDocs);
    }

    /**
     * Batch ingest multiple documents
     */
    async ingestBatch(
        documents: Array<{ url: string; documentId: string }>,
        options: IngestOptions = {}
    ): Promise<IngestResult[]> {
        this.logger.info(`Starting batch ingestion for ${documents.length} documents`);

        const results: IngestResult[] = [];

        for (const doc of documents) {
            const result = await this.ingest(doc.url, doc.documentId, options);
            results.push(result);

            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const successCount = results.filter(r => r.success).length;
        this.logger.info(`Batch ingestion completed: ${successCount}/${documents.length} successful`);

        return results;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.chunker.dispose();
    }
}
