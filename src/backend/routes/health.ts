import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { HealthResponse } from '../../shared/types.js';
import { OllamaService } from '../services/ollamaService.js';

const router = Router();
const serverStartTime = Date.now();

router.get('/', async (_req: Request, res: Response) => {
  const ollamaHealth = await OllamaService.checkHealth();

  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  if (config.modelProvider === 'demo') {
    overallStatus = 'ok';
  } else if (config.modelProvider === 'google') {
    overallStatus = Boolean(config.google.apiKey)
      ? 'ok'
      : config.enableDemoFallback
      ? 'degraded'
      : 'error';
  } else {
    // ollama provider
    if (!ollamaHealth.connected) {
      overallStatus = config.enableDemoFallback ? 'degraded' : 'error';
    }
  }

  const modelIdentifier =
    config.modelProvider === 'google'
      ? config.google.model
      : config.modelProvider === 'demo'
      ? 'demo-scenarios-v1'
      : config.ollama.model;

  const response: HealthResponse = {
    status: overallStatus,
    service: 'devdoctor-ai',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    modelProvider: config.modelProvider,
    modelIdentifier,
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
