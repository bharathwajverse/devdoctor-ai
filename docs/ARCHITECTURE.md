# System Architecture — devdoctor-ai

## 1. System Overview

`devdoctor-ai` is built as a modular, lightweight, zero-database full-stack application designed for high-reproducibility and local or hybrid multimodal AI inference.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Developer Workstation                            │
│                                                                             │
│  ┌────────────────────────┐                   ┌──────────────────────────┐  │
│  │     React 18 SPA       │  REST API (JSON)  │     Express / Node.js    │  │
│  │ (Vite + Tailwind CSS)  │ ◄───────────────► │       API Server         │  │
│  │                        │                   │  (Strict Type Contract)  │  │
│  └────────────────────────┘                   └─────────────┬────────────┘  │
│             ▲                                               │               │
│             │ Clipboard / Drag & Drop                       │               │
│  ┌──────────┴─────────────┐                                 ▼               │
│  │   Screenshot Ingestion │                    ┌─────────────────────────┐  │
│  │ (Terminal / IDE / Web) │                    │ Multimodal Model Router │  │
│  └────────────────────────┘                    └────────────┬────────────┘  │
│                                                             │               │
└─────────────────────────────────────────────────────────────┼───────────────┘
                                                              │
                    ┌─────────────────────────────────────────┼────────────────────────┐
                    ▼                                         ▼                        ▼
       ┌────────────────────────┐               ┌────────────────────────┐  ┌──────────────────────┐
       │   Ollama Local Engine  │               │    Google AI Studio    │  │ Offline Sample Demo  │
       │  (paligemma:3b, llava) │               │   (gemini-1.5-flash)   │  │       Provider       │
       │  http://127.0.0.1:11434│               │     (Server Key)       │  │ (Fully Deterministic│
       └────────────────────────┘               └────────────────────────┘  └──────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Tier (`src/frontend/`)
- **Framework**: React 18, Vite 5, TypeScript 5.
- **Styling**: Tailwind CSS with dark-mode developer theme and accessible color contrast.
- **Key Modules**:
  - `UploadZone.tsx`: Handles file browsing, drag-and-drop, and global `Ctrl+V` clipboard event listening. Validates file size and image MIME types before network transfer.
  - `ContextSelector.tsx`: Allows developers to specify the execution environment (Terminal, Browser, IDE, Docker, CI/CD).
  - `DiagnosisCard.tsx`: Displays visible evidence (code blocks, file names, line numbers), ranked root causes with probability bars, and safety notices.
  - `TroubleshootingList.tsx`: Displays ordered steps with risk indicators (`Safe`, `Moderate`, `Risky`), rollback guidance, and one-click copy buttons for terminal commands.
  - `VerificationModal.tsx`: Secondary screenshot comparison workflow to evaluate whether the fix succeeded.
  - `HealthIndicator.tsx`: Real-time backend status badge showing active model, provider, and connection latency.

### 2.2 Backend Tier (`src/backend/`)
- **Runtime**: Node.js v20+ with Express 4.
- **Architecture**:
  - `server.ts`: Express application bootstrap, CORS configuration, JSON body parser with 15MB limit to support base64 screenshot payloads, error handling middleware.
  - `routes/analyze.ts`: Handles `POST /api/analyze`, performs schema validation, dispatches to the active AI service, formats response according to `DiagnosisResult`.
  - `routes/verify.ts`: Handles `POST /api/verify`, performs comparative analysis between initial diagnosis and verification screenshot.
  - `routes/health.ts`: Handles `GET /api/health`, probes Ollama daemon or Gemini API availability, and reports runtime capabilities.
  - `services/modelRouter.ts`: Factory selecting between Ollama service, Google service, and Demo provider based on configuration and server liveness.
  - `services/ollamaService.ts`: Communicates with Ollama's `/api/generate` or `/api/chat` using multimodal vision models (`paligemma:3b`, `llava:7b`).
  - `services/geminiService.ts`: Communicates with Google Generative AI API using server-side keys.
  - `services/demoService.ts`: Provides rich, realistic sample diagnostic data for offline evaluation, zero-dependency workshops, and automated regression testing.

