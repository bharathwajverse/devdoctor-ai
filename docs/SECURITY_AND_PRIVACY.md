# Security & Privacy Specification — devdoctor-ai

## 1. Overview & Threat Model

`devdoctor-ai` is built specifically for developer workflows where sensitive system information, internal directory paths, stack traces, and software architecture might appear in screenshots. Security and user privacy are foundational architectural constraints, not post-hoc additions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Security Perimeter                              │
│                                                                             │
│  [Developer Workstation]                                                    │
│         │                                                                   │
│         ▼ (Encrypted Local Loopback HTTP)                                   │
│  ┌────────────────────────────────────────┐                                 │
│  │ Express API (:3001)                    │                                 │
│  │  ├── 1. Size & MIME Validation (<10MB) │                                 │
│  │  ├── 2. Transient Memory Buffers       │ ◄── Zero Disk Retention         │
│  │  └── 3. Strict RFC-7807 Error Guard    │                                 │
│  └──────────────────┬─────────────────────┘                                 │
│                     │                                                       │
│                     ▼ (Local IPC / HTTP)                                    │
│  ┌────────────────────────────────────────┐                                 │
│  │ Local Ollama Service (:11434)          │                                 │
│  │  └── llama3 (Open-Weight) + Local OCR  │ ◄── Zero Cloud Egress           │
│  └────────────────────────────────────────┘                                 │
│                                                                             │
│  * Commands are strictly recommended — NEVER executed autonomously.         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion & File Security

### 2.1 File Type & Magic Byte Validation
- Ingestion accepts only standard web raster formats: `image/png`, `image/jpeg`, and `image/webp`.
- Non-image MIME types (such as `application/pdf`, `image/svg+xml` containing executable scripts, or binary executables) are rejected at the middleware level with `HTTP 400 INVALID_FILE_TYPE`.

### 2.2 Payload Size Constraints
- Maximum decoded image payload size is strictly capped at **10 MB** (`MAX_IMAGE_SIZE_MB=10`).
- Oversized payloads trigger `HTTP 413 FILE_TOO_LARGE` before passing to inference, protecting against memory exhaustion attacks or Denial of Service (DoS).
- Trivially small payloads ($<10$ bytes) are rejected with `HTTP 400 INVALID_IMAGE_DATA`.

---

## 3. Data Retention & Privacy

### 3.1 Zero Server Disk Storage
- Uploaded screenshots are held as transient `Buffer` objects in memory only during the active HTTP request.
- Images are **never written to disk**, never cached in file systems, and never stored in a database.
- Upon completion or failure of the `/api/analyze` or `/api/verify` request, memory references are unreferenced for immediate Node.js V8 garbage collection.

### 3.2 Redaction & Secret Warnings
- Developers are explicitly instructed via in-app banners and the Privacy Protocol modal never to upload screenshots containing:
  - Plain-text passwords or secret keys.
  - Cloud provider credentials (e.g. AWS access keys, GitHub personal access tokens).
  - Database connection strings or authentication URIs.
  - Personally Identifiable Information (PII) or confidential intellectual property.

---

## 4. Local-First AI & Zero Third-Party Egress

- **Default Inference Route**: When running the default `ollama` provider with the open-weight `llama3` model and client-side Tesseract.js OCR, 100% of the screenshot data and reasoning tokens remain strictly on the user's host machine (`http://localhost:11434`).
- No external telemetries, cloud logging, or training data feedback loops exist in the default configuration.
- If optional cloud providers (Google AI Studio) are explicitly configured, credentials (`GEMINI_API_KEY`) are kept exclusively on the server backend and never transmitted to the browser client.

---

## 5. Defense Against Autonomous Execution Risks

- **Non-Autonomous Principle**: `devdoctor-ai` strictly acts as an advisor. It will **never invoke shell commands automatically** or modify file contents without user initiation.
- **Risk Classification**: Every proposed troubleshooting action is tagged with an explicit risk badge:
  - `Safe`: Read-only queries, non-destructive package installations (`npm install`, `curl`).
  - `Moderate`: Local dependency reinstalls, daemon restarts, cache purging.
  - `Risky`: Irreversible file deletions (`rm -rf`), Git branch resets, administrative permission changes.
- **Rollback Guidance**: Where destructive actions are suggested, clear rollback instructions are provided.

---

## 6. Output Sanitization & Prompt Injection Resilience

- Multimodal LLM outputs are treated as untrusted user input.
- Responses pass through a multi-stage parser that extracts JSON and validates required fields against TypeScript interfaces (`DiagnosisResult`, `VerificationResult`).
- Scripts and unescaped HTML characters in extracted error strings are rendered safely via React's standard JSX text escaping to prevent Cross-Site Scripting (XSS).
- Model outputs are constrained using temperature controls ($0.2$) and structural JSON schemas.
