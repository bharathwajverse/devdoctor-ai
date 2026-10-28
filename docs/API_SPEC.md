# API Specification — devdoctor-ai

Base URL: `http://localhost:3001` (Default)  
Protocol: HTTP / JSON  
Type Definition: [`src/shared/types.ts`](file:///g:/SNAPDEBEG/src/shared/types.ts)

---

## 1. Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, model readiness, uptime, and limits | None |
| `POST` | `/api/analyze` | Ingests error screenshot and returns diagnosis | None |
| `POST` | `/api/verify` | Ingests follow-up screenshot and assesses resolution | None |

---

## 2. Detailed Endpoint Contracts

### 2.1 GET `/api/health`

Returns the operational status of the devdoctor-ai backend, active multimodal model configuration, and resource limits.

#### Request
No parameters or headers required.

#### Response (HTTP 200 OK)
```json
{
  "status": "ok",
  "service": "devdoctor-ai",
  "version": "1.0.0",
  "timestamp": "2026-10-28T07:15:00.000Z",
  "uptimeSeconds": 142.5,
  "modelProvider": "ollama",
  "modelIdentifier": "paligemma:3b",
  "ollama": {
    "configuredUrl": "http://127.0.0.1:11434",
    "connected": true,
    "availableModels": ["paligemma:3b", "llava:7b"]
  },
  "google": {
    "configured": false,
    "model": "gemini-1.5-flash"
  },
  "demoFallbackEnabled": true,
  "limits": {
    "maxImageSizeMb": 10,
    "allowedMimeTypes": ["image/png", "image/jpeg", "image/webp"]
  }
}
```

---

### 2.2 POST `/api/analyze`

Analyzes an error screenshot using the configured multimodal AI model or demo fallback.

#### Request Headers
- `Content-Type: application/json`

#### Request Body
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "context": "terminal",
  "description": "Crashed immediately after executing npm run dev",
  "demoMode": false
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `image` | `string` | **Yes** | Base64 data URL (`data:image/png;base64,...`) or raw base64 string. Max size 10MB decoded. |
| `context` | `string` | No | One of: `"terminal"`, `"browser"`, `"ide"`, `"docker"`, `"cicd"`, `"system"`, `"other"`. Default: `"terminal"`. |
| `description` | `string` | No | User-supplied context or reproduction steps (max 1000 characters). |
| `demoMode` | `boolean`| No | Explicitly triggers sample diagnostic pipeline without hitting model inference. |

#### Response (HTTP 200 OK)
```json
{
  "id": "diag-9f8a2b1c",
  "timestamp": "2026-10-28T07:15:05.120Z",
  "context": "terminal",
  "modelUsed": "paligemma:3b",
  "provider": "ollama",
  "isDemo": false,
  "headline": "ModuleNotFoundError: Cannot find module 'express'",
  "summary": "The Node.js runtime failed to locate the 'express' package in local node_modules or global search paths.",
  "confidenceScore": 0.94,
  "evidence": {
    "rawText": "Error: Cannot find module 'express'\nRequire stack:\n- /app/server.js",
    "errorType": "ModuleNotFoundError",
    "errorCode": "MODULE_NOT_FOUND",
    "filePath": "/app/server.js",
    "lineNumber": 1,
    "suspectComponent": "npm dependency resolution",
    "uncertain": false
  },
  "rootCauses": [
    {
      "cause": "Package not installed in current workspace",
      "probability": 0.85,
      "explanation": "The package.json may list express, but node_modules was deleted or npm install was not run."
    },
    {
      "cause": "Typo in require/import statement",
      "probability": 0.15,
      "explanation": "File may contain require('express ') with extra space or wrong casing."
    }
  ],
  "troubleshootingSteps": [
    {
      "stepNumber": 1,
      "title": "Install Missing Express Dependency",
      "explanation": "Install express directly into your workspace dependencies to populate node_modules.",
      "action": "npm install express",
      "riskLevel": "safe"
    },
    {
      "stepNumber": 2,
      "title": "Reinstall Clean Dependencies",
      "explanation": "If node_modules is corrupted, perform a clean reinstall.",
      "action": "rm -rf node_modules package-lock.json && npm install",
      "riskLevel": "moderate",
      "rollbackAdvice": "Keep package.json intact; only lockfile and cache will be recreated."
    }
  ],
  "safetyNotice": "Review commands before execution. Never run unknown terminal commands as root/admin."
}
```

---

### 2.3 POST `/api/verify`

Evaluates a second screenshot to determine whether the troubleshooting action resolved the problem.

#### Request Body
```json
{
  "originalAnalysis": { /* Full DiagnosisResult object from /api/analyze */ },
  "verificationImage": "data:image/png;base64,iVBORw0KGgo...",
  "notes": "Ran npm install express, now showing server started on port 3000",
  "demoMode": false
}
```

#### Response (HTTP 200 OK)
```json
{
  "id": "veri-7e1d4a9f",
  "originalAnalysisId": "diag-9f8a2b1c",
  "timestamp": "2026-10-28T07:16:10.450Z",
  "status": "resolved",
  "statusLabel": "Problem Resolved",
  "confidence": 0.96,
  "observations": [
    "Terminal output shows 'Server running on port 3000'",
    "The previous MODULE_NOT_FOUND stack trace is absent",
    "Exit code is 0 / process is actively listening"
  ],
  "comparisonSummary": "The follow-up screenshot confirms that the missing module error was resolved and the service started successfully.",
  "nextSteps": [
    {
      "stepNumber": 1,
      "title": "Verify HTTP Response",
      "explanation": "Confirm the server responds to web traffic on localhost.",
      "action": "curl http://localhost:3000/api/health",
      "riskLevel": "safe"
    }
  ],
  "isDemo": false,
  "modelUsed": "paligemma:3b",
  "provider": "ollama"
}
```

---

## 3. Error Codes & HTTP Status Mapping

All errors conform to RFC-7807 structured JSON format:

```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable explanation",
    "details": {},
    "timestamp": "2026-10-28T07:15:00.000Z"
  }
}
```

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `MISSING_IMAGE` | Request body missing `image` or `verificationImage` |
| `400 Bad Request` | `INVALID_FILE_TYPE` | Uploaded image is not PNG, JPEG, or WebP |
| `400 Bad Request` | `MALFORMED_PAYLOAD` | Invalid JSON or missing required fields |
| `413 Payload Too Large` | `FILE_TOO_LARGE` | Base64 decoded image exceeds 10MB limit |
| `502 Bad Gateway` | `MODEL_INFERENCE_FAILED` | Upstream model daemon returned non-200 or invalid JSON |
| `503 Service Unavailable`| `MODEL_UNAVAILABLE` | Ollama daemon offline and demo fallback disabled |
| `500 Internal Error` | `INTERNAL_SERVER_ERROR`| Uncaught server-side processing exception |
