# devdoctor-ai 🩺⚡

> **An open-weight multimodal AI debugging assistant that turns software error screenshots into actionable, safe debugging guidance and verifies your fix with a follow-up screenshot.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-Open--Weight_Vision-black?logo=ollama&logoColor=white)](https://ollama.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passed-brightgreen)](file:///g:/SNAPDEBEG/tests)

---

## 📸 Overview

DevDoctor AI helps students, bootcamp learners, and developers understand and troubleshoot software errors without struggling through confusing technical jargon or pasting code across fragmented web forums.

Using multimodal vision models running locally through **Ollama** (e.g. Google's **PaliGemma 3B** or **LLaVA 7B**) or cloud AI providers, DevDoctor AI inspects screenshots of terminal windows, browser developer consoles, IDE code editors, and CI/CD pipelines.

### The Closed-Loop Workflow
$$\mathbf{Screenshot} \longrightarrow \mathbf{Diagnosis} \longrightarrow \mathbf{Safe\ Fix} \longrightarrow \mathbf{Follow\text{-}up\ Screenshot} \longrightarrow \mathbf{Verification}$$

1. **Visual Error Ingestion**: Paste (`Ctrl+V`), drag, or upload an error screenshot.
2. **AI-Powered Evidence Extraction**: Identifies verbatim error text, file paths, line numbers, and suspect libraries.
3. **Ranked Root Causes**: Generates probabilistic hypotheses explaining *why* the error occurred.
4. **Prioritized Safe Troubleshooting**: Step-by-step remediation commands labeled with risk levels (`Safe`, `Moderate`, `Risky`) and rollback instructions.
5. **Follow-Up Screenshot Verification**: Upload a second screenshot to assess whether the issue appears **Resolved**, **Still Present**, or **Encountered a New Error**.
6. **Privacy-Conscious Local AI**: Run open-weight models locally on your workstation with zero external data transmission.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS, Lucide React icons.
- **Backend**: Node.js v20+, Express 4, TypeScript.
- **Multimodal AI**:
  - **Local Open-Weight (Default)**: Ollama (`paligemma:3b`, `llava:7b`).
  - **Cloud Alternative**: Google Gemini API (`gemini-1.5-flash`).
  - **Offline Demo Fallback**: Fully deterministic pre-analyzed developer scenarios for zero-dependency inspection and evaluation.
- **Automated Testing**: Vitest 1.3, Supertest 6.

---

## 🚀 Quickstart & Installation

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Ollama** (Optional, for local open-weight inference): [Install Ollama](https://ollama.com/)

### 2. Clone & Setup
```bash
git clone https://github.com/bharathwajverse/devdoctor-ai.git
cd devdoctor-ai

# Copy environment configuration
cp .env.example .env
```

### 3. (Optional) Run Local Multimodal Vision Model with Ollama
```bash
# Pull the lightweight Google PaliGemma multimodal model
ollama run paligemma:3b

# Or LLaVA 7B
ollama run llava:7b
```
*Note: If Ollama is not running, DevDoctor AI automatically enables Demo Fallback mode so you can test all features with high-fidelity sample error scenarios.*

### 4. Start the Application
In your terminal, start the backend and frontend:

```bash
# Terminal 1: Start Express API server (Port 3001)
npm run dev:backend

# Terminal 2: Start Vite React Frontend (Port 5173)
npm run dev
```

Open your browser to `http://localhost:5173`.

---

## 🧪 Testing & Verification

Run the comprehensive automated test suite (verifying file validation, payload constraints, error responses, model parsing, and verification):

```bash
# Run automated tests
npm run test

# Type check
npm run typecheck

# Production build
npm run build
```

---

## 📖 System Architecture & Documentation

Comprehensive architectural and engineering specifications are located in the [`docs/`](file:///g:/SNAPDEBEG/docs) directory:

- 📄 [`PRD.md`](file:///g:/SNAPDEBEG/PRD.md) — Product requirements, user journeys, acceptance criteria, and non-goals.
- 📐 [`docs/ARCHITECTURE.md`](file:///g:/SNAPDEBEG/docs/ARCHITECTURE.md) — Component architecture, data flow diagrams, and failure paths.
- 🔌 [`docs/API_SPEC.md`](file:///g:/SNAPDEBEG/docs/API_SPEC.md) — Detailed OpenAPI-style contracts for `/api/analyze`, `/api/verify`, and `/api/health`.
- 🤖 [`docs/AI_MODEL_INTEGRATION.md`](file:///g:/SNAPDEBEG/docs/AI_MODEL_INTEGRATION.md) — Multimodal model specs, prompt design, and output sanitization.
- 🔒 [`docs/SECURITY_AND_PRIVACY.md`](file:///g:/SNAPDEBEG/docs/SECURITY_AND_PRIVACY.md) — Zero-retention policy, input constraints, and command safety.
- 🧪 [`docs/TEST_PLAN.md`](file:///g:/SNAPDEBEG/docs/TEST_PLAN.md) — Automated and manual verification matrix.
- 🗺️ [`docs/IMPLEMENTATION_PLAN.md`](file:///g:/SNAPDEBEG/docs/IMPLEMENTATION_PLAN.md) — Milestones, completed work, and future roadmap.
- 🏆 [`docs/SUBMISSION_CHECKLIST.md`](file:///g:/SNAPDEBEG/docs/SUBMISSION_CHECKLIST.md) — MLH Best Open-Source AI challenge evidence mapping.

---

## 🔒 Security & Privacy Notice

- **No Autonomous Execution**: Shell commands are never automatically executed on your system. You inspect and copy commands manually.
- **Sensitive Data**: Never upload screenshots containing passwords, private API tokens, `.env` files, or PII.
- **In-Memory Only**: Uploaded images are discarded immediately after model inference and are never persisted to disk.

---

## 📜 License & Attribution

- **Project Code**: Distributed under the **Apache License 2.0**. See [`LICENSE`](file:///g:/SNAPDEBEG/LICENSE) for details.
- **Model Weights Notice**: Open-weight models (PaliGemma, Gemma, LLaVA) are governed by their respective licenses (e.g. Google Gemma Terms of Use). Using model weights is independent of this project's software license.
