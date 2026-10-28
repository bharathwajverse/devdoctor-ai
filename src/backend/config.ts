import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  modelProvider: (process.env.MODEL_PROVIDER || 'ollama') as 'ollama' | 'google' | 'demo',
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
  },
  google: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  enableDemoFallback: process.env.ENABLE_DEMO_FALLBACK !== 'false',
  maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10),
  allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/png,image/jpeg,image/webp')
    .split(',')
    .map((s) => s.trim().toLowerCase()),
  logLevel: process.env.LOG_LEVEL || 'info',
};
