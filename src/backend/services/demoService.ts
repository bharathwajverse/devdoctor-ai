import {
  DiagnosisResult,
  VerificationResult,
  EnvironmentContext,
} from '../../shared/types.js';

export const DEMO_WATERMARK = '[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]';

interface DemoScenario {
  headline: string;
  summary: string;
  confidenceScore: number;
  evidence: {
    rawText: string;
    errorType: string;
    errorCode?: string;
    filePath?: string;
    lineNumber?: number;
    suspectComponent?: string;
    uncertain: boolean;
  };
  rootCauses: Array<{
    cause: string;
    probability: number;
    explanation: string;
  }>;
  troubleshootingSteps: Array<{
    stepNumber: number;
    title: string;
    explanation: string;
    action: string;
    riskLevel: 'safe' | 'moderate' | 'risky';
    rollbackAdvice?: string;
  }>;
}

const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  terminal: {
    headline: "Error: Cannot find module 'express'",
    summary:
      "The Node.js runtime failed to resolve the 'express' module during script execution. Either the package is missing from node_modules or dependencies have not been installed in this workspace.",
    confidenceScore: 0.96,
    evidence: {
      rawText:
        "node:internal/modules/cjs/loader:1080\n  throw err;\n  ^\n\nError: Cannot find module 'express'\nRequire stack:\n- g:/devdoctor-ai/src/backend/server.js",
      errorType: 'MODULE_NOT_FOUND',
      errorCode: 'ERR_MODULE_NOT_FOUND',
      filePath: 'src/backend/server.js',
      lineNumber: 1,
      suspectComponent: 'Node.js CommonJS module resolver',
      uncertain: false,
    },
    rootCauses: [
      {
        cause: "Missing 'express' in node_modules directory",
        probability: 0.85,
        explanation:
          "The package is declared in package.json or required in code, but npm install has not been executed in the active workspace.",
      },
      {
        cause: 'Command executed from the wrong parent directory',
        probability: 0.12,
        explanation:
          "The current terminal directory is outside the project root containing the node_modules folder.",
      },
      {
        cause: 'Corrupted npm cache or broken symlink',
        probability: 0.03,
        explanation: 'A previous aborted installation left a partial node_modules tree.',
      },
    ],
    troubleshootingSteps: [
      {
        stepNumber: 1,
        title: 'Install Express in the Current Project',
        explanation:
          'Adds express to package.json dependencies and downloads files to node_modules.',
        action: 'npm install express',
        riskLevel: 'safe',
      },
      {
        stepNumber: 2,
        title: 'Verify Directory and Clean Install',
        explanation:
          'Ensure you are in the project root containing package.json, then run a clean install.',
        action: 'npm ci',
        riskLevel: 'safe',
        rollbackAdvice: 'Requires an existing package-lock.json file.',
      },
      {
        stepNumber: 3,
        title: 'Reset Dependencies Cache (If corrupted)',
        explanation:
          'Removes the local node_modules directory and reinstalls all dependencies from scratch.',
        action: 'rm -rf node_modules package-lock.json && npm install',
        riskLevel: 'moderate',
        rollbackAdvice: 'Ensure package.json is committed to Git beforehand.',
      },
    ],
  },
  browser: {
    headline: 'TypeError: Cannot read properties of undefined (reading \'map\')',
    summary:
      'A React component attempted to call Array.prototype.map() on a state variable or prop that evaluates to undefined before asynchronous data loading completed.',
    confidenceScore: 0.94,
    evidence: {
      rawText:
        'Uncaught TypeError: Cannot read properties of undefined (reading \'map\')\n    at UserList (UserList.tsx:24:18)\n    at renderWithHooks (react-dom.development.js:16305)',
      errorType: 'TypeError',
      errorCode: 'REACT_UNCAUGHT_TYPE_ERROR',
      filePath: 'src/components/UserList.tsx',
      lineNumber: 24,
      suspectComponent: 'UserList (React Component)',
      uncertain: false,
    },
    rootCauses: [
      {
        cause: 'Uninitialized state before asynchronous API fetch',
        probability: 0.78,
        explanation:
          'The items state was initialized with undefined instead of an empty array [] while waiting for useEffect.',
      },
      {
        cause: 'API response structure mismatch',
        probability: 0.18,
        explanation:
          'The backend endpoint returned an object wrapper (e.g. { data: [...] }) rather than a top-level array.',
      },
      {
        cause: 'Null return on error or empty collection',
        probability: 0.04,
        explanation: 'Backend returned null or HTTP 500 without fallback default data.',
      },
    ],
    troubleshootingSteps: [
      {
        stepNumber: 1,
        title: 'Provide a Safe Default Initial State',
        explanation:
          'Initialize the useState hook with an empty array [] so the initial render does not throw.',
        action: 'const [items, setItems] = useState<Item[]>([]);',
        riskLevel: 'safe',
      },
      {
        stepNumber: 2,
        title: 'Use Optional Chaining and Nullish Fallback',
        explanation: 'Safely guard the .map call against undefined or null arrays.',
        action: '{(items ?? []).map((item) => <ItemCard key={item.id} item={item} />)}',
        riskLevel: 'safe',
      },
    ],
  },
  docker: {
    headline: 'Error response from daemon: Ports are not available: listen tcp 0.0.0.0:5432: bind: address already in use',
    summary:
      'Docker failed to bind host port 5432 because another local process (typically a native PostgreSQL instance) is already listening on that port.',
    confidenceScore: 0.97,
    evidence: {
      rawText:
        'docker: Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:5432 -> 0.0.0.0:0: listen tcp 0.0.0.0:5432: bind: address already in use.',
      errorType: 'PortBindingCollision',
      errorCode: 'EADDRINUSE',
      suspectComponent: 'Docker Container Port Forwarding',
      uncertain: false,
    },
    rootCauses: [
      {
        cause: 'Host PostgreSQL daemon already running natively on port 5432',
        probability: 0.88,
        explanation: 'A background service installed via brew or apt is holding port 5432.',
      },
      {
        cause: 'Orphaned Docker container occupying the port',
        probability: 0.12,
        explanation: 'A previously running container was stopped without releasing port mappings.',
      },
    ],
    troubleshootingSteps: [
      {
        stepNumber: 1,
        title: 'Map Container to an Alternative Host Port',
        explanation: 'Change the host-side port binding from 5432 to 5433 to avoid collision.',
        action: 'docker run -p 5433:5432 postgres',
        riskLevel: 'safe',
      },
      {
        stepNumber: 2,
        title: 'Find and Terminate Process on Port 5432',
        explanation: 'Locate the PID holding port 5432.',
        action: 'netstat -ano | findstr :5432 # or lsof -i :5432 on Mac/Linux',
        riskLevel: 'moderate',
        rollbackAdvice: 'Make sure not to terminate production database daemons.',
      },
    ],
  },
};

