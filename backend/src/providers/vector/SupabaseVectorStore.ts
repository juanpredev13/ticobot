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

    this.tableName = 'vector_documents';
  }

  async upsert(documents: VectorDocument[]): Promise<void> {
    try {
      const { error } = await this.client.from(this.tableName).upsert(
        documents.map((doc) => ({
          id: doc.id,
          content: doc.content,
          embedding: doc.embedding,
          metadata: doc.metadata,
        })),
        {
          onConflict: 'id',
        }
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(
        `Supabase upsert failed: ${error instanceof Error ? error.message : String(error)}`
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
      const { data, error } = await this.client.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_count: k,
        filter: filters || {},
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
