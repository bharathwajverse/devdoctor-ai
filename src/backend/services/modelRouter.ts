import { config } from '../config.js';
import {
  DiagnosisResult,
  VerificationResult,
  EnvironmentContext,
} from '../../shared/types.js';
import { OllamaService } from './ollamaService.js';
import { GeminiService } from './geminiService.js';
import { DemoService } from './demoService.js';
import {
  ModelUnavailableError,
  ModelInferenceError,
} from '../errors/apiErrors.js';

export class ModelRouter {
  /**
   * Routes diagnosis request to the appropriate multimodal provider.
   */
  static async analyze(
    rawBase64Image?: string,
    context: EnvironmentContext = 'terminal',
    userDescription?: string,
    forceDemo: boolean = false,
    extractedText?: string
  ): Promise<DiagnosisResult> {
    if (forceDemo || config.modelProvider === 'demo') {
      return DemoService.getDiagnosis(context, userDescription);
    }

    // Try Google Gemini if configured
    if (config.modelProvider === 'google') {
      const gemini = new GeminiService();
      if (gemini.isConfigured()) {
        try {
          return await gemini.analyzeScreenshot(rawBase64Image || '', context, userDescription);
        } catch (err: any) {
          if (!config.enableDemoFallback) {
            throw new ModelInferenceError(`Google Gemini inference failed: ${err.message || 'Unknown error'}.`);
          }
        }
      } else if (!config.enableDemoFallback) {
        throw new ModelUnavailableError('Google Gemini API key is not configured.');
      }
    } else {
      // Try Ollama
      try {
        const health = await OllamaService.checkHealth();
        if (health.connected) {
          return await OllamaService.analyze(rawBase64Image, context, userDescription, extractedText);
        }
      } catch (err: any) {
        if (!config.enableDemoFallback) {
          throw new ModelInferenceError(`Ollama inference failed: ${err.message || 'Unknown error'}.`);
        }
      }
    }

    // Fallback to Demo with honest watermarking if enabled
    if (config.enableDemoFallback) {
      const demoResult = DemoService.getDiagnosis(context, userDescription);
      demoResult.summary = `[LIVE MODEL OFFLINE / FALLBACK DEMO] ${demoResult.summary}`;
      return demoResult;
    }

    throw new ModelUnavailableError(
      `No active multimodal model available at ${config.ollama.baseUrl}. Start Ollama and pull ${config.ollama.model}.`
    );
  }

  /**
   * Routes follow-up verification request to the appropriate provider.
   */
  static async verify(
    originalAnalysis: DiagnosisResult,
    verificationBase64Image?: string,
    notes?: string,
    forceDemo: boolean = false,
    extractedText?: string
  ): Promise<VerificationResult> {
    if (forceDemo || originalAnalysis.isDemo || config.modelProvider === 'demo') {
      return DemoService.getVerification(originalAnalysis, notes);
    }

    // Try Google Gemini if configured or original was google
    if (config.modelProvider === 'google' || originalAnalysis.provider === 'google') {
      const gemini = new GeminiService();
      if (gemini.isConfigured()) {
        try {
          return await gemini.verifyScreenshot(originalAnalysis, verificationBase64Image || '', notes);
        } catch (err: any) {
          if (!config.enableDemoFallback) {
            throw new ModelInferenceError(`Google Gemini verification failed: ${err.message || 'Unknown error'}.`);
          }
        }
      } else if (!config.enableDemoFallback) {
        throw new ModelUnavailableError('Google Gemini API key is not configured for verification.');
      }
    } else {
      // Try Ollama
      try {
        const health = await OllamaService.checkHealth();
        if (health.connected) {
          return await OllamaService.verify(originalAnalysis, verificationBase64Image, notes, extractedText);
        }
      } catch (err: any) {
        if (!config.enableDemoFallback) {
          throw new ModelInferenceError(`Verification inference failed: ${err.message || 'Unknown error'}.`);
        }
      }
    }

    if (config.enableDemoFallback) {
      return DemoService.getVerification(originalAnalysis, notes);
    }

    throw new ModelUnavailableError(
      `Multimodal model unavailable for verification.`
    );
  }
}