export class DemoService {
  /**
   * Generates a rich deterministic diagnosis result clearly labeled as demo data.
   */
  static getDiagnosis(context: EnvironmentContext = 'terminal', userNotes?: string): DiagnosisResult {
    const scenario = DEMO_SCENARIOS[context] || DEMO_SCENARIOS.terminal;

    return {
      id: `demo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      context,
      modelUsed: 'demo-deterministic-engine',
      provider: 'demo',
      isDemo: true,
      demoWatermark: DEMO_WATERMARK,
      headline: scenario.headline,
      summary: `${DEMO_WATERMARK} ${scenario.summary}`,
      confidenceScore: scenario.confidenceScore,
      evidence: scenario.evidence,
      rootCauses: scenario.rootCauses,
      troubleshootingSteps: scenario.troubleshootingSteps,
      safetyNotice:
        'This is sample demonstration data. Never execute untrusted terminal commands without understanding them.',
      userNotes,
    };
  }

  /**
   * Generates a rich deterministic verification result clearly labeled as demo data.
   */
  static getVerification(originalAnalysis: DiagnosisResult, notes?: string): VerificationResult {
    const isResolvedNotes = (notes || '').toLowerCase().includes('fixed') ||
      (notes || '').toLowerCase().includes('success') ||
      (notes || '').toLowerCase().includes('installed') ||
      (notes || '').toLowerCase().includes('ran');

    const status = isResolvedNotes ? 'resolved' : 'resolved';

    return {
      id: `veri-demo-${Date.now().toString(36)}`,
      originalAnalysisId: originalAnalysis.id,
      timestamp: new Date().toISOString(),
      status,
      statusLabel: 'Problem Resolved (Demo Evaluation)',
      confidence: 0.95,
      observations: [
        'Terminal prompt returned with status code 0',
        `Original error (${originalAnalysis.evidence?.errorType || 'Runtime Error'}) is no longer present in visual buffer`,
        'Process started cleanly and is listening for incoming requests',
      ],
      comparisonSummary: `${DEMO_WATERMARK} Comparative visual analysis demonstrates that the error condition observed in the primary screenshot is resolved in the follow-up view.`,
      nextSteps: [
        {
          stepNumber: 1,
          title: 'Verify Application Functionality',
          explanation: 'Execute end-to-end tests to confirm no secondary regressions.',
          action: 'npm test',
          riskLevel: 'safe',
        },
      ],
      isDemo: true,
      modelUsed: 'demo-deterministic-engine',
      provider: 'demo',
    };
  }
}
