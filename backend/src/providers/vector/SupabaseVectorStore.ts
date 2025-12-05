import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { IVectorStore, VectorDocument, SearchResult } from '@ticobot/shared';
import type { Env } from '../../config/env.js';

/**
 * Supabase Vector Store Provider
 * Implements IVectorStore using Supabase's pgvector extension
 */
export class SupabaseVectorStore implements IVectorStore {
  private client: SupabaseClient;
  private tableName: string;

  constructor(env: Env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase vector store'
      );
    }

    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.tableName = 'chunks';
  }

  /**
   * Insert or update document metadata
   * @returns The UUID of the inserted/updated document
   */
  async upsertDocument(document: {
    documentId: string;
    title: string;
    partyId: string;
    partyName: string;
    url?: string;
    filePath?: string;
    pageCount?: number;
    fileSizeBytes?: number;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const { data, error } = await this.client
        .from('documents')
        .upsert(
          {
            document_id: document.documentId,
            title: document.title,
            party_id: document.partyId,
            party_name: document.partyName,
            url: document.url,
            file_path: document.filePath,
            page_count: document.pageCount,
            file_size_bytes: document.fileSizeBytes,
            metadata: document.metadata || {},
            parsed_at: new Date().toISOString(),
          },
          {
            onConflict: 'document_id',
          }
        )
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No document ID returned from upsert');
      }

      return data.id;
    } catch (error) {
      throw new Error(
        `Supabase document upsert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`
      );
    }
  }

  async upsert(documents: VectorDocument[]): Promise<void> {
    try {
      const rows = documents.map((doc) => {
        const row: any = {
          document_id: doc.metadata?.documentId || null,
          chunk_index: doc.metadata?.chunkIndex || 0,
          content: doc.content,
          clean_content: doc.metadata?.cleanContent || doc.content,
          // Keep embedding as array - Supabase client handles the conversion
          embedding: doc.embedding,
          token_count: doc.metadata?.tokens || null,
          char_count: doc.content?.length || 0,
          metadata: doc.metadata,
        };

        // Only include id if it's provided (for updates)
        if (doc.id) {
          row.id = doc.id;
        }

        return row;
      });

      // Only set onConflict if we have IDs
      const hasIds = documents.some((doc) => doc.id);

      const { error } = await this.client
        .from(this.tableName)
        .upsert(rows, hasIds ? { onConflict: 'id' } : undefined);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(
        `Supabase upsert failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`
      );
    }
  }

  async similaritySearch(
    queryEmbedding: number[],
    k: number,
    filters?: Record<string, any>
  ): Promise<SearchResult[]> {
    try {
      // Call the Supabase RPC function for vector similarity search
      // Support both party_id (snake_case) and partyId (camelCase)
      const partyId = filters?.party_id || filters?.partyId || null;

      // Keep embedding as array - Supabase client handles the conversion
      const { data, error } = await this.client.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_count: k,
        filter_party_id: partyId,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      return data.map((row: any) => ({
        document: {
          id: row.id,
          content: row.content,
          embedding: row.embedding,
          metadata: row.metadata,
        },
        score: row.similarity,
      }));
    } catch (error) {
      throw new Error(
        `Supabase similarity search failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async delete(ids: string[]): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .in('id', ids);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(
        `Supabase delete failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getById(id: string): Promise<VectorDocument | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        content: data.content,
        embedding: data.embedding,
        metadata: data.metadata,
      };
    } catch (error) {
      throw new Error(
        `Supabase getById failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(`metadata->${key}`, value);
        });
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count ?? 0;
    } catch (error) {
      throw new Error(
        `Supabase count failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async initialize(): Promise<void> {
    // The table and functions should be created via migrations
    // This method can be used to verify the setup
    try {
      const { error } = await this.client
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (error) {
        throw new Error(
          `Supabase vector store not initialized. Please run migrations. Error: ${error.message}`
        );
      }
    } catch (error) {
      throw new Error(
        `Supabase initialization check failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
