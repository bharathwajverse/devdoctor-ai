import { OllamaService } from '../src/backend/services/ollamaService.js';
import { ModelRouter } from '../src/backend/services/modelRouter.js';

async function main() {
  console.log('--- Step 1: Checking Ollama Health ---');
  const health = await OllamaService.checkHealth();
  console.log('Connected:', health.connected);
  console.log('Configured URL:', health.configuredUrl);
  console.log('Available Models:', health.availableModels);

  if (!health.connected) {
    console.error('FAIL: Ollama is not reachable on configured URL.');
    process.exit(1);
  }

  console.log('\n--- Step 2: Testing Live Llama 3 Error Diagnosis ---');
  const sampleErrorText = `Error: Cannot find module 'express'
Require stack:
- /app/src/backend/server.js:1:1
- /app/node_modules/tsx/dist/cli.mjs:1:1
    at Module._resolveFilename (node:internal/modules/cjs/loader:1077:15)
    at Module._load (node:internal/modules/cjs/loader:928:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:83:12)`;

  const diagnosis = await ModelRouter.analyze(
    undefined,
    'terminal',
    'Application crashed immediately upon running node server.js',
    false,
    sampleErrorText
  );

  console.log('Diagnosis ID:', diagnosis.id);
  console.log('Headline:', diagnosis.headline);
  console.log('Summary:', diagnosis.summary);
  console.log('Model Used:', diagnosis.modelUsed);
  console.log('Provider:', diagnosis.provider);
  console.log('Confidence Score:', diagnosis.confidenceScore);
  console.log('Evidence errorType:', diagnosis.evidence.errorType);
  console.log('Evidence rawText length:', diagnosis.evidence.rawText.length);
  console.log('Root causes count:', diagnosis.rootCauses.length);
  console.log('Root cause #1:', diagnosis.rootCauses[0]?.cause);
  console.log('Troubleshooting steps count:', diagnosis.troubleshootingSteps.length);
  diagnosis.troubleshootingSteps.forEach((step, idx) => {
    console.log(`  Step ${idx + 1} [${step.riskLevel}]: ${step.title} -> ${step.action}`);
  });

  console.log('\n--- Step 3: Testing Live Llama 3 Verification Evaluation ---');
  const followUpText = `[nodemon] 3.0.1
[nodemon] starting node server.js
devdoctor-ai backend listening on http://localhost:3001
Health check available at http://localhost:3001/api/health`;

  const verification = await ModelRouter.verify(
    diagnosis,
    undefined,
    'Ran npm install express, restarted server',
    false,
    followUpText
  );

  console.log('Verification ID:', verification.id);
  console.log('Status:', verification.status);
  console.log('Status Label:', verification.statusLabel);
  console.log('Confidence:', verification.confidence);
  console.log('Comparison Summary:', verification.comparisonSummary);
  console.log('Observations:', verification.observations);
  console.log('\nSUCCESS: All live Llama 3 OCR text reasoning checks completed successfully!');
}

main().catch((err) => {
  console.error('Live inference error:', err);
  process.exit(1);
});
