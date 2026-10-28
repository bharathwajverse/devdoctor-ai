import { config } from '../config.js';
import {
  DiagnosisResult,
  VerificationResult,
  EnvironmentContext,
} from '../../shared/types.js';
import {
  parseDiagnosisFromModel,
  parseVerificationFromModel,
} from './jsonParser.js';
import {
  buildDiagnosisPrompt,
  buildVerificationPrompt,
} from '../prompts/diagnosticPrompts.js';

export interface OllamaHealthStatus {
  connected: boolean;
  availableModels: string[];
  configuredUrl: string;
}

export class OllamaService {
  /**
   * Probes Ollama /api/tags to verify daemon connection and list installed models.
   */
  static async checkHealth(): Promise<OllamaHealthStatus> {
    const url = `${config.ollama.baseUrl}/api/tags`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        return {
          connected: false,
          availableModels: [],
          configuredUrl: config.ollama.baseUrl,
        };
      }

      const data = (await response.json()) as any;
      const models: string[] = Array.isArray(data?.models)
        ? data.models.map((m: any) => m.name || m.model).filter(Boolean)
        : [];

      return {
        connected: true,
        availableModels: models,
        configuredUrl: config.ollama.baseUrl,
      };
    } catch {
      clearTimeout(timeout);
      return {
        connected: false,
        availableModels: [],
        configuredUrl: config.ollama.baseUrl,
      };
    }
  }

  /**
   * Submits extracted OCR text and optional screenshot to the local Ollama model.
   * Standard Llama 3 is text-only; it reasons directly on the extracted OCR text.
   */
  static async analyze(
    rawBase64Image?: string,
    context: EnvironmentContext = 'terminal',
    userDescription?: string,
    extractedText?: string
  ): Promise<DiagnosisResult> {
    const health = await this.checkHealth();
    if (!health.connected) {
      throw new Error(`Ollama server unreachable at ${config.ollama.baseUrl}.`);
    }

    // Determine target model
    let targetModel = config.ollama.model;
    const matchingModel = health.availableModels.find(
      (m) => m === targetModel || m.startsWith(`${targetModel}:`) || m.split(':')[0] === targetModel
    );
    if (matchingModel) {
      targetModel = matchingModel;
    } else if (!health.availableModels.includes(targetModel) && health.availableModels.length > 0) {
      targetModel = health.availableModels[0];
    }

    const systemPrompt = buildDiagnosisPrompt(context, userDescription, extractedText);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ollama.timeoutMs);

    try {
      const requestBody: any = {
        model: targetModel,
        prompt: systemPrompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      };

      // Standard Llama 3 is text-only; only provide image array if using vision-capable model
      const isVisionModel = /vision|llava|paligemma|gemma4|minicpm|moondream/i.test(targetModel);
      if (isVisionModel && rawBase64Image) {
        requestBody.images = [rawBase64Image];
      }

      const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama returned HTTP ${response.status}: ${errorText}`);
      }

      const responseData = (await response.json()) as any;
      const rawText = responseData.response || '';

      const diagnosis = parseDiagnosisFromModel(rawText, context, targetModel, userDescription);
      if (extractedText && (!diagnosis.evidence?.rawText || diagnosis.evidence.rawText.trim() === '')) {
        diagnosis.evidence.rawText = extractedText;
      }
      return diagnosis;
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Submits initial diagnosis and follow-up evidence to assess if problem appears resolved.
   */
  static async verify(
    originalAnalysis: DiagnosisResult,
    verificationBase64Image?: string,
    notes?: string,
    extractedText?: string
  ): Promise<VerificationResult> {
    const health = await this.checkHealth();
    if (!health.connected) {
      throw new Error(`Ollama server unreachable at ${config.ollama.baseUrl}.`);
    }

    let targetModel = config.ollama.model;
    const matchingModel = health.availableModels.find(
      (m) => m === targetModel || m.startsWith(`${targetModel}:`) || m.split(':')[0] === targetModel
    );
    if (matchingModel) {
      targetModel = matchingModel;
    } else if (!health.availableModels.includes(targetModel) && health.availableModels.length > 0) {
      targetModel = health.availableModels[0];
    }

    const verificationPrompt = buildVerificationPrompt(
      originalAnalysis.headline,
      originalAnalysis.evidence?.errorType,
      originalAnalysis.evidence?.suspectComponent,
      notes,
      extractedText
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ollama.timeoutMs);

    try {
      const requestBody: any = {
        model: targetModel,
        prompt: verificationPrompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      };

      const isVisionModel = /vision|llava|paligemma|gemma4|minicpm|moondream/i.test(targetModel);
      if (isVisionModel && verificationBase64Image) {
        requestBody.images = [verificationBase64Image];
      }

      const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama returned HTTP ${response.status}: ${errorText}`);
      }

      const responseData = (await response.json()) as any;
      const rawText = responseData.response || '';

      return parseVerificationFromModel(rawText, originalAnalysis.id, targetModel);
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }
}
