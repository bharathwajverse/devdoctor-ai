# Hackathon Submission Checklist & Evidence Matrix — devdoctor-ai

## 1. Event & Challenge Information

- **Project Name**: `devdoctor-ai`
- **Tagline**: Understand errors. Find the cause. Fix with confidence.
- **Repository**: [https://github.com/bharathwajverse/devdoctor-ai](https://github.com/bharathwajverse/devdoctor-ai)
- **Primary Track**: Best Open Source AI Project / Multimodal Developer Tooling
- **License**: Apache 2.0 (OSI-Approved)

---

## 2. Requirement-to-Evidence Mapping Matrix

| Official Requirement | Implementation Evidence in Repository | Verification Method |
| :--- | :--- | :--- |
| **1. Public Repository** | GitHub repository configured at `bharathwajverse/devdoctor-ai`. Clean git history with descriptive commits. | `git remote -v`, GitHub URL |
| **2. OSI-Approved License** | Original application code licensed under **Apache 2.0** in `LICENSE`. Distinct notice covering third-party open-weight model terms. | Inspect `LICENSE` |
| **3. Meaningful AI Role** | Multimodal open-weight AI (`gemma4` / `paligemma:3b` via Ollama) performs visual OCR, error extraction, root cause deduction, and follow-up verification. Not a decorative chatbot. | Inspect `src/backend/services/ollamaService.ts` |
| **4. Reproducible Local Setup** | Native host setup with Node.js v20+, Ollama, and npm scripts. Complete instructions documented in `README.md`. | Run `npm install && npm test && npm run dev` |
| **5. Closed-Loop Verification** | Two-step workflow: Screenshot Diagnosis $\to$ Fix Guidance $\to$ Follow-up Screenshot $\to$ Resolution Assessment (`resolved`, `still_present`, `new_error`, `inconclusive`). | Inspect `src/frontend/components/VerificationPanel.tsx` and `tests/api.test.ts` |
| **6. Truthful Transparency** | Demo fallback is clearly watermarked `[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]`. Never presents simulated responses as live model inferences. | Inspect `src/backend/services/demoService.ts` and `DiagnosisCard.tsx` |
| **7. Safety & Command Risk** | Troubleshooting actions are classified by risk (`Safe`, `Moderate`, `Risky`). Commands are never executed autonomously. | Inspect `TroubleshootingList.tsx` and `docs/SECURITY_AND_PRIVACY.md` |
| **8. Automated Test Coverage** | 23 automated tests covering validation, MIME parsing, JSON normalization, and API endpoints using Vitest & Supertest. | Run `npm test` |
| **9. Production Build** | Vite production bundle generated without errors or warnings. | Run `npm run build` |

---

## 3. Submission Verification Checklist

- [x] Repository contains valid `LICENSE` (Apache 2.0) with third-party model terms.
- [x] Repository contains `.gitignore` preventing commit of `.env`, secrets, or `node_modules`.
- [x] Repository contains `.env.example` documenting all configuration options.
- [x] Repository contains comprehensive `README.md` with problem statement, architecture, installation, and usage guide.
- [x] Repository contains architectural specifications in `docs/`.
- [x] Application compiles cleanly via `npm run build`.
- [x] All 23 automated tests pass via `npm test`.
- [x] API endpoints validated: `GET /api/health`, `POST /api/analyze`, `POST /api/verify`.
- [x] Demo mode verified for offline/unconfigured environments.
