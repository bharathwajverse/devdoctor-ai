# devdoctor-ai

<div align="center">

**Understand errors. Find the cause. Fix with confidence.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Tests: Vitest](https://img.shields.io/badge/Tests-45%20Passing-brightgreen.svg)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](tsconfig.json)
[![React](https://img.shields.io/badge/React-18.2-cyan)](src/frontend/)
[![Vite](https://img.shields.io/badge/Vite-5.1-purple)](vite.config.ts)
[![Ollama](https://img.shields.io/badge/Ollama-Native%20Local%20AI-orange)](https://ollama.com)

*An open-weight multimodal AI debugging assistant that transforms software error screenshots into structured root-cause analyses, safe step-by-step remediation plans, and closed-loop follow-up verification.*

</div>

---

## 1. Problem & Solution

### The Challenge
Developers waste hours staring at cryptic terminal crashes, browser console stack traces, and IDE syntax warnings. Text-only LLMs require laboriously copying stack traces, losing critical visual layout context (ANSI terminal colors, highlighted tokens, browser network tabs). Worse, existing chatbots often propose dangerous or irreversible terminal commands (e.g., `rm -rf`, `git reset --hard`) without risk ratings or follow-up verification to confirm whether the fix worked.

### The devdoctor-ai Solution
**devdoctor-ai** enables developers to drag and drop or paste (`Ctrl+V`) a screenshot of their error. Running open-weight multimodal models (such as `gemma4` or `paligemma` locally via Ollama), it:
1. **Extracts Visual Evidence**: Reads stack traces, line numbers, error codes, and suspect components directly from pixel data.
2. **Identifies Likely Causes**: Ranks root causes with estimated probabilities and plain-English rationales.
3. **Recommends Safe Troubleshooting**: Generates numbered actions classified by risk level (`Safe`, `Moderate`, `Risky`) with copyable commands and rollback advice.
4. **Verifies Resolution (Closed-Loop)**: Analyzes a second screenshot taken after troubleshooting to evaluate whether the error is `resolved`, `still_present`, or resulted in a `new_error`.

---

## 2. Key Features

- **Multimodal Visual Understanding**: Ingests screenshots via drag-and-drop, file picker, or direct system clipboard paste (`Ctrl+V`).
- **Open-Weight AI Pipeline**: Powered by Google Gemma open-weight vision-language models running natively and privately on your machine via Ollama.
- **Closed-Loop Verification Loop**:
  $$\text{Screenshot} \longrightarrow \text{Multimodal Diagnosis} \longrightarrow \text{Prioritized Safe Fix} \longrightarrow \text{Follow-up Screenshot} \longrightarrow \text{Verification}$$
- **Command Safety Guard**: Classifies every command by risk level. Never runs commands automatically without developer consent.
- **Zero Server Retention**: Uploaded images are processed strictly in transient memory buffers and garbage-collected immediately. No files or images are stored on disk.
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
│  └────────────────────────┘                   └─────────────┬────────────┘  │
│             ▲                                               │               │
│             │ Clipboard / Drag & Drop                       │               │
│  ┌──────────┴─────────────┐                                 ▼               │
│  │   Screenshot Ingestion │                    ┌─────────────────────────┐  │
│  │ (Terminal / IDE / Web) │                    │ Multimodal Model Router │  │
│  └────────────────────────┘                    └────────────┬────────────┘  │
│                                                             │               │
│                                           ┌─────────────────┴─────────────┐ │
│                                           ▼                               ▼ │
│                              ┌─────────────────────────┐      ┌───────────┴───┐
│                              │   Ollama Local Engine   │      │ Offline Demo  │
│                              │     (gemma4 / vision)   │      │   Provider    │
│                              │  http://127.0.0.1:11434 │      │ (Deterministic│
│                              └─────────────────────────┘      └───────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

For full architectural details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 4. Quickstart Guide

### Prerequisites
- **Node.js**: v20+ and `npm` installed.
- **Git**: Installed and available in terminal.
- **Ollama**: Installed natively from [ollama.com](https://ollama.com).

### Step 1: Clone the Repository
```bash
git clone https://github.com/bharathwajverse/devdoctor-ai.git
cd devdoctor-ai
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Ollama & Pull Open-Weight Model
Ensure Ollama is running in the background:
```bash
# Start Ollama service
ollama serve

# Pull Gemma 4 multimodal model (in another terminal)
ollama pull gemma4
```

### Step 4: Configure Environment (Optional)
```bash
cp .env.example .env
```
Default settings connect to `http://127.0.0.1:11434` with model `gemma4`.

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

---

## 5. API Reference

All requests and responses use strict typed schemas shared in [`src/shared/types.ts`](src/shared/types.ts).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check Ollama daemon status, installed models, and limits |
| `POST` | `/api/analyze` | Submit error screenshot and receive structured diagnosis |
| `POST` | `/api/verify` | Submit follow-up screenshot to evaluate if problem was resolved |

For complete payload schemas, error codes, and examples, see [docs/API_SPEC.md](docs/API_SPEC.md).

---

## 6. Testing

devdoctor-ai includes an automated test suite verifying payload size constraints, MIME type enforcement, JSON recovery from LLM outputs, and full API integration:

```bash
# Run all automated tests
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript type check
npm run typecheck

# Production build test
npm run build
```

---

## 7. Documentation Index

- [PRD.md](PRD.md) — Product Requirements Document and user journeys
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design and data flow
- [docs/API_SPEC.md](docs/API_SPEC.md) — OpenAPI endpoint specifications
- [docs/AI_MODEL_INTEGRATION.md](docs/AI_MODEL_INTEGRATION.md) — Multimodal prompts and Ollama integration
- [docs/SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md) — Data protection and command safety rules
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — Test matrix and QA verification
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — Milestone roadmap
- [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) — Hackathon challenge compliance evidence
- [AGENTS.md](AGENTS.md) — Coding agent rules and architectural boundaries

---

## 8. License & Attribution

- **Original Project Code**: Licensed under the [Apache License 2.0](LICENSE).
- **Open-Weight AI Models**: Models such as Google Gemma and PaliGemma are governed by their respective licenses (e.g., Google Gemma Terms of Use). Model weights are downloaded and executed separately via Ollama and are independent of this repository's software license.
