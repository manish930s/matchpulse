# Coding Patterns Reference

This document highlights the core architectural patterns followed in MatchPulse.

## 1. API Route Pipeline Pattern
All server-side endpoints in MatchPulse strictly follow a 6-stage pipeline:

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Parse JSON body
    const body = await request.json();

    // 2. Validate at runtime using Zod
    const validated = Schema.parse(body);

    // 3. Fast-path check (e.g. match already finished)
    if (isCompleted(validated)) {
      return NextResponse.json({ data: createCompletedResult(validated), status: 200 });
    }

    // 4. Compute deterministic mathematical facts (do not let AI calculate arithmetic)
    const stats = calculateStats(validated);

    // 5. Query external AI model with structured schema
    const result = await callGeminiWithGroundTruth(validated, stats);

    // 6. Validate and return final JSON response
    return NextResponse.json({ data: result, status: 200 });
  } catch (error) {
    // Structured error handling (400 validation, 429 rate-limiting, 500 fallback)
    return handleRouteError(error);
  }
}
```

## 2. Deterministic Separation Pattern
Never prompt the Large Language Model to perform arithmetic (such as dividing runs needed by overs remaining).
- All numbers are precomputed in `lib/cricket.ts` using pure functions.
- The precalculated numbers are injected into the prompt as Ground Truth.
- The LLM is instructed: *"Use the provided numbers EXACTLY — do not recompute or contradict them."*

## 3. UI Component Pattern
Interactive client components adhere to:
- Mobile-first dark theme constraints.
- Real-time validation without requiring button clicks.
- Semantic HTML and unique `data-testid` attributes for Playwright E2E automation.
- `React.memo` wrapping on pure display cards to eliminate unnecessary re-renders.
- Dynamic imports (`next/dynamic`) for secondary tabs like `WhatIfPanel`.

## 4. Property-Based Testing Pattern
To prevent regressions across infinite cricket situations, `fast-check` tests verify mathematical invariants:
- Required Run Rate (RRR) is never negative.
- Balls remaining is strictly within `0` and `totalOvers * 6`.
- Resource remaining is bounded in `[0, 1]`.
- Parsers satisfy the round-trip property: `parse(serialize(parse(input))) === parse(input)`.
