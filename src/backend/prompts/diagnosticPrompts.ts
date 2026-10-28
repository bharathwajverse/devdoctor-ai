import { EnvironmentContext } from '../../shared/types.js';

export function buildDiagnosisPrompt(
  context: EnvironmentContext,
  userDescription?: string,
  extractedText?: string
): string {
  return `You are devdoctor-ai, an expert software debugging assistant specializing in error screenshots.
Analyze the provided screenshot carefully.
Context environment: ${context}.
${userDescription ? `User explanation of what happened: "${userDescription}".` : ''}
${extractedText ? `Visible error text extracted from screenshot (via local OCR):\n"""\n${extractedText}\n"""` : ''}

You MUST extract and diagnose:
1. Exact error text, file path, line number, error code, and suspect library.
2. Contextual evaluation: Is the evidence clear or uncertain/blurry?
3. Root cause hypotheses: List 2-3 plausible causes with estimated probabilities (0.0 to 1.0).
4. Troubleshooting steps: Prioritized list of concrete fixes. Each step MUST have:
   - stepNumber: integer
   - title: concise action title
   - explanation: why this works
   - action: exact terminal command or code change
   - riskLevel: "safe", "moderate", or "risky"
   - rollbackAdvice: how to undo if destructive (optional)

Respond strictly in valid JSON matching this schema:
{
  "headline": "Concise error title",
  "summary": "Plain-English explanation of why this error occurred",
  "confidenceScore": 0.95,
  "evidence": {
    "rawText": "Extracted error text or stack trace",
    "errorType": "Error category (e.g. MODULE_NOT_FOUND, TypeError)",
    "errorCode": "Standard error code if visible",
    "filePath": "Relative or absolute file path if visible",
    "lineNumber": 12,
    "suspectComponent": "Component or package",
    "uncertain": false
  },
  "rootCauses": [
    { "cause": "Description of root cause", "probability": 0.8, "explanation": "Detailed rationale" }
  ],
  "troubleshootingSteps": [
    {
      "stepNumber": 1,
      "title": "Action title",
      "explanation": "Why to run this",
      "action": "npm install package-name",
      "riskLevel": "safe"
    }
  ],
  "safetyNotice": "Review commands before execution. devdoctor-ai never runs commands automatically."
}`;
}

export function buildVerificationPrompt(
  headline: string,
  errorType?: string,
  suspectComponent?: string,
  notes?: string,
  extractedFollowUpText?: string
): string {
  return `You are devdoctor-ai verifying whether a software error has been resolved.
Previous Diagnosis:
- Headline: ${headline}
- Error Type: ${errorType || 'Unknown'}
- Suspect Component: ${suspectComponent || 'Unknown'}
${notes ? `User notes on applied fixes: "${notes}"` : ''}
${extractedFollowUpText ? `Follow-up screenshot text / OCR evidence:\n"""\n${extractedFollowUpText}\n"""` : ''}

Inspect the follow-up screenshot. Compare it against the previous error state.
Determine:
1. status: "resolved" (or "likely_resolved" if error cleared, success output, clean prompt) | "still_present" (same error visible) | "new_error" (different error now visible) | "inconclusive" (cannot tell)
2. confidence: number between 0.0 and 1.0
3. observations: list of 2-3 visual observations from the new screenshot
4. comparisonSummary: summary of what changed between states
5. nextSteps: 1-2 follow-up commands if needed

Respond strictly in valid JSON matching this schema:
{
  "status": "resolved",
  "confidence": 0.95,
  "observations": ["Observation 1", "Observation 2"],
  "comparisonSummary": "Explanation of changes visible in the screenshot",
  "nextSteps": [
    {
      "stepNumber": 1,
      "title": "Verify service health",
      "explanation": "Ensure endpoint responds",
      "action": "curl http://localhost:3000",
      "riskLevel": "safe"
    }
  ]
}`;
}

