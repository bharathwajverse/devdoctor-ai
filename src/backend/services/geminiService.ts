import {
  DiagnosisResult,
  VerificationResult,
  EnvironmentContext,
  VerificationStatus,
} from '../../shared/types.ts';

export class GeminiService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async analyzeScreenshot(
    imageBase64: string,
    context: EnvironmentContext = 'terminal',
    description?: string
  ): Promise<DiagnosisResult> {
    if (!this.isConfigured()) {
      throw new Error('Google Gemini API key is not configured.');
    }

    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

    const prompt = `You are devdoctor-ai, a software error debugging specialist.
Inspect this error screenshot from a ${context.toUpperCase()} environment.
${description ? `User note: "${description}"` : ''}

You MUST reply with ONLY a single valid JSON object strictly matching this schema:
{
  "headline": "concise error title",
  "summary": "1-2 sentence developer-friendly explanation",
  "confidenceScore": 0.95,
  "evidence": {
    "rawText": "exact text from screen",
    "errorType": "type of error",
    "errorCode": "code if visible",
    "filePath": "file path if visible",
    "lineNumber": 12,
    "suspectComponent": "component or package",
    "uncertain": false
  },
  "rootCauses": [
    { "cause": "root cause description", "probability": 0.85, "explanation": "why this happens" }
  ],
  "troubleshootingSteps": [
    {
      "stepNumber": 1,
      "title": "Action title",
      "explanation": "Why this fixes the problem",
      "action": "exact shell command or file edit",
      "riskLevel": "safe",
      "rollbackAdvice": "how to undo if applicable"
    }
  ],
  "safetyNotice": "Warning about not running destructive actions."
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google API returned HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);

    return {
      id: `diag-${Math.random().toString(36).substring(2, 10)}`,
      timestamp: new Date().toISOString(),
      context,
      modelUsed: this.model,
      provider: 'google',
      isDemo: false,
      headline: parsed.headline || 'Error Detected in Screenshot',
      summary: parsed.summary || 'Exception analyzed via Google Generative AI.',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.9,
      evidence: {
        rawText: parsed.evidence?.rawText || '',
        errorType: parsed.evidence?.errorType || 'UnknownError',
        errorCode: parsed.evidence?.errorCode,
        filePath: parsed.evidence?.filePath,
        lineNumber: parsed.evidence?.lineNumber,
        suspectComponent: parsed.evidence?.suspectComponent,
        uncertain: parsed.evidence?.uncertain ?? false,
      },
      rootCauses: Array.isArray(parsed.rootCauses)
        ? parsed.rootCauses
        : [{ cause: 'Runtime error', probability: 0.8, explanation: 'Inspected visually' }],
      troubleshootingSteps: Array.isArray(parsed.troubleshootingSteps)
        ? parsed.troubleshootingSteps
        : [],
      safetyNotice:
        parsed.safetyNotice ||
        'Review commands before execution. Never run unknown terminal commands as root/admin.',
      userNotes: description,
    };
  }

  public async verifyScreenshot(
    originalAnalysis: DiagnosisResult,
    verificationImageBase64: string,
    notes?: string
  ): Promise<VerificationResult> {
    if (!this.isConfigured()) {
      throw new Error('Google Gemini API key is not configured.');
    }

    const cleanBase64 = verificationImageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    const mimeMatch = verificationImageBase64.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

    const prompt = `You are devdoctor-ai verifying if an error was resolved.
Original Diagnosis:
- Headline: ${originalAnalysis.headline}
- Evidence: ${originalAnalysis.evidence.rawText}

${notes ? `User note on troubleshooting done: "${notes}"` : ''}

Compare the original problem with the new screenshot.
Determine whether the error is:
1. "resolved" (clean terminal, successful run, no error)
2. "still_present" (same error visible)
3. "new_error" (different error encountered)
4. "inconclusive" (blurry or unrelated image)

You MUST respond strictly with a valid JSON object matching this schema:
{
  "status": "resolved" | "still_present" | "new_error" | "inconclusive",
  "statusLabel": "Problem Resolved" | "Error Still Present" | "New Error Encountered" | "Inconclusive",
  "confidence": 0.95,
  "observations": ["observation 1", "observation 2"],
  "comparisonSummary": "summary comparing both states",
  "nextSteps": [
    {
      "stepNumber": 1,
      "title": "Action title",
      "explanation": "Why do this next",
      "action": "suggested command",
      "riskLevel": "safe"
    }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google API returned HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);

    const validStatuses: VerificationStatus[] = [
      'resolved',
      'still_present',
      'new_error',
      'inconclusive',
    ];
    const status: VerificationStatus = validStatuses.includes(parsed.status)
      ? parsed.status
      : 'inconclusive';

    return {
      id: `veri-${Math.random().toString(36).substring(2, 10)}`,
      originalAnalysisId: originalAnalysis.id,
      timestamp: new Date().toISOString(),
      status,
      statusLabel: parsed.statusLabel || status,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      comparisonSummary: parsed.comparisonSummary || 'Analysis complete.',
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      isDemo: false,
      modelUsed: this.model,
      provider: 'google',
    };
  }
}
