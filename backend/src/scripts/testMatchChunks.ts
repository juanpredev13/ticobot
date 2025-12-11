/**
 * Test match_chunks function with real data
 */

import { createSupabaseClient } from '../db/supabase.js';

async function main() {
  console.log('🧪 Testing match_chunks with real embeddings...\n');

  const supabase = createSupabaseClient();

  try {
    // 1. Get a sample chunk with its embedding
    console.log('1️⃣ Fetching a sample chunk...');
    const { data: chunk, error: chunkError } = await supabase
      .from('chunks')
      .select('id, content, embedding, metadata')
      .limit(1)
      .single();

    if (chunkError) {
      throw chunkError;
    }

    console.log('✅ Got chunk:', chunk.id);
    console.log('   Content preview:', chunk.content.substring(0, 50) + '...');
    console.log('   Embedding type:', typeof chunk.embedding);
    console.log('   Embedding is array:', Array.isArray(chunk.embedding));

    if (typeof chunk.embedding === 'string') {
      console.log('   ⚠️  Embedding is stored as STRING, not vector!');
      console.log('   First 100 chars:', chunk.embedding.substring(0, 100));
    } else if (Array.isArray(chunk.embedding)) {
      console.log('   ✅ Embedding is array, length:', chunk.embedding.length);
      console.log('   First 5 values:', chunk.embedding.slice(0, 5));
    }

    // 2. Count total chunks
    console.log('\n2️⃣ Counting total chunks...');
    const { count, error: countError } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    console.log('✅ Total chunks in database:', count);

    // 3. Test match_chunks with the sample embedding
    console.log('\n3️⃣ Testing match_chunks with sample embedding...');

    // Use the chunk's own embedding to search
    const { data: matches, error: matchError } = await supabase.rpc('match_chunks', {
      query_embedding: chunk.embedding,
      match_count: 5,
      filter_party_id: null,
    });

    if (matchError) {
      console.error('❌ match_chunks error:', matchError);
      throw matchError;
    }

    console.log('✅ match_chunks returned:', matches?.length || 0, 'results');

    if (matches && matches.length > 0) {
      console.log('\nTop results:');
      matches.forEach((m: any, i: number) => {
        console.log(`  ${i + 1}. Similarity: ${m.similarity.toFixed(4)} | Content: ${m.content.substring(0, 50)}...`);
      });
    } else {
      console.log('⚠️  No matches found - this is the problem!');
    }

    // 4. Test with a simple query embedding
    console.log('\n4️⃣ Testing with generated query embedding...');
    const { OpenAIProvider } = await import('../providers/llm/OpenAIProvider.js');
    const openai = new OpenAIProvider();

    const queryEmbedding = await openai.generateEmbedding('educación');
    console.log('Generated embedding for "educación", length:', queryEmbedding.length);

    const { data: queryMatches, error: queryError } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_count: 5,
      filter_party_id: null,
    });

    if (queryError) {
      console.error('❌ Query match error:', queryError);
      throw queryError;
    }

    console.log('✅ Query match returned:', queryMatches?.length || 0, 'results');

    if (queryMatches && queryMatches.length > 0) {
      console.log('\nTop results:');
      queryMatches.forEach((m: any, i: number) => {
        console.log(`  ${i + 1}. Similarity: ${m.similarity.toFixed(4)} | Content: ${m.content.substring(0, 50)}...`);
      });
    } else {
      console.log('⚠️  Still no matches - checking embedding format...');

      // Check if embeddings in DB are stored correctly
      const { data: dbChunk } = await supabase
        .from('chunks')
        .select('embedding')
        .limit(1)
        .single();

      console.log('\n🔍 Embedding investigation:');
      console.log('   Query embedding type:', typeof queryEmbedding);
      console.log('   Query embedding sample:', queryEmbedding.slice(0, 3));
      console.log('   DB embedding type:', typeof dbChunk?.embedding);
      if (dbChunk?.embedding) {
        if (typeof dbChunk.embedding === 'string') {
          console.log('   ❌ PROBLEM: DB embeddings are strings, not vectors!');
          console.log('   DB embedding sample:', dbChunk.embedding.substring(0, 100));
        } else {
          console.log('   DB embedding sample:', Array.isArray(dbChunk.embedding) ? dbChunk.embedding.slice(0, 3) : dbChunk.embedding);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

main().catch(console.error);
