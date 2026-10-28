import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyToClipboard } from '../src/frontend/utils/clipboard.js';

describe('Clipboard Utility Test Suite', () => {
  const originalNavigator = globalThis.navigator;
  const originalDocument = globalThis.document;

  afterEach(() => {
    globalThis.navigator = originalNavigator;
    globalThis.document = originalDocument;
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).navigator = {
      clipboard: {
        writeText: writeTextMock,
      },
    };

    const result = await copyToClipboard('npm install express');
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('npm install express');
  });

  it('falls back to textarea execCommand if navigator.clipboard fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    (globalThis as any).navigator = {
      clipboard: {
        writeText: writeTextMock,
      },
    };

    const execMock = vi.fn().mockReturnValue(true);
    const mockTextarea = {
      value: '',
      style: {},
      focus: vi.fn(),
      select: vi.fn(),
    };
    (globalThis as any).document = {
      createElement: vi.fn().mockReturnValue(mockTextarea),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      execCommand: execMock,
    };

    const result = await copyToClipboard('git status');
    expect(result).toBe(true);
    expect(execMock).toHaveBeenCalledWith('copy');
  });

  it('returns false if both clipboard API and execCommand fail or throw', async () => {
    (globalThis as any).navigator = undefined;
    (globalThis as any).document = {
      createElement: vi.fn().mockImplementation(() => {
        throw new Error('Not supported');
      }),
    };

    const result = await copyToClipboard('some command');
    expect(result).toBe(false);
  });
});
