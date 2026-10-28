# Open-Weight AI Model Integration — devdoctor-ai

## 1. Model Selection & Architecture

`devdoctor-ai` couples client-side optical character recognition (OCR) with local open-weight language model reasoning to deliver zero-cloud-egress software debugging.

### 1.1 Primary Model: Meta Llama 3 via Ollama
- **Installed Model Identifier**: `llama3:latest` (Digest: `365c0bd3c000`, Size: 4.7 GB)
- **Runtime Environment**: Ollama daemon (`http://localhost:11434`)
- **Architecture**: 8B parameter dense autoregressive transformer
- **License**: Meta Llama 3 Community License Agreement (permissive open-weights for commercial and research applications up to 700M monthly active users)

### 1.2 Optical Text Extraction: Tesseract.js
- **OCR Engine**: Tesseract.js (WebAssembly / Web Worker optical character recognition)
- **Execution Location**: Client-side inside the user's browser
- **Data Flow Privacy**: Zero image bytes leave the developer's workstation. Text is extracted in the browser thread, verified/adjusted by the user, and forwarded to the local backend.

### 1.3 Why Llama 3 + Local OCR (Architecture Rationale)
1. **Pre-installed & Zero Download Overhead**: The user's workstation already has `llama3:latest` installed and verified in Ollama. Attempting to pull large vision models (e.g. `gemma4:e2b` or `llama3.2-vision` at ~7.8 GB) wastes gigabytes of bandwidth and minutes of download time.
2. **Deep Software Reasoning**: Llama 3 excels at code comprehension, stack trace dissection, root-cause probability modeling, and generating safe, idiomatic terminal commands.
3. **Architectural Decoupling**: Standard Llama 3 is a text-only model. Decoupling image text extraction (via browser Tesseract.js) from diagnostic reasoning (via Llama 3) creates a modular, auditable pipeline where developers can inspect and edit the extracted text before it is sent to the reasoning engine.
4. **Alternative Fallbacks**: Supports Google Gemini API (`gemini-1.5-flash`) for cloud comparison and a built-in deterministic Sample Demo provider when Ollama is offline.

---

## 2. Inference Routing & Methods

### 2.1 Route A: Local Llama 3 via Ollama (Default Route)
- **Endpoint**: `http://localhost:11434/api/generate`
- **Method**: HTTP POST with structured JSON prompt payload.
- **Workflow**:
  1. User drops, pastes (`Ctrl+V`), or selects a screenshot.
  2. Tesseract.js OCR extracts visible error text with real-time progress.
  3. User inspects/edits the extracted text in the preview box.
  4. Backend formats the prompt with environment context and schema instructions.
  5. Ollama executes `llama3:latest` and returns structured JSON diagnosis.

```bash
# Verify local Llama 3 runtime
ollama list
# Output:
# llama3:latest    365c0bd3c000    4.7 GB
```

### 2.2 Route B: Google Generative AI API (Cloud Open-Access Route)
- **Endpoint**: Google AI Studio v1beta API (`gemini-1.5-flash`)
- **Authentication**: `GEMINI_API_KEY` stored exclusively in server environment.

### 2.3 Route C: Deterministic Sample Provider (Zero-Dependency Demo Mode)
- Built-in provider supplying pre-analyzed, realistic developer error scenarios (Node.js module resolution, React rendering errors, Docker networking faults).
- Every output is watermarked `[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]` to preserve total academic and competition honesty.

---

## 3. Diagnostic & Verification Prompts

### 3.1 Initial Diagnosis Prompt
```markdown
You are devdoctor-ai, an expert software debugging assistant specializing in error screenshots.
Analyze the provided screenshot carefully.
Context environment: ${context}.
User explanation of what happened: "${userDescription}".
Visible error text extracted from screenshot (via local OCR):
"""
${extractedText}
"""

You MUST extract and diagnose:
1. Exact error text, file path, line number, error code, and suspect library.
2. Contextual evaluation: Is the evidence clear or uncertain/blurry?
3. Root cause hypotheses: List 2-3 plausible causes with estimated probabilities (0.0 to 1.0).
4. Troubleshooting steps: Prioritized list of concrete fixes. Each step MUST have:
   - stepNumber: integer
   - title: concise action title
   - explanation: why this works
   - action: exact terminal command or code change
   - riskLevel: "safe", "moderate", or "risky"
   - rollbackAdvice: how to undo if destructive (optional)

Respond strictly in valid JSON matching this schema:
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
```

### 3.2 Verification Prompt
```markdown
You are devdoctor-ai verifying whether a software error has been resolved.
Previous Diagnosis:
- Headline: ${headline}
- Error Type: ${errorType}
- Suspect Component: ${suspectComponent}
User notes on applied fixes: "${notes}"
Follow-up screenshot text / OCR evidence:
"""
${extractedFollowUpText}
"""

Inspect the follow-up evidence. Compare it against the previous error state.
Determine:
1. status: "resolved" | "still_present" | "new_error" | "inconclusive"
2. confidence: number between 0.0 and 1.0
3. observations: list of 2-3 visual observations from the new screenshot
4. comparisonSummary: summary of what changed between states
5. nextSteps: 1-2 follow-up commands if needed

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

- **Meta Llama 3**: Governed by the Meta Llama 3 Community License. Downloaded and run locally via Ollama.
- **Tesseract.js**: Apache 2.0 License.
- **devdoctor-ai Codebase**: Apache 2.0 License.

---

## 6. Known Model Limitations

1. **Text-Only Core**: The standard `llama3:latest` model processes text tokens. It relies on Tesseract.js OCR to transcribe visual images into text tokens.
2. **Low-Contrast Screenshots**: Extremely low-contrast or illegible terminal fonts may produce partial OCR transcriptions. Users can review and adjust extracted text in the interactive editor prior to inference.
3. **Execution Safety**: Llama 3 output commands are recommendations only. devdoctor-ai strictly prevents automated shell execution.
