/**
 * Script para verificar la configuración de embeddings
 * Muestra qué provider está configurado y si tiene las API keys necesarias
 */

import { env } from '../src/config/env.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('CheckEmbeddingConfig');

async function checkConfig() {
  logger.info('='.repeat(80));
  logger.info('Verificando configuración de Embeddings');
  logger.info('='.repeat(80));

  logger.info(`\nProvider configurado: ${env.EMBEDDING_PROVIDER}`);

  if (env.EMBEDDING_PROVIDER === 'openai') {
    logger.info(`\nOpenAI Configuration:`);
    logger.info(`  API Key: ${env.OPENAI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
    logger.info(`  Model: ${env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small (default)'}`);
    
    if (!env.OPENAI_API_KEY) {
      logger.error('\n⚠️  OPENAI_API_KEY no está configurada');
    }
  } else if (env.EMBEDDING_PROVIDER === 'deepseek') {
    logger.info(`\nDeepSeek Configuration:`);
    logger.info(`  API Key: ${env.DEEPSEEK_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
    logger.info(`  Base URL: ${env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com (default)'}`);
    logger.info(`  Embedding Model: ${(env as any).DEEPSEEK_EMBEDDING_MODEL || 'text-embedding (default)'}`);
    
    if (!env.DEEPSEEK_API_KEY) {
      logger.error('\n⚠️  DEEPSEEK_API_KEY no está configurada');
      logger.error('   Agrega DEEPSEEK_API_KEY=tu_api_key en backend/.env');
    }
  } else {
    logger.warn(`\n⚠️  Provider "${env.EMBEDDING_PROVIDER}" no implementado aún`);
  }

  // Intentar crear el provider para verificar que funciona
  logger.info('\n' + '='.repeat(80));
  logger.info('Probando creación del provider...');
  
  try {
    const { ProviderFactory } = await import('../src/factory/ProviderFactory.js');
    const provider = await ProviderFactory.getEmbeddingProvider();
    logger.info(`✅ Provider creado exitosamente`);
    logger.info(`   Modelo: ${provider.getModelName()}`);
    logger.info(`   Dimensiones: ${provider.getDimension()}`);
    logger.info(`   Max input length: ${provider.getMaxInputLength()} tokens`);
    
    // Probar con un texto pequeño
    logger.info('\nProbando generación de embedding...');
    const testResult = await provider.generateEmbedding('Test de embedding');
    logger.info(`✅ Embedding generado exitosamente`);
    logger.info(`   Dimensiones del vector: ${testResult.embedding.length}`);
    logger.info(`   Tokens usados: ${testResult.usage?.totalTokens || 'N/A'}`);
    
  } catch (error) {
    logger.error(`❌ Error al crear o probar el provider:`);
    logger.error(`   ${error instanceof Error ? error.message : String(error)}`);
    
    // Detectar si es el error 404 de DeepSeek (no tiene embeddings)
    if (error instanceof Error && error.message.includes('404')) {
      if (env.EMBEDDING_PROVIDER === 'deepseek') {
        logger.error('\n⚠️  PROBLEMA DETECTADO:');
        logger.error('   DeepSeek NO ofrece un servicio de embeddings.');
        logger.error('   DeepSeek solo proporciona Chat Completions (LLM), no embeddings.');
        logger.error('\n💡 SOLUCIONES:');
        logger.error('   1. Usar OpenAI para embeddings (más económico que chat):');
        logger.error('      EMBEDDING_PROVIDER=openai');
        logger.error('      OPENAI_API_KEY=tu_api_key');
        logger.error('   2. Implementar otro proveedor (Cohere, HuggingFace)');
        logger.error('\n📖 Ver: backend/DEEPSEEK_EMBEDDINGS_NO_DISPONIBLE.md para más detalles');
      }
    } else if (error instanceof Error && error.message.includes('API_KEY')) {
      logger.error('\n💡 Solución:');
      if (env.EMBEDDING_PROVIDER === 'deepseek') {
        logger.error('   1. Obtén tu API key de DeepSeek: https://platform.deepseek.com/');
        logger.error('   2. Agrega DEEPSEEK_API_KEY=tu_api_key en backend/.env');
      } else {
        logger.error('   1. Obtén tu API key de OpenAI: https://platform.openai.com/');
        logger.error('   2. Agrega OPENAI_API_KEY=tu_api_key en backend/.env');
      }
    }
    
    process.exit(1);
  }

  logger.info('\n' + '='.repeat(80));
  logger.info('✅ Configuración verificada correctamente');
  logger.info('='.repeat(80));
}

checkConfig().catch((error) => {
  logger.error('Error:', error);
  process.exit(1);
});

