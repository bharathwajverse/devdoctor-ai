import {
  DiagnosisResult,
  VerificationResult,
  TroubleshootingStep,
  RootCauseHypothesis,
  ExtractedEvidence,
} from '../../shared/types.js';

/**
 * Extracts a JSON string from raw model text that may be surrounded by markdown blocks or chat fluff.
 */
export function extractJsonFromText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or non-string model response received.');
  }

  let text = rawText.trim();

  // Strip markdown code fences (```json ... ``` or ``` ...)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // Find outermost curly braces if there's leading/trailing explanatory text
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  return text;
}

/**
 * Safely parses raw model output into a typed DiagnosisResult.
 */
export function parseDiagnosisFromModel(
  rawOutput: string,
  context: string,
  modelName: string,
  userNotes?: string
): DiagnosisResult {
  let parsed: any = null;
  let parseSucceeded = false;

  try {
    const jsonString = extractJsonFromText(rawOutput);
    parsed = JSON.parse(jsonString);
    parseSucceeded = true;
  } catch (err) {
    // Fallback: If JSON parsing fails completely, extract human-readable text into structured fields
    parsed = {
      headline: 'Unstructured Diagnostic Output',
      summary: rawOutput.slice(0, 300) + (rawOutput.length > 300 ? '...' : ''),
      confidenceScore: 0.5,
      evidence: {
        rawText: rawOutput.slice(0, 1000),
        errorType: 'Unspecified Error',
        uncertain: true,
      },
      rootCauses: [
        {
          cause: 'Model produced unstructured analysis',
          probability: 0.5,
          explanation: 'Raw diagnostic information extracted from model output.',
        },
      ],
      troubleshootingSteps: [
        {
          stepNumber: 1,
          title: 'Review Raw Model Output',
          explanation: 'The model provided troubleshooting guidance in plain text format.',
          action: '# Review the error text visible in your screenshot',
          riskLevel: 'safe' as const,
        },
      ],
    };
  }

  // Normalize evidence
  const evidence: ExtractedEvidence = {
    rawText: String(parsed.evidence?.rawText || parsed.headline || 'Evidence extracted from screenshot'),
    errorType: String(parsed.evidence?.errorType || 'Runtime Error'),
    errorCode: parsed.evidence?.errorCode ? String(parsed.evidence.errorCode) : undefined,
    filePath: parsed.evidence?.filePath ? String(parsed.evidence.filePath) : undefined,
    lineNumber: typeof parsed.evidence?.lineNumber === 'number' ? parsed.evidence.lineNumber : undefined,
    suspectComponent: parsed.evidence?.suspectComponent ? String(parsed.evidence.suspectComponent) : undefined,
    uncertain: Boolean(parsed.evidence?.uncertain ?? (!parseSucceeded || false)),
  };

  // Normalize root causes
  const rootCauses: RootCauseHypothesis[] = Array.isArray(parsed.rootCauses) && parsed.rootCauses.length > 0
    ? parsed.rootCauses.map((rc: any, idx: number) => ({
        cause: String(rc.cause || `Potential cause ${idx + 1}`),
        probability: typeof rc.probability === 'number' ? Math.min(Math.max(rc.probability, 0.05), 0.99) : 0.6,
        explanation: String(rc.explanation || rc.cause || 'No detailed explanation provided.'),
      }))
    : [
        {
          cause: parsed.headline || 'Identified Error Pattern',
          probability: 0.75,
          explanation: parsed.summary || 'Root cause deduced from screenshot visual evidence.',
        },
      ];

  // Normalize troubleshooting steps
  const troubleshootingSteps: TroubleshootingStep[] = Array.isArray(parsed.troubleshootingSteps) && parsed.troubleshootingSteps.length > 0
    ? parsed.troubleshootingSteps.map((step: any, idx: number) => {
        const rawRisk = String(step.riskLevel || 'safe').toLowerCase();
        const riskLevel = (['safe', 'moderate', 'risky'].includes(rawRisk) ? rawRisk : 'safe') as 'safe' | 'moderate' | 'risky';
        return {
          stepNumber: typeof step.stepNumber === 'number' ? step.stepNumber : idx + 1,
          title: String(step.title || `Troubleshooting Step ${idx + 1}`),
          explanation: String(step.explanation || 'Execute this action to resolve the observed error condition.'),
          action: String(step.action || '# Review screenshot and logs'),
          riskLevel,
          rollbackAdvice: step.rollbackAdvice ? String(step.rollbackAdvice) : undefined,
        };
      })
    : [
        {
          stepNumber: 1,
          title: 'Inspect Error Location',
          explanation: 'Check the file and command indicated in the screenshot.',
          action: '# Re-run with debug logging enabled',
          riskLevel: 'safe' as const,
        },
      ];

  const confidenceScore = typeof parsed.confidenceScore === 'number'
    ? Math.min(Math.max(parsed.confidenceScore, 0.1), 0.99)
    : parseSucceeded ? 0.88 : 0.5;

  return {
    id: `diag-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    context: context as any,
    modelUsed: modelName,
    provider: 'ollama',
    isDemo: false,
    headline: String(parsed.headline || 'Software Error Detected'),
    summary: String(parsed.summary || 'Visual evidence extracted from uploaded screenshot indicates an error condition.'),
    confidenceScore: Number(confidenceScore.toFixed(2)),
    evidence,
    rootCauses,
    troubleshootingSteps,
    safetyNotice: String(
      parsed.safetyNotice ||
      'Review all commands carefully before execution. devdoctor-ai never runs commands automatically.'
    ),
    userNotes,
  };
}

/**
 * Safely parses raw model output into a typed VerificationResult.
 */
export function parseVerificationFromModel(
  rawOutput: string,
  originalAnalysisId: string,
  modelName: string
): VerificationResult {
  let parsed: any = null;

  try {
    const jsonString = extractJsonFromText(rawOutput);
    parsed = JSON.parse(jsonString);
  } catch (err) {
    parsed = {
      status: 'inconclusive',
      statusLabel: 'Inconclusive Resolution',
      confidence: 0.5,
      observations: ['Model produced unstructured verification comparison.'],
      comparisonSummary: rawOutput.slice(0, 300),
      nextSteps: [],
    };
  }

  let rawStatus = String(parsed.status || 'inconclusive').toLowerCase().trim();
  if (
    rawStatus === 'likely_resolved' ||
    rawStatus === 'likely resolved' ||
    rawStatus === 'likely-resolved'
  ) {
    rawStatus = 'resolved';
  }
  const validStatuses = ['resolved', 'still_present', 'new_error', 'inconclusive'];
  const status = (validStatuses.includes(rawStatus) ? rawStatus : 'inconclusive') as any;

  const statusLabels: Record<string, string> = {
    resolved: 'Problem Resolved',
    still_present: 'Error Still Present',
    new_error: 'New Downstream Error',
    inconclusive: 'Inconclusive Result',
  };

  const observations: string[] = Array.isArray(parsed.observations) && parsed.observations.length > 0
    ? parsed.observations.map(String)
    : ['Follow-up screenshot evaluated against previous error state.'];

  const nextSteps: TroubleshootingStep[] = Array.isArray(parsed.nextSteps)
    ? parsed.nextSteps.map((step: any, idx: number) => {
        const rawRisk = String(step.riskLevel || 'safe').toLowerCase();
        const riskLevel = (['safe', 'moderate', 'risky'].includes(rawRisk) ? rawRisk : 'safe') as any;
        return {
          stepNumber: typeof step.stepNumber === 'number' ? step.stepNumber : idx + 1,
          title: String(step.title || `Next Step ${idx + 1}`),
          explanation: String(step.explanation || 'Recommended action following verification.'),
          action: String(step.action || '# Check status'),
          riskLevel,
        };
      })
    : [];

  return {
    id: `veri-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    originalAnalysisId,
    timestamp: new Date().toISOString(),
    status,
    statusLabel: statusLabels[status] || 'Verified State',
    confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0.1), 0.99) : 0.85,
    observations,
    comparisonSummary: String(parsed.comparisonSummary || 'Comparative analysis between initial screenshot and follow-up screenshot.'),
    nextSteps,
    isDemo: false,
    modelUsed: modelName,
    provider: 'ollama',
  };
}
