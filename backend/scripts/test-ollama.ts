/**
 * Quick test script for Ollama LLM provider
 */
import { OllamaLLMProvider } from '../src/providers/llm/OllamaLLMProvider.js';
import { env } from '../src/config/env.js';
import { Logger } from '@ticobot/shared';

const logger = new Logger('TestOllama');

async function main() {
  logger.info('🧪 Testing Ollama LLM Provider...');
  logger.info(`   Model: ${env.OLLAMA_MODEL}`);
  logger.info(`   URL: ${env.OLLAMA_BASE_URL}`);

  try {
    const provider = new OllamaLLMProvider(env);

    logger.info('\n📤 Sending test message...');
    const startTime = Date.now();

    const response = await provider.generateCompletion([
      { role: 'system', content: 'Eres un asistente útil que responde en español de forma concisa.' },
      { role: 'user', content: '¿Cuál es la capital de Costa Rica? Responde en una oración.' }
    ], {
      temperature: 0.7,
      maxTokens: 100
    });

    const elapsed = Date.now() - startTime;

    logger.info(`\n✅ Response received in ${elapsed}ms`);
    logger.info(`   Model: ${response.model}`);
    logger.info(`   Content: ${response.content}`);
    logger.info(`   Tokens: ${response.usage.totalTokens} (prompt: ${response.usage.promptTokens}, completion: ${response.usage.completionTokens})`);
    logger.info(`   Finish reason: ${response.finishReason}`);

    logger.info('\n🎉 Ollama provider is working correctly!');
  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
