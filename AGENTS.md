# AGENTS.md — devdoctor-ai Engineering Rules & Guidelines

Welcome to `devdoctor-ai`. This document provides instructions, architectural boundaries, and coding conventions for AI agents and human contributors interacting with this repository.

## 1. Project Overview & Identity
- **Name**: `devdoctor-ai`
- **Purpose**: An open-weight multimodal AI debugging assistant that analyzes software error screenshots, explains visible evidence and likely causes, and generates prioritized, safe troubleshooting guidance with optional follow-up screenshot verification.
- **Repository**: `https://github.com/bharathwajverse/devdoctor-ai`

## 2. Core Architectural Principles
1. **Single Source of Truth for Schemas**:
   All request and response shapes (`DiagnosisResult`, `VerificationResult`, `TroubleshootingStep`, etc.) are declared once in `src/shared/types.ts` and shared between backend, frontend, and tests.
2. **Never Execute Shell Commands Automatically**:
   All troubleshooting commands are recommendations presented to the developer with risk levels (`safe`, `moderate`, `risky`) and clear copy buttons. Never attempt to run developer-facing fixes autonomously.
3. **Explicit Fallbacks, No Deceptive Claims**:
   If live multimodal model inference is offline or unconfigured, the system surfaces sample demo scenarios that are prominently flagged with `[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]`. Never misrepresent simulated responses as live model inferences.
4. **Security & Privacy First**:
   - Zero image retention beyond inference lifespan.
   - Enforce 10MB file limit and MIME validation (`image/png`, `image/jpeg`, `image/webp`).
   - Server-side API keys only; never leak credentials to the client.
   - Warn users not to upload secrets, API tokens, or PII.

## 3. Directory Layout
```
devdoctor-ai/
├── docs/                      # Comprehensive technical specifications
│   ├── ARCHITECTURE.md        # System architecture, data flow, failure modes
│   ├── API_SPEC.md            # OpenAPI-style contracts for /api/analyze, /verify, /health
│   ├── AI_MODEL_INTEGRATION.md# Ollama / Llama 3 & Tesseract.js OCR specs & prompts
│   ├── SECURITY_AND_PRIVACY.md# Threat model, image handling, prompt injection defense
│   ├── TEST_PLAN.md           # Automated and manual verification matrix
│   ├── IMPLEMENTATION_PLAN.md # Roadmap and milestone tracker
│   └── SUBMISSION_CHECKLIST.md# Hackathon & Open-Source AI compliance evidence
├── src/
│   ├── backend/               # Express + Node.js API server
│   │   ├── services/          # Multimodal model providers (Ollama, Gemini, Demo)
│   │   ├── routes/            # /api/analyze, /api/verify, /api/health
│   │   ├── middleware/        # Security headers, file validation, rate limiting
│   │   └── server.ts          # Server entry point
│   ├── frontend/              # React 18 + Vite + Tailwind CSS SPA
│   │   ├── components/        # UploadZone, DiagnosisCard, VerificationPanel, etc.
│   │   ├── hooks/             # useAnalysis, useVerification
│   │   └── App.tsx            # Main application layout
│   └── shared/                # Cross-tier TypeScript interfaces and constants
│       └── types.ts
├── tests/                     # Unit, integration, and contract tests
├── PRD.md                     # Product Requirements Document
├── README.md                  # Developer & judge documentation
├── LICENSE                    # Apache 2.0 License + Model Notice
├── package.json               # Scripts and dependencies
└── .env.example               # Template environment configuration
```

## 4. Coding Conventions
- **TypeScript**: Strict mode enabled (`strict: true`). No implicit `any`.
- **Formatting**: 2 spaces, semicolon, single quotes where appropriate.
- **Components**: Functional components with hooks.
- **Error Handling**: Every route must catch errors and return standard RFC-7807 structured JSON errors with `{ error: { code, message, details } }`.
- **Testing**: Maintain test coverage for API endpoints, payload validation, model parsing, and edge cases.
