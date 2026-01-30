import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Provider selection
  EMBEDDING_PROVIDER: z.enum(['openai', 'cohere', 'huggingface']).default('openai'),
  VECTOR_STORE: z.enum(['supabase', 'pinecone', 'qdrant', 'weaviate']).default('supabase'),
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'google', 'ollama', 'deepseek']).default('openai'),
  DATABASE_PROVIDER: z.enum(['supabase', 'postgresql']).default('supabase'),

  // OpenAI configuration
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OPENAI_LLM_MODEL: z.string().default('gpt-4-turbo-preview'),

  // DeepSeek configuration
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),

  // Anthropic configuration
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),

  // Google configuration
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().default('gemini-pro'),

  // Ollama configuration (local LLM)
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:14b'),

  // Supabase configuration
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Pinecone configuration
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_ENVIRONMENT: z.string().optional(),
  PINECONE_INDEX_NAME: z.string().optional(),

  // JWT Authentication configuration
  JWT_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),

  // Application settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CLIENT_URL: z.string().optional(), // Alternative to FRONTEND_URL for compatibility
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 */
export const env = validateEnv();
