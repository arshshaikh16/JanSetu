# JanSetu: Public Rights, Policy Translation & Fact-Verification Commons

JanSetu is a full-stack public-interest digital governance platform built for Track 1 (Civic Pulse, Digital Governance & Public Information). It bridges the literacy, language, and legal information gap for everyday citizens including small farmers, street vendors, daily-wage workers, women self-help group artisans, students, and senior citizens (70+).

---

## 1. Prerequisites & Environment Setup

- **Runtime**: Node.js 20+ and npm
- **Environment Variables**: Copy `.env.example` to `.env` and set your Gemini API key:
  ```bash
  cp .env.example .env
  ```
  - `GEMINI_API_KEY`: Server-side API key for `@google/genai` (`gemini-3.8-flash`, `gemini-flash-latest`, and `gemini-3.8-flash-lite-tts`).
  - `APP_URL`: Optional base URL for deployment.
  - **Resilient Fallback Mode**: If `GEMINI_API_KEY` is omitted or quota-limited, all endpoints automatically fall back to the deterministic statutory rule engine (`src/utils/civicLogic.ts`) and live public APIs (`en.wikipedia.org/w/api.php`, `api.open-meteo.com`, `api.worldbank.org`), ensuring 100% uptime and zero blank screens.

---

## 2. Installation, Running & Building Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the full-stack Express + Vite server (Port 3000)**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
3. **Production build & verification**:
   ```bash
   npm run build
   npm start
   ```

---

## 3. Running Automated Tests

Run the deterministic unit test suite (`node:test` via `tsx`) verifying the 100-point entitlement engine, 70+ universal Ayushman Bharat rule, environmental SLA escalation, Section 6(1) RTI generator, phishing heuristic detector, and cryptographic receipt hashing:

```bash
npx tsx --test src/utils/civicLogic.test.ts
```

---

## 4. Architecture & Backend API Endpoints (`server.ts`)

- `GET /api/civic/live-pulse`: Fetches real-time municipal meteorological and US AQI telemetry (`api.open-meteo.com`) alongside live India macro-development series (`api.worldbank.org`).
- `POST /api/civic/explain-document`: Multimodal circular and notice translator powered by `gemini-3.8-flash` (with `ThinkingLevel.HIGH` and strict JSON `responseSchema`), supporting both *Simple Everyday Words* and *Detailed Legal Clauses*.
- `POST /api/civic/fact-check`: Two-stage SatyaShield misinformation and phishing auditor combining deterministic URL/urgency heuristics (`evaluateClaimCredibilityHeuristics`), live MediaWiki statutory queries (`en.wikipedia.org/w/api.php`), and Google Search Grounding (`tools: [{ googleSearch: {} }]`).
- `POST /api/civic/chat`: Multi-turn civic and legal companion supporting three specialized system personas (*Gram & Ward Sahayak*, *Constitutional & RTI Legal Counsel*, *Forensic Rumor & Scam Auditor*), adjustable reasoning depth (`LOW`, `MEDIUM`, `HIGH`), and inline image analysis.
- `POST /api/civic/tts`: Server-side neural speech synthesis using `gemini-3.8-flash-lite-tts` (`Kore` voice, 24kHz WAV) with automatic client-side `window.speechSynthesis` fallback across 5 Indian languages (`en-IN`, `hi-IN`, `ta-IN`, `bn-IN`, `te-IN`).

---

## 5. Privacy, Ephemeral Storage & Known Limitations

- **Zero Persistent PII Storage**: Uploaded notice photos and household demographic sliders are processed ephemerally in RAM and never persisted to an external database. Client-side images are sanitized and downscaled on an offscreen HTML5 canvas (`<= 1200px` JPEG) before transmission.
- **Known Limitations**:
  - Statutory RTI Section 6(1) drafts and scheme eligibility matches are informational and administrative tools; formal filing still occurs on the respective `.gov.in` portal or via physical submission to the Public Information Officer (PIO).
  - Browser voice dictation (`SpeechRecognition` / `webkitSpeechRecognition`) requires a browser supporting the Web Speech API; in unsupported browsers or sandboxed iFrames, the voice button gracefully loads a sample citizen query into the composer.
