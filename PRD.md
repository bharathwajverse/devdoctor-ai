# Product Requirements Document (PRD) — devdoctor-ai

**Project Name**: devdoctor-ai  
**Repository**: [https://github.com/bharathwajverse/devdoctor-ai](https://github.com/bharathwajverse/devdoctor-ai)  
**Version**: 1.0.0 (MVP)  
**Status**: Implemented & Verified  
**Primary Track**: MLH Best Open-Source AI Project / Multimodal Developer Tooling  

---

## 1. Problem Statement & Target Users

### 1.1 Problem Statement
Modern software engineering produces cryptic, context-sparse stack traces, terminal crashes, compiler failures, and console exceptions. Beginner developers, students, boot camp learners, and engineers encountering foreign technology stacks waste hours copying error snippets into search engines, navigating out-of-date forum threads, or pasting sensitive logs into public chat bots without knowing what commands are safe to run.

Current text-only LLMs require manual transcription of error details (file paths, line numbers, error codes), losing visual layout context (e.g., ANSI terminal colors, highlighted tokens, browser network tabs, IDE diagnostic panels). Furthermore, existing debugging tools often suggest irreversible or destructive commands (e.g., `rm -rf`, `git reset --hard`, `chmod 777`) without safety ratings or follow-up verification.

### 1.2 Target Users
1. **Computer Science Students & Bootcamp Learners**: Need plain-English explanations of compiler/runtime errors without technical jargon overload.
2. **Early-Career & Full-Stack Developers**: Need rapid identification of root causes across mixed stacks (Node.js, Docker, Python, React, Vite) without trial-and-error thrashing.
3. **Open-Source Contributors**: Need local, privacy-first diagnostic tooling that does not leak private repositories, keys, or internal enterprise data to third-party proprietary clouds.

---

## 2. Proposed Solution & Value Proposition

`devdoctor-ai` is an open-weight AI debugging assistant combining client-side local OCR with the open-weight Llama 3 foundation model. It allows developers to drag and drop or paste a screenshot of their error (terminal, browser console, IDE, or system modal), automatically extracts visible error text in the browser via Tesseract.js (ensuring zero cloud image egress), performs deep root cause deduction and structured troubleshooting step generation using local Llama 3 (`llama3:latest` via Ollama), and provides an optional **second-screenshot verification loop** to confirm if the fix worked.

### Core Differentiator: Closed-Loop Verification
Unlike one-shot AI chatbots that output unverified code and leave the user stranded, devdoctor-ai implements:
$$\text{Screenshot} \longrightarrow \text{Local OCR (Tesseract.js)} \longrightarrow \text{Llama 3 Reasoning} \longrightarrow \text{Prioritized Safe Fix} \longrightarrow \text{Follow-up OCR} \longrightarrow \text{Verification}$$

---

## 3. Core User Journeys & Functional Requirements

### User Journey 1: Initial Error Diagnosis
1. User navigates to the devdoctor-ai web interface.
2. User pastes (`Ctrl+V`), drops, or selects an error screenshot.
3. User selects the execution environment (`Terminal / CLI`, `Web Browser Console`, `IDE / Editor`, `Docker / Container`, `CI/CD Pipeline`, `Operating System`).
4. (Optional) User adds context or notes (e.g., "Happened after running npm update").
5. System validates the image (size $<10$ MB, valid MIME type).
6. System invokes the multimodal AI model, parsing:
   - Visible Evidence: Extracted error text, stack trace, affected file, line number.
   - Likely Causes: Ranked root causes with estimated probabilities.
   - Actionable Guidance: Numbered troubleshooting steps with risk levels (`Safe`, `Moderate`, `Risky`) and copyable commands.
   - Safety Notice: Warning against destructive actions and secret uploads.

### User Journey 2: Follow-up Verification
1. After executing the recommended troubleshooting steps, the user takes a second screenshot of their current screen.
2. User submits the follow-up screenshot in the Verification drawer.
3. devdoctor-ai compares the initial diagnosis and the new visual state.
4. System categorizes the outcome into one of four verified statuses:
   - `RESOLVED`: The previous error is gone, clean exit code, success output.
   - `STILL_PRESENT`: The identical error is still visible.
   - `NEW_ERROR`: The initial error cleared, but an downstream error surfaced.
   - `INCONCLUSIVE`: Screenshot does not show relevant state or evidence is ambiguous.
5. System recommends concrete next steps based on the verified status.

### User Journey 3: Offline / Demo Mode Experience
1. If the user does not have a local Ollama daemon running or a cloud API key configured, the system gracefully operates in Demo Mode.
2. Pre-seeded realistic software error scenarios (e.g., Node.js `ERR_MODULE_NOT_FOUND`, React Hydration Error, Docker Port Conflict) allow full inspection of the UI, diagnosis flow, and verification loop.
3. Every sample result is watermarked `[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]` to guarantee absolute ethical transparency.

---

## 4. Non-Functional Requirements

| Category | Requirement | Specification |
| :--- | :--- | :--- |
| **Performance** | Upload Processing | Image payload ingestion & validation in $<150$ ms |
| **Performance** | Model Latency | Ollama local inference $< 15$ s; Cloud API $< 4$ s |
| **Security** | Zero Retention | Uploaded images are held in memory only during inference and zeroed immediately after parsing |
| **Security** | Secret Protection | Client-side and server-side warnings; API keys strictly confined to backend `.env` |
| **Reliability** | Graceful Degradation | Automated fallback to structured error response or Demo Mode when model daemon is unreachable |
| **Usability** | Safe Copying | One-click copy buttons for shell commands; commands never execute autonomously |
| **Compatibility** | Cross-Platform | Operates seamlessly on Windows, macOS, and Linux |

---

## 5. MVP Scope & Explicit Non-Goals

### In Scope (MVP)
- Image ingestion via drag-and-drop, file picker, and system clipboard paste (`Ctrl+V`).
- Client-side private OCR via Tesseract.js in Web Worker with real-time progress and editable text preview.
- Client-side and server-side image & payload validation (size $\le 10$ MB, MIME types `image/png`, `image/jpeg`, `image/webp`).
- AI reasoning diagnosis pipeline supporting:
  - Local open-weight language model (Ollama: `llama3:latest` text reasoning on extracted OCR evidence).
  - Google Gemini API (`gemini-1.5-flash`).
  - Deterministic Sample Demo Provider.
- Structured response rendering: Evidence cards, Root Cause probability bars, Step-by-step instructions with risk badges.
- Follow-up screenshot verification with 4-state outcome classification (`resolved`, `still_present`, `new_error`, `inconclusive`).
- Health inspection endpoint (`GET /api/health`).
- End-to-end automated test suite with Vitest and Supertest (62 passing automated tests + live inference verification).

### Explicit Non-Goals (Out of Scope for MVP)
- **Automatic Command Execution**: Under no circumstances will devdoctor-ai automatically invoke terminal commands on the user's host machine.
- **User Authentication / DB Persistence**: No user accounts, passwords, or databases (PostgreSQL/MongoDB) in MVP to avoid unnecessary complexity and privacy footprint.
- **Payment Processing**: Fully open-source and free to run.
- **Arbitrary Video / Screen Recording**: Screen recordings and multi-minute video streams are out of scope; single and dual static screenshots only.

---

## 6. Acceptance Criteria

1. **AC-1 (Image Ingestion & OCR)**: Submitting a valid PNG/JPEG/WebP under 10MB extracts visible text client-side via Tesseract.js and returns HTTP 200 with complete `DiagnosisResult`. Submitting a file $>10$ MB or non-image returns HTTP 400 with `INVALID_FILE_TYPE` or `FILE_TOO_LARGE`.
2. **AC-2 (Evidence Extraction)**: The diagnosis response contains extracted raw text, error type, affected file/line (if visible), and an explicit `uncertain` boolean flag when evidence is ambiguous.
3. **AC-3 (Safety Categorization)**: Every troubleshooting step is labeled with an explicit `riskLevel` (`safe`, `moderate`, `risky`) and rollback advice if destructive.
4. **AC-4 (Verification Loop)**: Submitting a valid second screenshot alongside an existing diagnosis produces a `VerificationResult` containing one of `resolved`, `still_present`, `new_error`, or `inconclusive`.
5. **AC-5 (Transparency)**: Simulated responses are never presented as live model output; they must display the demo banner.

---

## 7. Success Metrics

- **Diagnosis Time Reduction**: Reduces time to identify root causes from an average of $>15$ minutes of web searching to $<30$ seconds.
- **Command Safety**: $0$ accidental destructive command executions through explicit risk badges and user confirmation.
- **Verification Accuracy**: $>85\%$ agreement on error status (resolved vs. still present) in controlled benchmark test suites.

---

## 8. Technical Constraints, Assumptions & Risks

- **Constraint**: The standard `llama3:latest` model in Ollama is text-only. Screenshot text is extracted locally in-browser with Tesseract.js OCR, and Llama 3 reasons over the extracted text, stack traces, and context.
- **Resource Footprint**: Running `llama3:latest` (4.7 GB) requires approximately 6GB-8GB of available RAM/VRAM.
- **Assumption**: Users have modern Chromium/Firefox browsers supporting Web Workers, Canvas, and HTML5 Clipboard APIs.
- **Risk**: Low-resolution screenshots or unusual terminal color schemes might reduce OCR accuracy. Mitigated by editable extracted-text preview and manual override input before model submission.
