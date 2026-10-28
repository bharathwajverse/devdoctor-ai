import { describe, it, expect, vi } from 'vitest';
import { Logger } from '../src/backend/utils/logger.js';

describe('Logger Utility Test Suite', () => {
  it('formats and outputs info level logs to stdout', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Logger.info('Test info message', { module: 'test' });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('Test info message');
    expect(parsed.context.module).toBe('test');
    expect(parsed.timestamp).toBeTruthy();
    spy.mockRestore();
  });

  it('formats and outputs error level logs to stderr', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.error('Test error message');

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('Test error message');
    spy.mockRestore();
  });
});
