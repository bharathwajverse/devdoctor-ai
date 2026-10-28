import { describe, it, expect } from 'vitest';
import {
  extractJsonFromText,
  parseDiagnosisFromModel,
  parseVerificationFromModel,
} from '../src/backend/services/jsonParser.js';

describe('JSON Parser & Normalizer', () => {
  it('extracts raw JSON without fences', () => {
    const raw = '{"headline":"Test Error","confidenceScore":0.9}';
    expect(extractJsonFromText(raw)).toBe(raw);
  });

  it('strips markdown ```json fences and extracts inner JSON', () => {
    const raw = '```json\n{"headline":"Fenced Error"}\n```';
    expect(extractJsonFromText(raw)).toBe('{"headline":"Fenced Error"}');
  });

  it('extracts JSON when surrounded by conversational prefix and postfix', () => {
    const raw = 'Sure! Here is the JSON diagnosis:\n```json\n{"headline":"Chatty Model"}\n```\nHope this helps!';
    expect(extractJsonFromText(raw)).toBe('{"headline":"Chatty Model"}');
  });

  it('normalizes complete model output into valid DiagnosisResult', () => {
    const modelOutput = JSON.stringify({
      headline: 'SyntaxError: Unexpected token',
      summary: 'Missing closing curly brace in app.js.',
      confidenceScore: 0.92,
      evidence: {
        rawText: 'SyntaxError: Unexpected token } at line 42',
        errorType: 'SyntaxError',
        filePath: 'src/app.js',
        lineNumber: 42,
        uncertain: false,
      },
      rootCauses: [
        {
          cause: 'Unmatched bracket in object literal',
          probability: 0.9,
          explanation: 'Line 42 has an extra closing brace.',
        },
      ],
      troubleshootingSteps: [
        {
          stepNumber: 1,
          title: 'Fix syntax error',
          explanation: 'Remove the extra brace.',
          action: 'nano src/app.js',
          riskLevel: 'safe',
        },
      ],
      safetyNotice: 'Check git diff before committing.',
    });

    const result = parseDiagnosisFromModel(modelOutput, 'terminal', 'gemma4');
    expect(result.headline).toBe('SyntaxError: Unexpected token');
    expect(result.evidence.lineNumber).toBe(42);
    expect(result.confidenceScore).toBe(0.92);
    expect(result.rootCauses.length).toBe(1);
    expect(result.troubleshootingSteps[0].riskLevel).toBe('safe');
  });

  it('gracefully handles malformed or partial output with fallback schema', () => {
    const malformed = 'This is not valid JSON at all. Just random error text.';
    const result = parseDiagnosisFromModel(malformed, 'terminal', 'gemma4');

    expect(result.id).toBeDefined();
    expect(result.headline).toBe('Unstructured Diagnostic Output');
    expect(result.evidence.uncertain).toBe(true);
    expect(result.troubleshootingSteps.length).toBeGreaterThan(0);
    expect(result.confidenceScore).toBe(0.5);
  });

  it('parses verification result with valid status', () => {
    const verifyOutput = JSON.stringify({
      status: 'resolved',
      confidence: 0.95,
      observations: ['No error in terminal', 'Clean prompt'],
      comparisonSummary: 'The previous crash is no longer visible.',
      nextSteps: [
        {
          stepNumber: 1,
          title: 'Run health check',
          explanation: 'Confirm API responds',
          action: 'curl http://localhost:3000',
          riskLevel: 'safe',
        },
      ],
    });

    const result = parseVerificationFromModel(verifyOutput, 'diag-123', 'gemma4');
    expect(result.status).toBe('resolved');
    expect(result.statusLabel).toBe('Problem Resolved');
    expect(result.confidence).toBe(0.95);
    expect(result.observations.length).toBe(2);
  });

  it('maps invalid or unknown status to inconclusive', () => {
    const unknownOutput = JSON.stringify({
      status: 'something_weird',
      comparisonSummary: 'Cannot clearly see the result.',
    });

    const result = parseVerificationFromModel(unknownOutput, 'diag-123', 'gemma4');
    expect(result.status).toBe('inconclusive');
    expect(result.statusLabel).toBe('Inconclusive Result');
  });
});
