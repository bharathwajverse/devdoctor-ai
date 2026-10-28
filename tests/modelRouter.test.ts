import { describe, it, expect, vi } from 'vitest';
import { ModelRouter } from '../src/backend/services/modelRouter.js';
import { OllamaService } from '../src/backend/services/ollamaService.js';
import { DemoService } from '../src/backend/services/demoService.js';
import { GeminiService } from '../src/backend/services/geminiService.js';
import { DiagnosisResult } from '../src/shared/types.js';

const SAMPLE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('ModelRouter Routing and Provider Dispatch Tests', () => {
  it('routes to DemoService when forceDemo is true', async () => {
    const result = await ModelRouter.analyze(SAMPLE_PNG, 'terminal', 'Test issue', true);

    expect(result).toBeDefined();
    expect(result.isDemo).toBe(true);
    expect(result.provider).toBe('demo');
    expect(result.headline).toBeTruthy();
    expect(result.evidence.rawText).toBeTruthy();
    expect(result.rootCauses.length).toBeGreaterThan(0);
    expect(result.troubleshootingSteps.length).toBeGreaterThan(0);
  });

  it('routes follow-up verification to DemoService when forceDemo is true', async () => {
    const original: DiagnosisResult = DemoService.getDiagnosis('terminal');
    const result = await ModelRouter.verify(original, SAMPLE_PNG, 'Ran safe fix', true);

    expect(result).toBeDefined();
    expect(result.isDemo).toBe(true);
    expect(result.provider).toBe('demo');
    expect(result.originalAnalysisId).toBe(original.id);
    expect(['resolved', 'still_present', 'new_error', 'inconclusive']).toContain(result.status);
    expect(result.observations.length).toBeGreaterThan(0);
  });

  it('falls back to DemoService with honest watermarking when live model is offline', async () => {
    vi.spyOn(OllamaService, 'checkHealth').mockResolvedValueOnce({
      connected: false,
      availableModels: [],
      configuredUrl: 'http://localhost:11434',
    });

    const result = await ModelRouter.analyze(SAMPLE_PNG, 'docker', 'Port in use', false);

    expect(result).toBeDefined();
    expect(result.isDemo).toBe(true);
    expect(result.summary).toContain('[LIVE MODEL OFFLINE / FALLBACK DEMO]');
  });

  it('verifies GeminiService configuration checks', () => {
    const gemini = new GeminiService();
    // Default in test environment without GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      expect(gemini.isConfigured()).toBe(false);
    } else {
      expect(gemini.isConfigured()).toBe(true);
    }
  });
});
