# RAG Module

## Purpose
Implements the Retrieval-Augmented Generation (RAG) pipeline for querying government plans.

## Responsibilities
- Accept user queries
- Generate embeddings for queries
- Perform semantic search in vector database
- Retrieve relevant document chunks
- Format context for LLM
- Generate responses using LLM with retrieved context
- Return structured results

## Future Components
- `QueryEmbedder.ts` - Generate embeddings for queries
- `SemanticSearcher.ts` - Search vector database
- `ContextBuilder.ts` - Build context from retrieved chunks
- `ResponseGenerator.ts` - Generate LLM responses
- `RAGPipeline.ts` - Orchestrate RAG process
- `index.ts` - Export public API

## Dependencies
- Provider interfaces from @ticobot/shared
- Embedding provider
- Vector store provider
- LLM provider