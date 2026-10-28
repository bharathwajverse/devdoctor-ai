import { config } from '../config.js';
import {
  DiagnosisResult,
  VerificationResult,
  EnvironmentContext,
} from '../../shared/types.js';
import { OllamaService } from './ollamaService.js';
import { DemoService } from './demoService.js';

export class ModelRouter {
  /**
   * Routes diagnosis request to the appropriate multimodal provider.
   */
  static async analyze(
    rawBase64Image: string,
    context: EnvironmentContext = 'terminal',
    userDescription?: string,
    forceDemo: boolean = false
  ): Promise<DiagnosisResult> {
    if (forceDemo || config.modelProvider === 'demo') {
      return DemoService.getDiagnosis(context, userDescription);
    }

    // Try Ollama
    try {
      const health = await OllamaService.checkHealth();
      if (health.connected) {
        return await OllamaService.analyze(rawBase64Image, context, userDescription);
      }
    } catch (err: any) {
      if (!config.enableDemoFallback) {
        throw {
          status: 502,
          code: 'MODEL_INFERENCE_FAILED',
          message: `Ollama inference failed: ${err.message || 'Unknown error'}.`,
        };
      }
    }

    // Fallback to Demo with honest watermarking if enabled
    if (config.enableDemoFallback) {
      const demoResult = DemoService.getDiagnosis(context, userDescription);
      demoResult.summary = `[LIVE MODEL OFFLINE / FALLBACK DEMO] ${demoResult.summary}`;
      return demoResult;
    }

    throw {
      status: 503,
      code: 'MODEL_UNAVAILABLE',
      message: `No active multimodal model available at ${config.ollama.baseUrl}. Start Ollama and pull ${config.ollama.model}.`,
    };
  }

  /**
   * Routes follow-up verification request to the appropriate provider.
   */
  static async verify(
    originalAnalysis: DiagnosisResult,
    verificationBase64Image: string,
    notes?: string,
    forceDemo: boolean = false
  ): Promise<VerificationResult> {
    if (forceDemo || originalAnalysis.isDemo || config.modelProvider === 'demo') {
      return DemoService.getVerification(originalAnalysis, notes);
    }

    try {
      const health = await OllamaService.checkHealth();
      if (health.connected) {
        return await OllamaService.verify(originalAnalysis, verificationBase64Image, notes);
      }
    } catch (err: any) {
      if (!config.enableDemoFallback) {
        throw {
          status: 502,
          code: 'MODEL_VERIFICATION_FAILED',
          message: `Verification inference failed: ${err.message || 'Unknown error'}.`,
        };
      }
    }

    if (config.enableDemoFallback) {
      return DemoService.getVerification(originalAnalysis, notes);
    }

    throw {
      status: 503,
      code: 'MODEL_UNAVAILABLE',
      message: `Ollama unavailable for verification at ${config.ollama.baseUrl}.`,
    };
  }
}
