import { useState, useCallback } from 'react';
import { DiagnosisResult, EnvironmentContext } from '../../shared/types.js';

export interface UseAnalysisOptions {
  onSuccess?: (diagnosis: DiagnosisResult) => void;
  onError?: (error: Error) => void;
}

export interface AnalyzeParams {
  image: string;
  extractedText?: string;
  context: EnvironmentContext;
  description?: string;
  demoMode?: boolean;
}

export function useAnalysis(options: UseAnalysisOptions = {}) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (params: AnalyzeParams): Promise<DiagnosisResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Diagnosis failed with HTTP ${res.status}`);
        }

        const result = (await res.json()) as DiagnosisResult;
        setDiagnosis(result);
        options.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const message = err.message || 'An unexpected error occurred during diagnosis.';
        setError(message);
        options.onError?.(err instanceof Error ? err : new Error(message));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const clearDiagnosis = useCallback(() => {
    setDiagnosis(null);
    setError(null);
  }, []);

  return {
    diagnosis,
    isLoading,
    error,
    analyze,
    clearDiagnosis,
    setDiagnosis,
    setError,
  };
}
