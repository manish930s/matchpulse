# MatchPulse 🏏 — "Ab Kya Hoga?"

An AI-powered live cricket explainer web application that translates complex match statistics and chase math into plain Hinglish or English shareable WhatsApp-style cards in under 5 seconds.

---

## 🎯 Problem Statement

During live cricket matches, fans constantly ask one question at moments of high tension: **"Ab kya hoga?"** (Can we still win? What does the batting side need to do?). Today, fans typically leave their streaming or fantasy apps to search Google, Reddit, or YouTube comments for tactical context — often missing the live ball in the process.

**MatchPulse** closes this engagement loop: fans enter (or auto-fetch) the live situation and immediately receive a conversational WhatsApp-style card outlining the exact chase dynamic, 3 batting actions, 2 bowling strategies, an AI-calculated win probability gauge, and key moments to watch over the next 5 overs. A Playoff What-If mode decodes qualification mathematics from pasted points tables.

---

## ⚡ Tech Stack

- **Framework**: Next.js 14+ (App Router) + TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Dark Pitch Theme `#121212`, Pitch-Green `#00d26a`)
- **AI Engine**: Google Gemini API (`gemini-2.0-flash` with JSON Structured Outputs)
- **Validation**: Zod schema validation at all API boundaries
- **Testing**: Vitest (Unit & Integration), fast-check (Property-Based Testing), Playwright (E2E)
- **Live Scores**: CricAPI (`currentMatches` server proxy)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Tested on Node.js 24)
- npm or pnpm
- Google Gemini API Key (Free tier from [Google AI Studio](https://aistudio.google.com/))
- Optional CricAPI Key ([cricapi.com](https://cricapi.com/))

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd matchpulse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your Gemini API Key in `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   CRICAPI_KEY=your_cricapi_key_here_optional
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

MatchPulse includes full test coverage across pure cricket arithmetic, schema parsing, API route handlers, and end-to-end flows.

- **Unit & Integration Tests**:
  ```bash
  npm test
  ```
- **Watch Mode**:
  ```bash
  npm run test:watch
  ```
- **Property-Based Testing**:
  Verifies mathematical invariants (RRR >= 0, Balls remaining bounds, resource conservation) over 1000 randomized test cases with `fast-check`.
- **E2E Tests** (Playwright):
  ```bash
  npm run test:e2e
  ```

---

## 📦 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. Set the Root Directory to `matchpulse` (if deploying from monorepo) or root.
4. Add the `GEMINI_API_KEY` (and optional `CRICAPI_KEY`) under Environment Variables.
5. Click **Deploy**.

---

## 🏆 Dream11 FDE Submission Note

> "Fans constantly ask one question during a live match: 'Ab kya hoga?' — can we still win, what does the team need? They switch to Google or comment sections and miss the moment. MatchPulse answers it instantly: enter (or auto-fetch) the live match situation and get a simple Hinglish explanation of the scenario, what each side must do, an AI-estimated win chance, and what to watch next — rendered as a shareable WhatsApp-style card. A what-if mode explains playoff qualification scenarios, which no basic score app does. I built it as a single-page Next.js app, AI pair-programmed with Cursor/Antigravity, using the Gemini API for the reasoning layer with structured JSON outputs, deployed on Vercel. Core insight: fans don't want more stats, they want stats translated into plain language at the moment of tension. At Dream11, I'd extend this inside contest flows — personalised to the user's fantasy team — so fans never leave the app to understand the game."

---

## 📄 License
MIT
