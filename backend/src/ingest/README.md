# Ingest Module

## Purpose
Handles PDF ingestion pipeline for Costa Rica 2026 Government Plans from TSE.

## Responsibilities
- Download PDFs from TSE website
- Extract text content from PDFs
- Parse and clean extracted text
- Split text into semantic chunks
- Generate embeddings for chunks
- Store chunks and embeddings in vector database

## Future Components
- `PDFDownloader.ts` - Download PDFs from TSE
- `PDFParser.ts` - Extract text from PDFs
- `TextCleaner.ts` - Clean and normalize text
- `TextChunker.ts` - Split text into chunks
- `IngestPipeline.ts` - Orchestrate ingestion process
- `index.ts` - Export public API

## Dependencies
- PDF parsing library (pdf-parse or similar)
- Provider interfaces from @ticobot/shared
- Embedding provider
- Vector store provider