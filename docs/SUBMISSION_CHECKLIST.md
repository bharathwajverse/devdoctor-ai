# Hackathon Submission Checklist — devdoctor-ai

**Event Category**: Major League Hacking (MLH) / Open-Source AI Track  
**Challenge**: Best Open-Source AI Project  
**Repository**: [https://github.com/bharathwajverse/devdoctor-ai](https://github.com/bharathwajverse/devdoctor-ai)  

---

## 1. Compliance & Challenge Requirements Matrix

| Requirement | Evidence in Repository | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Meaningful Open-Weight AI** | Uses `paligemma:3b` / `llava:7b` via Ollama local runtime for multimodal OCR, error understanding, and resolution assessment | Check [`docs/AI_MODEL_INTEGRATION.md`](file:///g:/SNAPDEBEG/docs/AI_MODEL_INTEGRATION.md) and [`src/backend/services/ollamaService.ts`](file:///g:/SNAPDEBEG/src/backend/services/ollamaService.ts) | **VERIFIED** |
| **Permissive Open-Source License** | Complete Apache License 2.0 included in repository root | Check [`LICENSE`](file:///g:/SNAPDEBEG/LICENSE) | **VERIFIED** |
| **Third-Party Model Attribution** | Explicit license notice attributing Google Gemma and PaliGemma terms of use | Check [`LICENSE`](file:///g:/SNAPDEBEG/LICENSE) and [`docs/AI_MODEL_INTEGRATION.md`](file:///g:/SNAPDEBEG/docs/AI_MODEL_INTEGRATION.md) | **VERIFIED** |
| **Reproducible Setup Instructions** | Step-by-step local execution commands with zero hidden dependencies | Check [`README.md`](file:///g:/SNAPDEBEG/README.md) Setup Guide | **VERIFIED** |
| **Working Application & Demo** | Complete React + Vite frontend and Express backend with interactive screenshot diagnosis and verification | Run `npm run dev` and `npm run dev:backend` | **VERIFIED** |
| **Closed-Loop Verification** | Unique feature: Evaluates a second screenshot to assess whether the error was fixed | Test with `POST /api/verify` or UI Verification drawer | **VERIFIED** |
| **Ethical AI & Transparency** | Clear labeling of demo/sample data when offline; no simulated results disguised as live AI | Inspect Demo Watermark and [`docs/SECURITY_AND_PRIVACY.md`](file:///g:/SNAPDEBEG/docs/SECURITY_AND_PRIVACY.md) | **VERIFIED** |
| **Automated Test Coverage** | Vitest and Supertest test suite validating endpoints, file limits, and error flows | Run `npm run test` (100% pass) | **VERIFIED** |
| **Clean Repository Hygiene** | No committed credentials, `.env` ignored, production build tested | Check `.gitignore`, `npm run build` | **VERIFIED** |

---

## 2. Devpost / Submission Copy

### Project Title
**DevDoctor AI — Local, Screenshot-Based Software Debugging Assistant**

### Tagline
An open-weight AI assistant that turns software error screenshots into actionable, safe debugging guidance and verifies your fix with a follow-up screenshot.

### Elevator Pitch
Beginner developers and experienced engineers alike waste hours deciphering cryptic compiler errors, broken terminal scripts, and browser console exceptions. DevDoctor AI bridges this gap using open-weight multimodal models (PaliGemma / Gemma running locally via Ollama). Developers simply paste an error screenshot, receive an instant structured breakdown of the visible evidence, likely root causes, and prioritized safe troubleshooting steps, and then verify their fix by uploading a follow-up screenshot.

### What Makes it Unique
Most AI coding assistants only output raw code snippets without knowing if they work. DevDoctor AI implements the full **Closed-Loop Verification**:
$$\text{Screenshot} \longrightarrow \text{Diagnosis} \longrightarrow \text{Prioritized Safe Fix} \longrightarrow \text{Second Screenshot} \longrightarrow \text{Outcome Verification}$$

### How It Was Built
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Node.js v20, Express, Supertest, Vitest.
- **AI Engine**: Ollama local inference running Google PaliGemma 3B with SigLIP vision encoder, with support for Google Gemini API and a deterministic offline sample demo provider.
