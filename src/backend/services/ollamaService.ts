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
    const timeout = setTimeout(() => controller.abort(), 3000);

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
   * Submits a base64 screenshot and prompt to the local Ollama multimodal endpoint.
   */
  static async analyze(
    rawBase64Image: string,
    context: EnvironmentContext = 'terminal',
    userDescription?: string
  ): Promise<DiagnosisResult> {
    const health = await this.checkHealth();
    if (!health.connected) {
      throw new Error(`Ollama server unreachable at ${config.ollama.baseUrl}.`);
    }

    // Determine target model
    let targetModel = config.ollama.model;
    if (!health.availableModels.includes(targetModel)) {
      // If configured model is not in list, pick another available model if any
      if (health.availableModels.length > 0) {
        targetModel = health.availableModels[0];
      }
    }

    const systemPrompt = `You are devdoctor-ai, an expert software debugging assistant specializing in error screenshots.
Analyze the provided screenshot carefully.
Context environment: ${context}.
${userDescription ? `User explanation of what happened: "${userDescription}".` : ''}

You MUST extract and diagnose:
1. Exact error text, file path, line number, error code, and suspect library.
2. Contextual evaluation: Is the evidence clear or uncertain/blurry?
3. Root cause hypotheses: List 2-3 plausible causes with estimated probabilities (0.0 to 1.0).
4. Troubleshooting steps: Prioritized list of concrete fixes. Each step MUST have:
   - stepNumber: integer
   - title: concise action title
   - explanation: why this works
   - action: exact terminal command or code change
   - riskLevel: "safe", "moderate", or "risky"
   - rollbackAdvice: how to undo if destructive (optional)

Respond strictly in valid JSON matching this schema:
{
  "headline": "Concise error title",
  "summary": "Plain-English explanation of why this error occurred",
  "confidenceScore": 0.95,
  "evidence": {
    "rawText": "Extracted error text or stack trace",
    "errorType": "Error category (e.g. MODULE_NOT_FOUND, TypeError)",
    "errorCode": "Standard error code if visible",
    "filePath": "Relative or absolute file path if visible",
    "lineNumber": 12,
    "suspectComponent": "Component or package",
    "uncertain": false
  },
  "rootCauses": [
    { "cause": "Description of root cause", "probability": 0.8, "explanation": "Detailed rationale" }
  ],
  "troubleshootingSteps": [
    {
      "stepNumber": 1,
      "title": "Action title",
      "explanation": "Why to run this",
      "action": "npm install package-name",
      "riskLevel": "safe"
    }
  ],
  "safetyNotice": "Review commands before execution. devdoctor-ai never runs commands automatically."
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ollama.timeoutMs);

    try {
      const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          prompt: systemPrompt,
          images: [rawBase64Image],
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2,
          },
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama returned HTTP ${response.status}: ${errorText}`);
      }

      const responseData = (await response.json()) as any;
      const rawText = responseData.response || '';

      return parseDiagnosisFromModel(rawText, context, targetModel, userDescription);
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Submits initial diagnosis and follow-up screenshot to assess if problem appears resolved.
   */
  static async verify(
    originalAnalysis: DiagnosisResult,
    verificationBase64Image: string,
    notes?: string
  ): Promise<VerificationResult> {
    const health = await this.checkHealth();
    if (!health.connected) {
      throw new Error(`Ollama server unreachable at ${config.ollama.baseUrl}.`);
    }

    let targetModel = config.ollama.model;
    if (!health.availableModels.includes(targetModel) && health.availableModels.length > 0) {
      targetModel = health.availableModels[0];
    }

    const verificationPrompt = `You are devdoctor-ai verifying whether a software error has been resolved.
Previous Diagnosis:
- Headline: ${originalAnalysis.headline}
- Error Type: ${originalAnalysis.evidence?.errorType}
- Suspect Component: ${originalAnalysis.evidence?.suspectComponent}
${notes ? `User notes on applied fixes: "${notes}"` : ''}

Inspect the follow-up screenshot. Compare it against the previous error state.
Determine:
1. status: "resolved" (error gone, success output, clean prompt) | "still_present" (same error visible) | "new_error" (different error now visible) | "inconclusive" (cannot tell)
2. confidence: number between 0.0 and 1.0
3. observations: list of 2-3 visual observations from the new screenshot
4. comparisonSummary: summary of what changed between states
5. nextSteps: 1-2 follow-up commands if needed

Respond strictly in valid JSON matching this schema:
{
  "status": "resolved",
  "confidence": 0.95,
  "observations": ["Observation 1", "Observation 2"],
  "comparisonSummary": "Explanation of changes visible in the screenshot",
  "nextSteps": [
    {
      "stepNumber": 1,
      "title": "Verify service health",
      "explanation": "Ensure endpoint responds",
      "action": "curl http://localhost:3000",
      "riskLevel": "safe"
    }
  ]
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ollama.timeoutMs);

    try {
      const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          prompt: verificationPrompt,
          images: [verificationBase64Image],
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2,
          },
        }),
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
