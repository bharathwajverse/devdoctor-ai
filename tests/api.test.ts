import { describe, it, expect } from 'vitest';
import { dispatchRequest } from './mockServer.js';
import { DiagnosisResult } from '../src/shared/types.js';

// 1x1 transparent pixel PNG base64 for valid image testing
const SAMPLE_VALID_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const SAMPLE_VALID_PNG_DATA_URL = `data:image/png;base64,${SAMPLE_VALID_PNG_BASE64}`;

describe('devdoctor-ai API Integration Test Suite (In-Memory Dispatched)', () => {
  describe('GET /api/health', () => {
    it('returns 200 OK with operational metadata and model configuration', async () => {
      const res = await dispatchRequest('GET', '/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(['ok', 'degraded', 'error']).toContain(res.body.status);
      expect(res.body.service).toBe('devdoctor-ai');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('ollama');
      expect(res.body.limits.maxImageSizeMb).toBe(10);
      expect(res.body.limits.allowedMimeTypes).toContain('image/png');
    });
  });

  describe('POST /api/analyze', () => {
    it('successfully diagnoses a valid error screenshot in demo mode', async () => {
      const payload = {
        image: SAMPLE_VALID_PNG_DATA_URL,
        context: 'terminal',
        description: 'Failed after npm start',
        demoMode: true,
      };

      const res = await dispatchRequest('POST', '/api/analyze', payload);

      expect(res.status).toBe(200);
      const diagnosis = res.body as DiagnosisResult;
      expect(diagnosis).toHaveProperty('id');
      expect(diagnosis).toHaveProperty('headline');
      expect(diagnosis).toHaveProperty('summary');
      expect(diagnosis.isDemo).toBe(true);
      expect(diagnosis.demoWatermark).toContain('DEMO / SAMPLE DATA');
      expect(diagnosis.confidenceScore).toBeGreaterThan(0.5);
      expect(diagnosis.evidence).toBeDefined();
      expect(diagnosis.evidence.rawText).toBeTruthy();
      expect(diagnosis.rootCauses.length).toBeGreaterThan(0);
      expect(diagnosis.troubleshootingSteps.length).toBeGreaterThan(0);
      expect(['safe', 'moderate', 'risky']).toContain(
        diagnosis.troubleshootingSteps[0].riskLevel
      );
    });

    it('rejects request with missing image field with HTTP 400', async () => {
      const res = await dispatchRequest('POST', '/api/analyze', { context: 'terminal' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('MISSING_IMAGE');
    });

    it('rejects unsupported MIME type (e.g. text/plain data URL) with HTTP 400', async () => {
      const res = await dispatchRequest('POST', '/api/analyze', {
        image: 'data:text/plain;base64,SGVsbG8gV29ybGQgTG9uZyBFbm91Z2ggUGF5bG9hZCBGb3IgVGVzdGluZw==',
        context: 'terminal',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('rejects oversized image payload (>10MB) with HTTP 413', async () => {
      // Create a simulated 11MB base64 string
      const largeLength = 11 * 1024 * 1024 * 1.4;
      const oversizedBase64 = 'A'.repeat(largeLength);

      const res = await dispatchRequest('POST', '/api/analyze', {
        image: oversizedBase64,
        context: 'terminal',
      });

      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('POST /api/verify', () => {
    it('successfully evaluates follow-up screenshot against original diagnosis', async () => {
      // First generate an initial diagnosis
      const diagRes = await dispatchRequest('POST', '/api/analyze', {
        image: SAMPLE_VALID_PNG_DATA_URL,
        context: 'terminal',
        demoMode: true,
      });

      const originalAnalysis = diagRes.body;

      // Submit verification
      const verifyRes = await dispatchRequest('POST', '/api/verify', {
        originalAnalysis,
        verificationImage: SAMPLE_VALID_PNG_DATA_URL,
        notes: 'Re-ran npm run dev after installing express',
        demoMode: true,
      });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body).toHaveProperty('id');
      expect(verifyRes.body.originalAnalysisId).toBe(originalAnalysis.id);
      expect(['resolved', 'still_present', 'new_error', 'inconclusive']).toContain(
        verifyRes.body.status
      );
      expect(verifyRes.body.observations.length).toBeGreaterThan(0);
      expect(verifyRes.body.comparisonSummary).toBeTruthy();
    });

    it('rejects verification request without originalAnalysis with HTTP 400', async () => {
      const res = await dispatchRequest('POST', '/api/verify', {
        verificationImage: SAMPLE_VALID_PNG_DATA_URL,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_ORIGINAL_ANALYSIS');
    });

    it('rejects verification request without verificationImage with HTTP 400', async () => {
      const res = await dispatchRequest('POST', '/api/verify', {
        originalAnalysis: { id: 'diag-123' },
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_IMAGE');
    });
  });

  describe('Route 404 & Error Handling', () => {
    it('returns structured 404 error for non-existent API routes', async () => {
      const res = await dispatchRequest('GET', '/api/unknown-route-12345');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});
