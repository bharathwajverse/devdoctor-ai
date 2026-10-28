# Test Plan & Verification Strategy — devdoctor-ai

## 1. Overview & Objectives

The testing suite for `devdoctor-ai` validates API contract integrity, client-side safety guardrails, image validation logic, model parsing resilience, and the follow-up screenshot verification workflow.

Automated tests are implemented using **Vitest** and **Supertest** running against the live Express backend and shared schemas.

---

## 2. Test Matrix & Verification Coverage

| Test ID | Test Category | Target Component | Description | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Health Check | `GET /api/health` | Validate server status and capability reporting | HTTP 200 with `status: ok` and provider metadata |
| **TC-02** | Happy Path | `POST /api/analyze` | Submit valid PNG screenshot under 10MB | HTTP 200 with structured `DiagnosisResult` containing evidence & steps |
| **TC-03** | File Validation | `POST /api/analyze` | Submit non-image payload (e.g. text/pdf) | HTTP 400 with `INVALID_FILE_TYPE` error |
| **TC-04** | Payload Limit | `POST /api/analyze` | Submit simulated oversized payload (>10MB) | HTTP 413 with `FILE_TOO_LARGE` error |
| **TC-05** | Missing Input | `POST /api/analyze` | Submit empty payload without image field | HTTP 400 with `MISSING_IMAGE` error |
| **TC-06** | Verification | `POST /api/verify` | Submit valid follow-up screenshot & original diagnosis | HTTP 200 with `VerificationResult` containing valid `status` |
| **TC-07** | Verification Validation | `POST /api/verify` | Submit verification request without image | HTTP 400 with `MISSING_IMAGE` error |
| **TC-08** | Response Parsing | `modelRouter.ts` | Test parsing of markdown-wrapped JSON (` ```json `) | Successfully extracted JSON object matching schema |
| **TC-09** | Malformed Model Output| `modelRouter.ts` | Test model returning raw non-JSON text | Resilient fallback diagnosis with `uncertain: true` |
| **TC-10** | Uncertainty Flag | `modelRouter.ts` | Test low-confidence or blurry image input | Explicit `uncertain: true` flag in `evidence` |
| **TC-11** | Build Verification | `npm run build` | Verify frontend bundling and TypeScript compile | Clean exit 0 with static `dist/` directory generated |

---

## 3. Execution Commands

### Run Full Test Suite
```bash
npm run test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run TypeScript Verification
```bash
npm run typecheck
```

### Run Production Build
```bash
npm run build
```

---

## 4. Manual Testing Scenarios (Browser Verification)

1. **Clipboard Paste (`Ctrl+V`)**: Take a screenshot of a terminal error using Snipping Tool, press `Ctrl+V` on the page, verify instant thumbnail preview.
2. **Context Switching**: Toggle between Terminal, IDE, and Browser Console; verify context propagates to the request payload.
3. **Copy Command Utility**: Click "Copy Command" button on troubleshooting cards; verify clipboard receives clean shell string without markdown backticks.
4. **Verification Loop**: Click "Verify Resolution" after completing diagnosis, upload clean terminal screenshot, verify status badge transitions to `Problem Resolved`.
