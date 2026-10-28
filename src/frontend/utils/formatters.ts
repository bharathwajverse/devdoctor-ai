/**
 * Utilities for formatting file sizes and confidence percentages.
 */

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatPercentage(val: number): string {
  const clamped = Math.min(Math.max(val, 0), 1);
  return `${Math.round(clamped * 100)}%`;
}

export function truncateString(str: string, maxLen = 60): string {
  if (str.length <= maxLen) return str;
  return `${str.substring(0, maxLen)}...`;
}
