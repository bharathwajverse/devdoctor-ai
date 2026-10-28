# Multimodal AI Model Integration — devdoctor-ai

## 1. Model Selection & Architecture

`devdoctor-ai` utilizes open-weight multimodal vision-language architectures to extract optical text, analyze error visual layouts, reason over stack traces, and formulate actionable troubleshooting plans.

### 1.1 Primary Model: PaliGemma / Gemma Vision Family
- **Model Identifier**: `paligemma:3b` (default for local inference) / `paligemma2:3b` / `llava:7b`
- **Developer / Creator**: Google DeepMind
- **Weights Architecture**: SigLIP vision encoder coupled with Gemma open-weight autoregressive language model.
- **Why PaliGemma / Gemma**:
  - Open-weights permitted for commercial and non-commercial developer tooling under Google Gemma Terms of Use.
  - Native multimodal conditioning: accepts high-resolution image tokens alongside text prompts.
  - Compact parameter scale (3B / 7B): Can execute locally on consumer workstations (4GB-8GB VRAM / CPU RAM) through Ollama.
- **Alternative Supported Engine**: Google Gemini API (`gemini-1.5-flash`) for cloud-hosted evaluation and benchmark comparison.

---

## 2. Inference Routing & Methods

### 2.1 Route A: Local Ollama Daemon (Privacy-First Open-Source Route)
- **Endpoint**: `http://127.0.0.1:11434/api/generate` or `/api/chat`
- **Method**: Direct HTTP POST with base64 image strings.
- **Workflow**:
  1. Base64 screenshot stripped of `data:image/...;base64,` prefix.
  2. Prompt formatted with explicit system instructions requesting strictly structured JSON.
  3. Response streamed or received in full, parsed, sanitized, and validated against the `DiagnosisResult` schema.

```bash
# Pull model locally
ollama run paligemma:3b
# Or larger capacity
ollama run llava:7b
```

### 2.2 Route B: Google Generative AI API (Cloud Open-Access Route)
- **Endpoint**: Google AI Studio v1beta API (`gemini-1.5-flash` / `gemma-3b`)
- **Authentication**: `GEMINI_API_KEY` stored exclusively in server environment.
- **Payload**: Standard `inlineData` MIME buffer with system instructions.

### 2.3 Route C: Deterministic Sample Provider (Zero-Dependency Demo Mode)
- Built-in provider supplying pre-analyzed, realistic developer error scenarios (Node.js module resolution, React rendering errors, Docker networking faults).
- Every output is watermarked `[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]` to preserve total academic and competition honesty.

---

## 3. Multimodal Prompt Design

### 3.1 Initial Diagnosis Prompt
```markdown
You are devdoctor-ai, an expert software debugging assistant specializing in error screenshots.
Analyze the provided screenshot carefully.

Extract:
1. Exact error text, file path, line number, error code, and suspect library.
2. Contextual evaluation: Is the evidence clear or uncertain/blurry?
3. Root cause hypotheses: List 2-3 plausible causes with estimated probabilities.
4. Troubleshooting steps: Prioritized list of concrete fixes. Each step MUST have:
   - title: concise action title
   - explanation: why this works
   - action: exact terminal command or code change
   - riskLevel: "safe", "moderate", or "risky"
   - rollbackAdvice: how to undo if destructive

You MUST respond strictly in valid JSON matching this schema:
{
  "headline": string,
  "summary": string,
  "confidenceScore": number,
  "evidence": {
    "rawText": string,
    "errorType": string,
    "errorCode": string,
    "filePath": string,
    "lineNumber": number,
    "suspectComponent": string,
    "uncertain": boolean
  },
  "rootCauses": [
    { "cause": string, "probability": number, "explanation": string }
  ],
  "troubleshootingSteps": [
    {
      "stepNumber": number,
      "title": string,
      "explanation": string,
      "action": string,
      "riskLevel": "safe" | "moderate" | "risky",
      "rollbackAdvice": string
    }
  ],
  "safetyNotice": string
}
Do not include Markdown ticks (```json) around the JSON.
```

### 3.2 Verification Prompt
```markdown
You are devdoctor-ai verifying if a software issue has been resolved.
You are given the previous diagnosis and a new screenshot taken after troubleshooting.

Compare the two states and determine:
- status: "resolved" | "still_present" | "new_error" | "inconclusive"
- confidence: number between 0.0 and 1.0
- observations: list of visual evidence points
- comparisonSummary: clear paragraph explaining what changed
- nextSteps: 1-2 follow-up commands if needed

Respond strictly in valid JSON matching the VerificationResult schema.
```

---

## 4. Robust Response Parsing & Defense Against Malformed Output

LLMs occasionally output Markdown formatting fences (` ```json `), explanatory conversational text, or trailing commas. devdoctor-ai implements a multi-stage parser:

1. **Direct JSON Parse**: Attempts standard `JSON.parse(rawText)`.
2. **Regex Extraction**: If direct parse fails, extracts text between the first `{` and the last `}`.
3. **Markdown Strip**: Removes leading and trailing ` ```json ` fences.
4. **Schema Normalization**: Fills missing optional fields with sensible defaults (e.g., `uncertain: true`, `riskLevel: 'moderate'`).
5. **Fallback Safety Guard**: If all parses fail, constructs a safe fallback object containing the raw text response rather than throwing a 500 error to the client.

---

## 5. Licensing & Terms of Use

- **PaliGemma / Gemma**: Subject to the Google Gemma Terms of Use. Redistributing model weights or deploying hosted services must comply with Gemma's Acceptable Use Policy.
- **devdoctor-ai Codebase**: Apache 2.0. The software license applies to the application code, utilities, frontend, and backend architecture, and does not grant proprietary rights over third-party weights.

---

## 6. Known Model Limitations

1. **Resolution & Tiny Font**: Terminals configured with 8pt fonts on 4K screens may require cropping to maintain high OCR fidelity.
2. **Color Inversion**: High-contrast solarized or monochrome themes may degrade syntax highlighting recognition.
3. **Hallucination Risk**: Large models may hypothesize root causes that are plausible but unrelated to the developer's exact local environment. All recommendations must be verified by the user before running.
