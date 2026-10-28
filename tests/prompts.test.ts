import { describe, it, expect } from 'vitest';
import {
  buildDiagnosisPrompt,
  buildVerificationPrompt,
} from '../src/backend/prompts/diagnosticPrompts.js';

describe('Diagnostic Prompts Test Suite', () => {
  it('builds diagnosis prompt containing context and schema requirements', () => {
    const prompt = buildDiagnosisPrompt('terminal', 'npm run dev crashed');

    expect(prompt).toContain('Context environment: terminal.');
    expect(prompt).toContain('npm run dev crashed');
    expect(prompt).toContain('"headline":');
    expect(prompt).toContain('"troubleshootingSteps":');
    expect(prompt).toContain('"riskLevel":');
  });

  it('builds diagnosis prompt cleanly without user description', () => {
    const prompt = buildDiagnosisPrompt('docker');

    expect(prompt).toContain('Context environment: docker.');
    expect(prompt).not.toContain('User explanation');
    expect(prompt).toContain('confidenceScore');
  });

  it('builds verification prompt containing comparative evaluation schema', () => {
    const prompt = buildVerificationPrompt(
      'Cannot find module express',
      'MODULE_NOT_FOUND',
      'express',
      'Ran npm install express'
    );

    expect(prompt).toContain('Cannot find module express');
    expect(prompt).toContain('MODULE_NOT_FOUND');
    expect(prompt).toContain('express');
    expect(prompt).toContain('Ran npm install express');
    expect(prompt).toContain('"resolved"');
    expect(prompt).toContain('"still_present"');
    expect(prompt).toContain('"new_error"');
    expect(prompt).toContain('"inconclusive"');
  });

  it('handles optional fields in verification prompt gracefully', () => {
    const prompt = buildVerificationPrompt('Unknown failure');

    expect(prompt).toContain('Unknown failure');
    expect(prompt).toContain('Error Type: Unknown');
    expect(prompt).toContain('Suspect Component: Unknown');
    expect(prompt).not.toContain('User notes on applied fixes');
  });
});
