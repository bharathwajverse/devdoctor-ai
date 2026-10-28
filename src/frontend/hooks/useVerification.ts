import { useState, useCallback } from 'react';
import { DiagnosisResult, VerificationResult } from '../../shared/types.js';

export interface UseVerificationOptions {
  onSuccess?: (result: VerificationResult) => void;
  onError?: (error: Error) => void;
}

export interface VerifyParams {
  originalAnalysis: DiagnosisResult;
  verificationImage: string;
  extractedText?: string;
  notes?: string;
  demoMode?: boolean;
}

export function useVerification(options: UseVerificationOptions = {}) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (params: VerifyParams): Promise<VerificationResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Verification failed with HTTP ${res.status}`);
        }

        const data = (await res.json()) as VerificationResult;
        setResult(data);
        options.onSuccess?.(data);
        return data;
      } catch (err: any) {
        const message = err.message || 'An unexpected error occurred during verification.';
        setError(message);
        options.onError?.(err instanceof Error ? err : new Error(message));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const clearVerification = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isLoading,
    error,
    verify,
    clearVerification,
    setResult,
    setError,
  };
}
