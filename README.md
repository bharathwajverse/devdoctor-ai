# devdoctor-ai

<div align="center">

**Understand errors. Find the cause. Fix with confidence.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Tests: Vitest](https://img.shields.io/badge/Tests-59%20Passing-brightgreen.svg)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](tsconfig.json)
[![React](https://img.shields.io/badge/React-18.2-cyan)](src/frontend/)
[![Vite](https://img.shields.io/badge/Vite-5.1-purple)](vite.config.ts)
[![Ollama: Llama 3](https://img.shields.io/badge/Ollama-Llama%203-orange)](https://ollama.com)
[![OCR: Tesseract.js](https://img.shields.io/badge/OCR-Tesseract.js%20(Local)-emerald)](https://github.com/naptha/tesseract.js)

*An open-weight AI debugging assistant that transforms software error screenshots into structured root-cause analyses, safe step-by-step remediation plans, and closed-loop follow-up verification using client-side Tesseract.js OCR and local Llama 3.*

</div>

---

## 1. Problem & Solution

### The Challenge
Developers waste hours staring at cryptic terminal crashes, browser console stack traces, and IDE syntax warnings. Text-only LLMs require laboriously copying stack traces, losing critical visual layout context. Worse, existing chatbots often propose dangerous or irreversible terminal commands (e.g., `rm -rf`, `git reset --hard`) without risk ratings or follow-up verification to confirm whether the fix worked.

### The devdoctor-ai Solution
**devdoctor-ai** enables developers to drag and drop or paste (`Ctrl+V`) a screenshot of their error. Running local in-browser OCR coupled with Meta Llama 3 (`llama3:latest` locally via Ollama), it:
1. **Extracts Visual Evidence Locally**: Tesseract.js reads error messages, file paths, line numbers, and error codes directly in the browser with zero cloud image egress.
2. **Interactive Preview**: Developers review, edit, or adjust extracted stack traces before sending them to the reasoning engine.
3. **Identifies Likely Causes**: Llama 3 reasons through the extracted evidence and ranks root causes with estimated probabilities and plain-English rationales.
4. **Recommends Safe Troubleshooting**: Generates numbered actions classified by risk level (`Safe`, `Moderate`, `Risky`) with copyable commands and rollback advice. Commands are recommendations only and never execute autonomously.
5. **Verifies Resolution (Closed-Loop)**: Analyzes a second screenshot taken after troubleshooting to evaluate whether the error is `resolved`, `still_present`, or resulted in a `new_error`.

> **Note on Architecture**: Standard `llama3` is a text-only foundation model. In devdoctor-ai, Tesseract.js reads the screenshot locally in the browser, while Llama 3 reasons about the extracted text. This enables instant execution on pre-installed Llama 3 weights without requiring massive ~7.8GB vision model downloads.

---

## 2. Key Features

- **Client-Side Optical Character Recognition**: In-browser OCR via Tesseract.js (WASM / Web Worker). Zero screenshot bytes leave your machine.
- **Open-Weight Llama 3 Engine**: Powered by Meta Llama 3 (`llama3:latest`, 4.7 GB) running natively and privately on your machine via Ollama.
- **Closed-Loop Verification Loop**:
  $$\text{Screenshot} \longrightarrow \text{Local OCR (Tesseract.js)} \longrightarrow \text{Llama 3 Reasoning} \longrightarrow \text{Prioritized Safe Fix} \longrightarrow \text{Follow-up OCR} \longrightarrow \text{Verification}$$
- **Command Safety Guard**: Classifies every command by risk level (`safe`, `moderate`, `risky`). Never runs commands automatically without developer consent.
- **Zero Server Image Retention**: Screenshots are processed in transient client memory; the server receives only the extracted text and in-memory base64 buffers during active inference, which are discarded immediately after response synthesis.
- **Transparent Demo Mode**: Provides high-fidelity, deterministic sample error scenarios (Node.js, React, Docker) clearly watermarked `[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]` for offline workshops and zero-dependency evaluation.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Developer Workstation                            │
│                                                                             │
│  ┌────────────────────────┐                   ┌──────────────────────────┐  │
│  │     React 18 SPA       │  REST API (JSON)  │     Express / Node.js    │  │
│  │ (Vite + Tailwind CSS)  │ ◄───────────────► │       API Server         │  │
│  │  [Upload / Preview]    │                   │  (Strict Type Contract)  │  │
│  └───────────┬────────────┘                   └─────────────┬────────────┘  │
│              │                                              │               │
│              ▼                                              │               │
│  ┌────────────────────────┐                                 ▼               │
│  │ Local Tesseract.js OCR │                    ┌─────────────────────────┐  │
│  │ (In-Browser WASM/Worker│                    │ Multimodal Model Router │  │
│  └───────────┬────────────┘                    └────────────┬────────────┘  │
│              │ Extracted Text + Context                     │               │
│              └───────────────────────────────┐              │               │
│                                              ▼              ▼               │
│                              ┌─────────────────────────┐      ┌───────────┴───┐
│                              │   Ollama Local Engine   │      │ Offline Demo  │
│                              │      (llama3:latest)    │      │   Provider    │
│                              │  http://localhost:11434 │      │ (Deterministic│
│                              └─────────────────────────┘      └───────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

For full architectural details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 4. Quickstart Guide

### Prerequisites
- **Node.js**: v20+ and `npm` installed.
- **Git**: Installed and available in terminal.
- **Ollama**: Installed natively from [ollama.com](https://ollama.com) with `llama3` available.

### Step 1: Clone the Repository
```bash
git clone https://github.com/bharathwajverse/devdoctor-ai.git
cd devdoctor-ai
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Verify Ollama & Llama 3
Ensure Ollama is running and confirm the installed model:
```bash
ollama list
# Expected output includes:
# llama3:latest    365c0bd3c000    4.7 GB
```

### Step 4: Configure Environment (Optional)
```bash
cp .env.example .env
```
Default settings connect to `http://localhost:11434` with model `llama3`.

### Step 5: Launch Backend and Frontend
In terminal 1 (Backend API):
```bash
npm run dev:backend
```
*Backend listens on `http://localhost:3001`.*

In terminal 2 (Frontend SPA):
```bash
npm run dev
```
*Frontend opens on `http://localhost:5173`.*

Alternatively, run the launcher script:
```powershell
.\scripts\run-dev.ps1
```

---

## 5. API Reference

All requests and responses use strict typed schemas shared in [`src/shared/types.ts`](src/shared/types.ts).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check Ollama daemon status, installed models (`llama3`), and limits |
| `POST` | `/api/analyze` | Submit error screenshot or extractedText and receive structured Llama 3 diagnosis |
| `POST` | `/api/verify` | Submit follow-up screenshot or extractedText to evaluate if problem was resolved |

For complete payload schemas, error codes, and examples, see [docs/API_SPEC.md](docs/API_SPEC.md).

---

## 6. Testing

devdoctor-ai includes an automated test suite verifying payload size constraints, MIME type enforcement, JSON recovery from LLM outputs, client-side OCR extraction, and full API integration:

```bash
# Run all automated tests (59 passing tests)
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript type check
npm run typecheck

# Production build test
npm run build

# Live inference test (validates running Ollama Llama 3)
npx tsx scripts/test_live_inference.ts
```

---

## 7. Documentation Index

- [PRD.md](PRD.md) — Product Requirements Document and user journeys
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design and data flow
- [docs/API_SPEC.md](docs/API_SPEC.md) — OpenAPI endpoint specifications
- [docs/AI_MODEL_INTEGRATION.md](docs/AI_MODEL_INTEGRATION.md) — Llama 3 prompts, Tesseract.js OCR, and Ollama integration
- [docs/SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md) — Data protection and command safety rules
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — Test matrix and QA verification
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — Milestone roadmap
- [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) — Hackathon challenge compliance evidence
- [AGENTS.md](AGENTS.md) — Coding agent rules and architectural boundaries

---

## 8. License & Attribution

- **Original Project Code**: Licensed under the [Apache License 2.0](LICENSE).
- **Open-Weight AI Models**: Meta Llama 3 is governed by the Meta Llama 3 Community License Agreement. Model weights are downloaded and executed separately via Ollama and are independent of this repository's software license.
