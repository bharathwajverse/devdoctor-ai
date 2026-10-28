import { describe, it, expect } from 'vitest';
import { formatBytes, formatPercentage, truncateString } from '../src/frontend/utils/formatters.js';

describe('Frontend Formatters Test Suite', () => {
  it('formats byte numbers into human readable sizes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB');
  });

  it('clamps and formats percentages properly', () => {
    expect(formatPercentage(0)).toBe('0%');
    expect(formatPercentage(0.954)).toBe('95%');
    expect(formatPercentage(1.0)).toBe('100%');
    expect(formatPercentage(1.5)).toBe('100%');
    expect(formatPercentage(-0.5)).toBe('0%');
  });

  it('truncates strings exceeding max length', () => {
    expect(truncateString('Short text', 20)).toBe('Short text');
    expect(truncateString('A very long sentence that needs truncating', 10)).toBe('A very lon...');
  });
});
