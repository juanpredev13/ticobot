import { createClient } from '@supabase/supabase-js';
import { ProviderFactory } from './src/factory/ProviderFactory.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testQuery(
  query: string,
  partyFilter: string | null = null,
  limit: number = 5
) {
  console.log('\n' + '━'.repeat(80));
  console.log('🔍 QUERY:', query);
  if (partyFilter) {
    console.log('🎯 FILTRO:', partyFilter);
  }
  console.log('━'.repeat(80));

  const embeddingProvider = await ProviderFactory.getEmbeddingProvider();

  console.log('\n⏳ Generando embedding...');
  const { embedding } = await embeddingProvider.generateEmbedding(query);
  console.log('✅ Embedding generado');

  console.log('⏳ Buscando en base de datos...');
  const rpcParams = {
    query_embedding: embedding,
    match_threshold: 0.35, // Explicitly set threshold
    match_count: limit,
    filter_party_id: partyFilter
  };
  console.log('📋 RPC params:', { threshold: rpcParams.match_threshold, count: rpcParams.match_count, party: rpcParams.filter_party_id });

  const { data, error } = await supabase.rpc('match_chunks', rpcParams);

  if (error) {
    console.error('\n❌ Error:', error);
    return;
  }

  console.log(`✅ Búsqueda completada\n`);
  console.log('━'.repeat(80));
  console.log(`📊 Resultados: ${data?.length || 0}`);
  console.log('━'.repeat(80) + '\n');

  data?.forEach((r: any, i: number) => {
    const score = (r.similarity * 100).toFixed(1);
    const scoreInt = Math.floor(r.similarity * 100);
    const bar = '█'.repeat(Math.floor(scoreInt / 2)) + '░'.repeat(50 - Math.floor(scoreInt / 2));

    console.log(`${i + 1}. [${bar}] ${score}%`);
    console.log(`   Chunk #${r.chunk_index}`);
    console.log(`   ${r.content.substring(0, 250).replace(/\n/g, ' ')}...`);
    console.log('');
  });

  if (data && data.length > 0) {
    const avgScore = data.reduce((sum: number, r: any) => sum + r.similarity, 0) / data.length;
    console.log('━'.repeat(80));
    console.log(`📈 Score promedio: ${(avgScore * 100).toFixed(1)}%`);
    console.log(`📈 Mejor score: ${(data[0].similarity * 100).toFixed(1)}%`);
    console.log(`📈 Peor score: ${(data[data.length - 1].similarity * 100).toFixed(1)}%`);
    console.log('━'.repeat(80) + '\n');
  } else {
    console.log('⚠️  No se encontraron resultados\n');
  }
}

// Lee query desde argumentos o usa default
const query = process.argv[2] || '¿Qué propone el PLN sobre educación?';
const partyFilterArg = process.argv[3];
const partyFilter = (partyFilterArg && partyFilterArg !== 'null') ? partyFilterArg : null;
const limit = parseInt(process.argv[4] || '5');

testQuery(query, partyFilter, limit);
