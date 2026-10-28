import { describe, it, expect } from 'vitest';
import { dispatchRequest } from './mockServer.js';
import {
  ApiError,
  MissingImageError,
  InvalidFileTypeError,
  FileTooLargeError,
  MissingOriginalAnalysisError,
  ModelUnavailableError,
  ModelInferenceError,
  RouteNotFoundError,
} from '../src/backend/errors/apiErrors.js';

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

  describe('Typed ApiError Class Hierarchy Unit Tests', () => {
    it('initializes base ApiError with both statusCode and status aliases', () => {
      const err = new ApiError(418, 'TEAPOT', 'I am a teapot', { foo: 'bar' });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(418);
      expect(err.status).toBe(418);
      expect(err.code).toBe('TEAPOT');
      expect(err.message).toBe('I am a teapot');
      expect(err.details).toEqual({ foo: 'bar' });
    });

    it('instantiates specific subclasses with expected default codes and HTTP statuses', () => {
      const missingImg = new MissingImageError();
      expect(missingImg.statusCode).toBe(400);
      expect(missingImg.status).toBe(400);
      expect(missingImg.code).toBe('MISSING_IMAGE');

      const invalidType = new InvalidFileTypeError();
      expect(invalidType.statusCode).toBe(400);
      expect(invalidType.status).toBe(400);
      expect(invalidType.code).toBe('INVALID_FILE_TYPE');

      const tooLarge = new FileTooLargeError();
      expect(tooLarge.statusCode).toBe(413);
      expect(tooLarge.status).toBe(413);
      expect(tooLarge.code).toBe('FILE_TOO_LARGE');

      const missingAnalysis = new MissingOriginalAnalysisError();
      expect(missingAnalysis.statusCode).toBe(400);
      expect(missingAnalysis.status).toBe(400);
      expect(missingAnalysis.code).toBe('MISSING_ORIGINAL_ANALYSIS');

      const modelUnavailable = new ModelUnavailableError();
      expect(modelUnavailable.statusCode).toBe(503);
      expect(modelUnavailable.status).toBe(503);
      expect(modelUnavailable.code).toBe('MODEL_UNAVAILABLE');

      const modelInference = new ModelInferenceError();
      expect(modelInference.statusCode).toBe(502);
      expect(modelInference.status).toBe(502);
      expect(modelInference.code).toBe('MODEL_INFERENCE_FAILED');

      const notFound = new RouteNotFoundError();
      expect(notFound.statusCode).toBe(404);
      expect(notFound.status).toBe(404);
      expect(notFound.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});

