import { describe, it, expect } from 'vitest';
import { dispatchRequest } from './mockServer.js';

describe('API Error Handling and RFC-7807 Response Tests', () => {
  it('returns 400 MISSING_IMAGE when body has no image', async () => {
    const res = await dispatchRequest('POST', '/api/analyze', {});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('MISSING_IMAGE');
    expect(res.body.error.timestamp).toBeTruthy();
  });

  it('returns 400 INVALID_FILE_TYPE for unsupported file formats', async () => {
    const unsupportedDataUri = `data:application/json;base64,${'A'.repeat(120)}`;
    const res = await dispatchRequest('POST', '/api/analyze', {
      image: unsupportedDataUri,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('returns 413 FILE_TOO_LARGE for oversized payloads', async () => {
    // 15MB simulated payload
    const largeLength = 12 * 1024 * 1024 * 1.4;
    const res = await dispatchRequest('POST', '/api/analyze', {
      image: 'A'.repeat(largeLength),
    });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('returns 400 MISSING_ORIGINAL_ANALYSIS when verifying without analysis object', async () => {
    const res = await dispatchRequest('POST', '/api/verify', {
      verificationImage:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_ORIGINAL_ANALYSIS');
  });

  it('returns 404 ROUTE_NOT_FOUND for unknown routes', async () => {
    const res = await dispatchRequest('GET', '/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
