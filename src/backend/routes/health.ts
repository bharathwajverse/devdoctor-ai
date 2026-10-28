import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { HealthResponse } from '../../shared/types.js';
import { OllamaService } from '../services/ollamaService.js';

const router = Router();
const serverStartTime = Date.now();

router.get('/', async (_req: Request, res: Response) => {
  const ollamaHealth = await OllamaService.checkHealth();

  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  if (!ollamaHealth.connected) {
    overallStatus = config.enableDemoFallback ? 'degraded' : 'error';
  }

  const response: HealthResponse = {
    status: overallStatus,
    service: 'devdoctor-ai',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    modelProvider: config.modelProvider,
    modelIdentifier: config.ollama.model,
    ollama: {
      configuredUrl: ollamaHealth.configuredUrl,
      connected: ollamaHealth.connected,
      availableModels: ollamaHealth.availableModels,
    },
    google: {
      configured: Boolean(config.google.apiKey),
      model: config.google.model,
    },
    demoFallbackEnabled: config.enableDemoFallback,
    limits: {
      maxImageSizeMb: config.maxImageSizeMb,
      allowedMimeTypes: config.allowedMimeTypes,
    },
  };

  res.status(overallStatus === 'error' ? 503 : 200).json(response);
});

export default router;
