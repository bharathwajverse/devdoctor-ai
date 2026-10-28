import { describe, it, expect } from 'vitest';
import { DemoService, DEMO_WATERMARK } from '../src/backend/services/demoService.js';
import { EnvironmentContext } from '../src/shared/types.js';

describe('DemoService Scenarios Test Suite', () => {
  const contexts: EnvironmentContext[] = ['terminal', 'browser', 'docker'];

  contexts.forEach((ctx) => {
    it(`generates complete, valid diagnosis for ${ctx} context`, () => {
      const diag = DemoService.getDiagnosis(ctx, 'Testing user notes');

      expect(diag.id).toBeTruthy();
      expect(diag.context).toBe(ctx);
      expect(diag.isDemo).toBe(true);
      expect(diag.summary).toContain(DEMO_WATERMARK);
      expect(diag.headline).toBeTruthy();
      expect(diag.confidenceScore).toBeGreaterThan(0.5);

      // Verify evidence shape
      expect(diag.evidence).toBeDefined();
      expect(diag.evidence.errorType).toBeTruthy();
      expect(diag.evidence.rawText).toBeTruthy();

      // Verify root causes
      expect(diag.rootCauses.length).toBeGreaterThan(0);
      diag.rootCauses.forEach((rc) => {
        expect(rc.cause).toBeTruthy();
        expect(rc.probability).toBeGreaterThan(0);
        expect(rc.probability).toBeLessThanOrEqual(1.0);
        expect(rc.explanation).toBeTruthy();
      });

      // Verify troubleshooting steps
      expect(diag.troubleshootingSteps.length).toBeGreaterThan(0);
      diag.troubleshootingSteps.forEach((step) => {
        expect(step.stepNumber).toBeGreaterThan(0);
        expect(step.title).toBeTruthy();
        expect(step.action).toBeTruthy();
        expect(['safe', 'moderate', 'risky']).toContain(step.riskLevel);
      });
    });
  });

  it('generates valid verification result for resolved condition', () => {
    const diag = DemoService.getDiagnosis('terminal');
    const veri = DemoService.getVerification(diag, 'Ran npm install express, fixed');

    expect(veri.id).toBeTruthy();
    expect(veri.originalAnalysisId).toBe(diag.id);
    expect(veri.status).toBe('resolved');
    expect(veri.confidence).toBeGreaterThan(0.7);
    expect(veri.observations.length).toBeGreaterThan(0);
    expect(veri.comparisonSummary).toContain(DEMO_WATERMARK);
    expect(veri.nextSteps.length).toBeGreaterThan(0);
  });
});
