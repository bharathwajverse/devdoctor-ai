import { describe, it, expect } from 'vitest';
import { parseAndValidateBase64 } from '../src/backend/middleware/validation.js';

describe('Validation Middleware: parseAndValidateBase64', () => {
  // A tiny valid 1x1 transparent PNG encoded in base64
  const validPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const validPngDataUri = `data:image/png;base64,${validPngBase64}`;
  const validJpegDataUri = `data:image/jpeg;base64,${validPngBase64}`;
  const validWebpDataUri = `data:image/webp;base64,${validPngBase64}`;

  it('successfully parses and validates a standard PNG data URI', () => {
    const result = parseAndValidateBase64(validPngDataUri);
    expect(result.mimeType).toBe('image/png');
    expect(result.rawBase64).toBe(validPngBase64);
    expect(result.sizeBytes).toBeGreaterThan(10);
  });

  it('accepts valid JPEG and WebP data URIs', () => {
    const jpegResult = parseAndValidateBase64(validJpegDataUri);
    expect(jpegResult.mimeType).toBe('image/jpeg');

    const webpResult = parseAndValidateBase64(validWebpDataUri);
    expect(webpResult.mimeType).toBe('image/webp');
  });

  it('normalizes image/jpg to image/jpeg', () => {
    const jpgUri = `data:image/jpg;base64,${validPngBase64}`;
    const result = parseAndValidateBase64(jpgUri);
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('accepts raw base64 strings defaulting to image/png', () => {
    const result = parseAndValidateBase64(validPngBase64);
    expect(result.mimeType).toBe('image/png');
    expect(result.rawBase64).toBe(validPngBase64);
  });

  it('rejects unsupported MIME types such as image/gif or application/pdf', () => {
    const gifUri = `data:image/gif;base64,${validPngBase64}`;
    expect(() => parseAndValidateBase64(gifUri)).toThrowError(
      expect.objectContaining({ code: 'INVALID_FILE_TYPE' })
    );

    const pdfUri = `data:application/pdf;base64,${validPngBase64}`;
    expect(() => parseAndValidateBase64(pdfUri)).toThrowError(
      expect.objectContaining({ code: 'INVALID_FILE_TYPE' })
    );
  });

  it('rejects missing or empty image input', () => {
    expect(() => parseAndValidateBase64('')).toThrowError(
      expect.objectContaining({ code: 'MISSING_IMAGE' })
    );
    expect(() => parseAndValidateBase64(null as any)).toThrowError(
      expect.objectContaining({ code: 'MISSING_IMAGE' })
    );
  });

  it('rejects trivially small payloads', () => {
    expect(() => parseAndValidateBase64('abcd')).toThrowError(
      expect.objectContaining({ code: 'INVALID_IMAGE_DATA' })
    );
  });

  it('rejects oversized image payloads exceeding 10MB', () => {
    // Generate a simulated base64 string corresponding to >11MB
    // 11MB * 1024 * 1024 * 4/3 chars ≈ 15,380,000 characters
    const largeLength = 11 * 1024 * 1024 * 1.4;
    const oversizedBase64 = 'A'.repeat(largeLength);

    expect(() => parseAndValidateBase64(oversizedBase64)).toThrowError(
      expect.objectContaining({ code: 'FILE_TOO_LARGE' })
    );
  });
});
