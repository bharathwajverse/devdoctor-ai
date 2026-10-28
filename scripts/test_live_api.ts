import { dispatchRequest } from '../tests/mockServer.js';

async function testApi() {
  console.log('Testing GET /api/health...');
  const healthRes = await dispatchRequest('GET', '/api/health');
  console.log('Health status:', healthRes.status);
  console.log('Health body:', healthRes.body);

  console.log('\nTesting POST /api/analyze with live Ollama & extractedText...');
  const analyzeRes = await dispatchRequest('POST', '/api/analyze', {
    extractedText: "Error: Cannot find module 'dotenv'\nRequire stack:\n- /app/src/backend/server.js:1",
    context: 'terminal',
    description: 'Fresh clone',
    demoMode: false,
  });

  console.log('Analyze status:', analyzeRes.status);
  console.log('Analyze headline:', analyzeRes.body.headline);
  console.log('Model used:', analyzeRes.body.modelUsed);
  console.log('Is demo:', analyzeRes.body.isDemo);
  console.log('Step 1 action:', analyzeRes.body.troubleshootingSteps?.[0]?.action);

  console.log('\nTesting POST /api/verify with live Ollama & follow-up text...');
  const verifyRes = await dispatchRequest('POST', '/api/verify', {
    originalAnalysis: analyzeRes.body,
    extractedText: 'Server listening on port 3001. All dependencies resolved successfully.',
    notes: 'Ran npm install dotenv',
    demoMode: false,
  });

  console.log('Verify status:', verifyRes.status);
  console.log('Verify result status:', verifyRes.body.status);
  console.log('Verify result statusLabel:', verifyRes.body.statusLabel);
  console.log('Comparison summary:', verifyRes.body.comparisonSummary);
}

testApi().catch((err) => {
  console.error('API test failed:', err);
  process.exit(1);
});
