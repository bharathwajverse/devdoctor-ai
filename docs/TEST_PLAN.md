# Test Plan & Quality Assurance Strategy — devdoctor-ai

## 1. Quality Assurance Objectives

The testing strategy for `devdoctor-ai` ensures that multimodal visual ingestion, schema parsing, API resilience, and troubleshooting guidance remain accurate, deterministic, and safe under all operating conditions.

---

## 2. Testing Pyramid & Matrix

```
       ▲
      / \     E2E / Workflow Tests (Frontend Upload -> Diagnosis -> Verification)
     /───\
    /     \   API Contract & Integration Tests (Supertest: /api/health, /analyze, /verify)
   /───────\
  /         \ Unit Tests (Payload validation, Base64 decoding, LLM JSON normalization)
 ─────────────
```

### 2.1 Verification Matrix

| Area | Test Identifier | Target Condition | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Validation** | `VAL-01` | Valid PNG / JPEG / WebP data URI | Successful decode, correct byte count | **PASS** |
| **Validation** | `VAL-02` | Normalization of `image/jpg` | Maps to standard `image/jpeg` | **PASS** |
| **Validation** | `VAL-03` | Rejection of non-raster MIME (`image/gif`, `application/pdf`) | HTTP 400 `INVALID_FILE_TYPE` | **PASS** |
| **Validation** | `VAL-04` | Rejection of payload $> 10$ MB | HTTP 413 `FILE_TOO_LARGE` | **PASS** |
| **Validation** | `VAL-05` | Trivially small payload ($< 10$ bytes) | HTTP 400 `INVALID_IMAGE_DATA` | **PASS** |
| **JSON Parser**| `PRS-01` | Clean model JSON without markdown | Direct parse to `DiagnosisResult` | **PASS** |
| **JSON Parser**| `PRS-02` | JSON wrapped in ` ```json ... ``` ` fences | Strip fences, parse inner JSON | **PASS** |
| **JSON Parser**| `PRS-03` | Conversational prefix/suffix surrounding JSON | Regex extraction of outermost braces | **PASS** |
| **JSON Parser**| `PRS-04` | Malformed non-JSON output | Fallback object with `uncertain: true` | **PASS** |
| **API** | `API-01` | `GET /api/health` | HTTP 200, reports service status & limits | **PASS** |
| **API** | `API-02` | `POST /api/analyze` in demo mode | HTTP 200, returns full `DiagnosisResult` | **PASS** |
| **API** | `API-03` | `POST /api/analyze` missing image | HTTP 400 `MISSING_IMAGE` | **PASS** |
| **API** | `API-04` | `POST /api/verify` with follow-up | HTTP 200, returns `VerificationResult` | **PASS** |
| **API** | `API-05` | `POST /api/verify` missing original analysis | HTTP 400 `MISSING_ORIGINAL_ANALYSIS` | **PASS** |
| **API** | `API-06` | Undefined route navigation | HTTP 404 `ROUTE_NOT_FOUND` | **PASS** |
| **API** | `API-07` | `POST /api/analyze` using extractedText directly | HTTP 200, returns full `DiagnosisResult` | **PASS** |
| **API** | `API-08` | `POST /api/verify` using extractedText directly | HTTP 200, returns `VerificationResult` | **PASS** |
| **API** | `API-09` | `POST /api/analyze` with whitespace-only extractedText | HTTP 400 `MISSING_IMAGE` | **PASS** |
| **API** | `API-10` | `POST /api/verify` with whitespace-only extractedText | HTTP 400 `MISSING_IMAGE` | **PASS** |
| **OCR** | `OCR-01` | Empty / null / whitespace image handling in OCR | Rejection with `success: false`, zero confidence | **PASS** |
| **OCR** | `OCR-02` | Corrupted image handling in OCR | Graceful error catch, no unhandled exception | **PASS** |
| **OCR** | `OCR-03` | In-browser OCR extraction with progress tracking | Returns text, confidence score, progress updates | **PASS** |
| **Live Model** | `LIV-01` | Live Ollama health & model discovery (`llama3:latest`) | Discovers `llama3:latest` on port 11434 | **PASS** |
| **Live Model** | `LIV-02` | Real Llama 3 stack trace diagnosis on OCR text | Generates root causes & safe shell commands | **PASS** |
| **Live Model** | `LIV-03` | Real Llama 3 follow-up resolution evaluation | Evaluates follow-up evidence -> `resolved` | **PASS** |
| **Error Codes**| `ERR-01` | RFC-7807 compliance across error payloads | Valid timestamp, error codes, HTTP statuses | **PASS** |
| **Prompts** | `PRM-01` | Diagnosis and verification prompt construction | Context interpolation, strict schema instructions | **PASS** |
| **Prompts** | `PRM-02` | Extracted OCR text embedding into prompt | Embeds OCR text into system prompt | **PASS** |
| **Demo Mode** | `DMO-01` | Deterministic demo diagnoses across contexts | Complete evidence, root causes, steps | **PASS** |
| **Demo Mode** | `DMO-02` | Follow-up verification outcome states | Valid status, observations, next steps | **PASS** |
| **Utilities** | `UTL-01` | Human-readable byte formatting & percentage clamping | Clamping bounds, formatted units | **PASS** |
| **Utilities** | `UTL-02` | Resilient clipboard copying with fallback | Primary clipboard API & execCommand fallback | **PASS** |
| **Logging** | `LOG-01` | Structured JSON log output | Formatted levels, context, stdout/stderr streams | **PASS** |
| **Build** | `BLD-01` | Production Vite build (`npm run build`) | Zero errors, bundle created in `dist/` | **PASS** |

---

## 3. Automated Test Execution

### 3.1 Running the Automated Test Suite
To run all unit and integration tests:

```bash
npm test
```

Current verification result:
```
 ✓ tests/formatters.test.ts  (3 tests)
 ✓ tests/logger.test.ts  (2 tests)
 ✓ tests/demoScenarios.test.ts  (4 tests)
 ✓ tests/clipboard.test.ts  (3 tests)
 ✓ tests/prompts.test.ts  (6 tests)
 ✓ tests/jsonParser.test.ts  (8 tests)
 ✓ tests/ocr.test.ts  (3 tests)
 ✓ tests/validation.test.ts  (8 tests)
 ✓ tests/modelRouter.test.ts  (4 tests)
 ✓ tests/errorCodes.test.ts  (7 tests)
 ✓ tests/api.test.ts  (14 tests)

 Test Files  11 passed (11)
      Tests  62 passed (62)
```

### 3.2 Running Continuous Watch Mode
```bash
npm run test:watch
```

### 3.3 Type Checking
```bash
npm run typecheck
```

### 3.4 Production Frontend Build
```bash
npm run build
```

---

## 4. Edge Cases & Manual Verification Scenarios

1. **Very High Resolution Screenshots (4K / Ultrawide)**:
   - Ensure image scaling handles large resolution without memory leak.
2. **Ambiguous / Incomplete Evidence**:
   - Model flags `uncertain: true` and prompts the user for extra context.
3. **Daemon Unreachability**:
   - When Ollama is stopped, application automatically presents fallback demo mode with honest watermarks.
4. **Closed-Loop Verification Statuses**:
   - Verify all four outcome states: `resolved`, `still_present`, `new_error`, and `inconclusive`.
