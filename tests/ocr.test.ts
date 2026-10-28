import { describe, it, expect, vi } from 'vitest';
import { extractTextFromImage } from '../src/frontend/utils/ocr.js';

vi.mock('tesseract.js', () => ({
  default: {
    recognize: vi.fn(async (imageUri: string, _lang: string, options?: any) => {
      if (imageUri.includes('corrupted')) {
        throw new Error('Image parsing failed: invalid buffer');
      }
      if (imageUri.includes('sample-error')) {
        if (options?.logger) {
          options.logger({ status: 'recognizing text', progress: 0.85 });
        }
        return {
          data: {
            text: "Error: Cannot find module 'express'\n  at server.js:1:1\n",
            confidence: 94.2,
          },
        };
      }
      return {
        data: {
          text: '',
          confidence: 0,
        },
      };
    }),
  },
}));

describe('Client-Side OCR Utilities Test Suite', () => {
  it('returns failure result when image URI is empty or null', async () => {
    const res = await extractTextFromImage('');
    expect(res.success).toBe(false);
    expect(res.text).toBe('');
    expect(res.confidence).toBe(0);
    expect(res.error).toBe('No image provided');
  });

  it('handles invalid or corrupted data URI gracefully without unhandled crashes', async () => {
    const res = await extractTextFromImage('data:image/png;base64,corrupted-data');
    expect(res.success).toBe(false);
    expect(res.text).toBe('');
    expect(res.error).toContain('Image parsing failed');
  });

  it('successfully extracts and trims visible text with progress tracking', async () => {
    const progressUpdates: any[] = [];
    const res = await extractTextFromImage('data:image/png;base64,sample-error-payload', (p) => {
      progressUpdates.push(p);
    });

    expect(res.success).toBe(true);
    expect(res.text).toContain("Error: Cannot find module 'express'");
    expect(res.confidence).toBe(94.2);
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0].progress).toBe(85);
  });
});