### 2.3 Shared Tier (`src/shared/`)
- `types.ts`: Single source of truth containing all request/response interfaces, enums, error codes, and validation constraints.
- Prevents drift between backend responses, frontend UI rendering, and test assertions.

---

## 3. End-to-End Data & Request Flow

### 3.1 Initial Analysis Flow
```
User (Browser)               API Server (/api/analyze)              Multimodal AI Service
     │                                   │                                     │
     ├──── Post Screenshot (Base64) ────►│                                     │
     │     + Context + Notes             │                                     │
     │                                   ├──── Validate Size & MIME            │
     │                                   │     Check: size <= 10MB             │
     │                                   │     Check: image/png, jpeg, webp    │
     │                                   │                                     │
     │                                   ├──── Format Multimodal Prompt ──────►│
     │                                   │     Image buffer + Context rules    │
     │                                   │                                     │
     │                                   │◄─── Structured JSON Response ───────┤
     │                                   │     Evidence, Root Causes, Steps    │
     │                                   │                                     │
     │                                   ├──── Parse & Validate Response       │
     │                                   │     Sanitize commands & risk tags   │
     │                                   │                                     │
     │◄─── HTTP 200 DiagnosisResult ─────┤                                     │
     │                                   │                                     │
     ▼ Render Interactive Guidance       ▼ Zero Image Memory Buffer
```

### 3.2 Verification Flow
```
User (Browser)               API Server (/api/verify)               Multimodal AI Service
     │                                   │                                     │
     ├──── Post Follow-up Screenshot ───►│                                     │
     │     + Original Diagnosis ID       │                                     │
     │     + Notes                       ├──── Validate Image Payload          │
     │                                   │                                     │
     │                                   ├──── Comparative Prompt ────────────►│
     │                                   │     Original Error vs New State     │
     │                                   │                                     │
     │                                   │◄─── Status: resolved / present ─────┤
     │                                   │                                     │
     │◄─── HTTP 200 VerificationResult ──┤                                     │
     ▼ Update UI with Outcome Badge      ▼ Zero Memory Buffer
```

---

## 4. Error Handling & Resilience Matrix

| Failure Mode | Detection Point | Handling Strategy | User Experience |
| :--- | :--- | :--- | :--- |
| **Oversized Payload** | Express JSON / Base64 decode | Reject with HTTP 413 `FILE_TOO_LARGE` | Modal warning: "Image exceeds 10MB limit. Please crop or compress." |
| **Invalid MIME Type** | Server Validation Middleware | Reject with HTTP 400 `INVALID_FILE_TYPE` | Toast: "Unsupported format. Only PNG, JPEG, and WebP are allowed." |
| **Ollama Daemon Offline** | `ollamaService.ts` connection check | Degrade to Demo Provider or return HTTP 503 with exact instructions | Informative banner: "Local Ollama daemon unreachable. Showing deterministic demo analysis." |
| **Model Hallucination / Parse Failure** | Model Router JSON parser | Catch syntax error, run sanitization regex fallback, or retry | Returns structured fallback diagnosis with explicit `uncertain: true` flag. |
| **Ambiguous Visual Evidence** | Model Confidence Evaluation | Flag `uncertain: true`, confidence $< 0.5$ | Display warning badge: "Visual evidence is incomplete or blurry. Review carefully." |

---

## 5. Security & Isolation Model
1. **Stateless Execution**: Images are passed in memory as base64 buffers and garbage-collected immediately following the HTTP response. No files are written to disk.
2. **Client Key Isolation**: No API keys are bundled or transmitted to the browser.
3. **No Autonomous Execution**: Shell commands are rendered strictly as text with click-to-copy utility. No `child_process.exec` is ever called on AI-generated strings.
