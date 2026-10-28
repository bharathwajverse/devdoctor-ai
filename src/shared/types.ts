/**
 * devdoctor-ai — Shared Type Definitions
 * Single source of truth for Backend, Frontend, and Test suites.
 */

export type EnvironmentContext =
  | 'terminal'
  | 'browser'
  | 'ide'
  | 'docker'
  | 'cicd'
  | 'system'
  | 'other';

export type RiskLevel = 'safe' | 'moderate' | 'risky';

export type ModelProviderType = 'ollama' | 'google' | 'demo';

export interface TroubleshootingStep {
  stepNumber: number;
  title: string;
  explanation: string;
  action: string;
  riskLevel: RiskLevel;
  rollbackAdvice?: string;
}

export interface ExtractedEvidence {
  rawText: string;
  errorType: string;
  errorCode?: string;
  filePath?: string;
  lineNumber?: number;
  suspectComponent?: string;
  uncertain: boolean;
}

export interface RootCauseHypothesis {
  cause: string;
  probability: number; // 0.0 to 1.0
  explanation: string;
}

export interface DiagnosisResult {
  id: string;
  timestamp: string;
  context: EnvironmentContext;
  modelUsed: string;
  provider: ModelProviderType;
  isDemo: boolean;
  demoWatermark?: string;
  headline: string;
  summary: string;
  confidenceScore: number; // 0.0 to 1.0
  evidence: ExtractedEvidence;
  rootCauses: RootCauseHypothesis[];
  troubleshootingSteps: TroubleshootingStep[];
  safetyNotice: string;
  userNotes?: string;
}

export type VerificationStatus =
  | 'resolved'
  | 'still_present'
  | 'new_error'
  | 'inconclusive';

export interface VerificationResult {
  id: string;
  originalAnalysisId: string;
  timestamp: string;
  status: VerificationStatus;
  statusLabel: string;
  confidence: number;
  observations: string[];
  comparisonSummary: string;
  nextSteps: TroubleshootingStep[];
  isDemo: boolean;
  modelUsed: string;
  provider: ModelProviderType;
}

export interface AnalyzeRequest {
  image: string; // Base64 data URI (data:image/png;base64,...) or raw base64 string
  context?: EnvironmentContext;
  description?: string;
  demoMode?: boolean;
}

export interface VerifyRequest {
  originalAnalysis: DiagnosisResult;
  verificationImage: string; // Base64 data URI or raw base64 string
  notes?: string;
  demoMode?: boolean;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  modelProvider: ModelProviderType;
  modelIdentifier: string;
  ollama: {
    configuredUrl: string;
    connected: boolean;
    availableModels: string[];
  };
  google: {
    configured: boolean;
    model: string;
  };
  demoFallbackEnabled: boolean;
  limits: {
    maxImageSizeMb: number;
    allowedMimeTypes: string[];
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}
