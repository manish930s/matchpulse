import { GoogleGenerativeAI } from '@google/generative-ai';
import { MatchSituation, Explanation, ExplanationSchema, WhatIfRequest, WhatIfResponse, WhatIfResponseSchema } from './types';
import { GEMINI_TIMEOUT_MS } from './constants';
import { calculateCricketStats } from './cricket';

/**
 * System instruction given to Gemini model.
 */
export const SYSTEM_INSTRUCTION = `You are a cricket-savvy friend explaining a live match to a casual Indian fan on WhatsApp.
You are given deterministic match numbers — use them EXACTLY, never recompute or contradict them.
Write like a knowledgeable friend on WhatsApp, not an overly formal television commentator.
If information is missing or ambiguous (rain/DLS, super over), state that explicitly.
You MUST output ONLY a valid JSON object matching the requested schema. No markdown formatting outside JSON.`;

/**
 * Builds the user prompt with deterministic ground truth and few-shot examples.
 */
export function buildExplainPrompt(
  situation: MatchSituation,
  stats: ReturnType<typeof calculateCricketStats>,
  language: 'hinglish' | 'english' = 'hinglish'
): string {
  const isChase = stats.isChase;

  return `Match Situation:
- Batting Team: ${situation.battingTeam}
- Bowling Team: ${situation.bowlingTeam}
- Current Score: ${situation.score}/${situation.wickets} in ${situation.oversCompleted} overs
- Target: ${situation.target ? `${situation.target} runs in ${situation.totalOvers} overs` : `First innings (Total ${situation.totalOvers} overs)`}
- Chase: ${isChase ? 'Yes' : 'No'}

Computed Ground Truth Numbers (USE THESE EXACTLY — DO NOT RECOMPUTE):
- Runs Needed: ${isChase ? stats.runsNeeded : 'N/A (Batting 1st)'}
- Balls Remaining: ${stats.ballsRemaining}
- Required Run Rate: ${isChase ? stats.rrr.toFixed(2) : 'N/A'}
- Current Run Rate: ${stats.currentRR.toFixed(2)}
- Wickets Left: ${stats.wicketsLeft}
- Resource Remaining: ${stats.resourceLeft.toFixed(3)}

Few-Shot Reference Examples:

Example 1 (Tight Chase - Hinglish):
Input: Runs Needed 42, Balls Remaining 27, Wickets Left 5, RRR 9.33
Output JSON:
{
  "situation": "Ye match ka turning point hai — India ko 42 runs aur chahiye 27 balls me, lekin sirf 5 wickets baaki hain.",
  "keyNumber": "RRR 9.33 | 42 needed off 27 balls",
  "actions": [
    "Har over me kam se kam 9-10 runs banao — boundaries zaroori hain",
    "Death overs ke liye wickets bachao, agar 2-3 wickets gaye to mushkil ho jaayega",
    "Next 3 overs me 25-27 runs ka target rakho"
  ],
  "bowlingPlan": [
    "Wide yorkers aur slower balls use karo — boundaries rokne ke liye",
    "Slip/backward point mein fielders rakho, batsmen pressure me risky shots khel sakte hain"
  ],
  "winProbability": 45,
  "probabilityReason": "Resource remaining is moderate but required run rate is high. Match is evenly poised.",
  "watchFor": [
    "Agar next over me 15+ runs aaye to momentum shift ho sakta hai",
    "Spin bowlers ki spell — batting easy ya tough hogi",
    "Death overs ke specialists ka impact"
  ],
  "language": "hinglish",
  "disclaimer": "AI estimate — not a prediction"
}

Example 2 (Comfortable Defend - English):
Input: 195/4 in 20 overs, opposition needs RR 9.75
Output JSON:
{
  "situation": "A strong total of 195 with only 4 wickets lost. The bowling side has a comfortable cushion of 25-30 runs above par.",
  "keyNumber": "195/4 in 20 overs | Opposition needs RR 9.75",
  "actions": [
    "Take early wickets in the powerplay — 2-3 wickets in first 6 overs will break their back",
    "Bowl tight lines in middle overs — keep RR under 8 to build pressure",
    "Use your best bowlers in overs 16-20 when they need 60+ runs"
  ],
  "bowlingPlan": [
    "Use pace and bounce in powerplay, then spin in middle overs",
    "Set defensive fields after 15 overs — protect boundaries, force singles"
  ],
  "winProbability": 75,
  "probabilityReason": "Strong total with wickets in hand. Opposition needs very high run rate from the start.",
  "watchFor": [
    "First 6 overs — if opposition scores 55+, they're in the game",
    "How spin bowlers perform in middle overs",
    "Death bowling execution in final 4 overs"
  ],
  "language": "english",
  "disclaimer": "AI estimate — not a prediction"
}

Language Instruction:
${
  language === 'hinglish'
    ? "Write EVERYTHING in natural Hinglish (Hindi words in Roman script mixed with conversational English), e.g., 'RRR 8.4 hai — abhi middle overs me spin aayega, ye tough phase hai.'"
    : "Write EVERYTHING in simple, conversational English suitable for a casual cricket fan."
}

Generate the JSON for this situation now. Return ONLY raw valid JSON:`;
}

/**
 * Mock generator for development or fallback when GEMINI_API_KEY is not configured.
 */
function getMockExplanation(situation: MatchSituation, stats: ReturnType<typeof calculateCricketStats>, language: 'hinglish' | 'english'): Explanation {
  const isChase = stats.isChase;
  const winProb = isChase
    ? Math.min(95, Math.max(5, Math.round(50 + (10 - stats.rrr) * 4 + stats.wicketsLeft * 3)))
    : Math.min(90, Math.max(10, Math.round(40 + stats.currentRR * 5)));

  if (language === 'hinglish') {
    return {
      situation: isChase
        ? `${situation.battingTeam} ko jeetne ke liye ${stats.runsNeeded} runs chahiye ${stats.ballsRemaining} balls me, ${stats.wicketsLeft} wickets bache hain.`
        : `${situation.battingTeam} ne ${situation.score}/${situation.wickets} banaye hain ${situation.oversCompleted} overs me. Abhi innings chal rahi hai.`,
      keyNumber: isChase
        ? `RRR ${stats.rrr.toFixed(2)} | ${stats.runsNeeded} needed off ${stats.ballsRemaining} balls`
        : `CRR ${stats.currentRR.toFixed(2)} | Projected ${Math.round(stats.currentRR * situation.totalOvers)}`,
      actions: [
        'Strike rotate karte raho aur dot balls minimize karo',
        'Har over me ek boundary target karo boundary pressure hatane ke liye',
        'Set batsman ko deep le jaana hoga, wicket throw mat karo',
      ],
      bowlingPlan: [
        'Tight yorkers aur change of pace use karo',
        'Fielders boundary pe deep spread rakho aur singles protect karo',
      ],
      winProbability: winProb,
      probabilityReason: isChase
        ? `RRR ${stats.rrr.toFixed(2)} hai aur ${stats.wicketsLeft} wickets hath me hain. Target attainable hai par discipline zaroori hai.`
        : `Current run rate ${stats.currentRR.toFixed(2)} decent hai, wickets bacha ke death overs me attack karna hoga.`,
      watchFor: [
        'Agla over bohot crucial hai momentum ke liye',
        'Death bowlers ka spell match decide karega',
      ],
      language: 'hinglish',
      disclaimer: 'AI estimate — not a prediction',
    };
  }

  return {
    situation: isChase
      ? `${situation.battingTeam} needs ${stats.runsNeeded} runs from ${stats.ballsRemaining} balls with ${stats.wicketsLeft} wickets remaining.`
      : `${situation.battingTeam} is currently at ${situation.score}/${situation.wickets} after ${situation.oversCompleted} overs.`,
    keyNumber: isChase
      ? `RRR ${stats.rrr.toFixed(2)} | ${stats.runsNeeded} off ${stats.ballsRemaining} balls`
      : `CRR ${stats.currentRR.toFixed(2)} | Projecting ${Math.round(stats.currentRR * situation.totalOvers)}`,
    actions: [
      'Rotate strike actively and minimize dot-ball percentage',
      'Target at least one boundary per over to keep RRR in check',
      'The set batter must anchor the innings through the final overs',
    ],
    bowlingPlan: [
      'Nail wide yorkers and mix in slower off-cutters',
      'Set boundary-rider fields to prevent clean lofted strokes',
    ],
    winProbability: winProb,
    probabilityReason: isChase
      ? `With an RRR of ${stats.rrr.toFixed(2)} and ${stats.wicketsLeft} wickets left, the match is delicately poised.`
      : `Solid scoring rate of ${stats.currentRR.toFixed(2)} puts pressure on the bowling side.`,
    watchFor: [
      'The next over is the primary momentum pivot',
      'Execution of death yorkers vs batter range hitting',
    ],
    language: 'english',
    disclaimer: 'AI estimate — not a prediction',
  };
}

/**
 * Execute Gemini API call with timeout and retry logic.
 */
export async function generateExplanation(
  situation: MatchSituation,
  language: 'hinglish' | 'english' = 'hinglish'
): Promise<Explanation> {
  const stats = calculateCricketStats(situation);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Graceful mock mode during initial testing or without key
    return getMockExplanation(situation, stats, language);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const prompt = buildExplainPrompt(situation, stats, language);

  const callModelWithTimeout = async (promptText: string): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const result = await model.generateContent(promptText);
      const response = await result.response;
      return response.text();
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    const rawText = await callModelWithTimeout(prompt);
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Retry once on parse failure with strict constraint
      const retryText = await callModelWithTimeout(
        prompt + '\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown formatting, no commentary.'
      );
      parsed = JSON.parse(retryText);
    }

    const validated = ExplanationSchema.parse(parsed);

    // Sanity-check win probability range
    validated.winProbability = Math.max(0, Math.min(100, Math.round(validated.winProbability)));
    return validated;
  } catch (error) {
    // If rate limit (429)
    if (error instanceof Error && error.message.includes('429')) {
      throw error;
    }
    // Fall back to deterministic fallback if external AI fails
    console.error('[GEMINI_EXPLAIN_ERROR]', error);
    return getMockExplanation(situation, stats, language);
  }
}

/**
 * Playoff What-If generator.
 */
export async function generateWhatIfExplanation(
  request: WhatIfRequest
): Promise<WhatIfResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    if (request.language === 'hinglish') {
      return {
        explanation: `Agar ye scenario hota hai to points table me kaafi badlaav aayega. Top 4 race bohot interesting ho jaayegi aur NRR decisive factor banega.`,
        scenarios: [
          'Jeetne wali team playoffs ke bohot kareeb pahunch jaayegi (+2 points)',
          'Dusri teams ko apne baaki bache matches bade margin se jeetne honge NRR boost ke liye',
          'Agar ties hote hain toh Net Run Rate (NRR) direct qualification decide karega',
        ],
        language: 'hinglish',
      };
    }
    return {
      explanation: `If this scenario occurs, the playoff standings tighten significantly. The qualification race will hinge closely on margins and Net Run Rate (NRR).`,
      scenarios: [
        'The winning team solidifies their top 4 position with 2 valuable points',
        'Contenders will need to win remaining fixtures with decisive margins to protect NRR',
        'Any tie on points will be broken strictly by net run rate differentials',
      ],
      language: 'english',
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are a cricket points table analyst. Given a points table and a playoff 'What-If' scenario question, explain the mathematical qualification possibilities in a friendly, conversational WhatsApp tone.
Output ONLY JSON matching: { "explanation": string, "scenarios": string[], "language": string }`,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const prompt = `Standings Table:
${request.standings}

Scenario Question:
${request.scenario}

Language:
${request.language === 'hinglish' ? 'Hinglish (conversational Hindi in Roman script mixed with English)' : 'Simple English'}

Explain clearly what happens, how points change, and 3 key qualification implications. Return valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return WhatIfResponseSchema.parse({
      ...parsed,
      language: request.language,
    });
  } catch (error) {
    console.error('[GEMINI_WHATIF_ERROR]', error);
    return {
      explanation: request.language === 'hinglish' 
        ? 'Points table ke hisaab se ye scenario teams ke liye decisive hai. NRR aur aane wale matches pe qualify karna depend karega.'
        : 'Based on the points table, this outcome dramatically affects the race for the top 4 playoffs.',
      scenarios: [
        request.language === 'hinglish' ? 'Jeetne wali team direct contention me aayegi' : 'The winning side gains a vital edge in points',
        request.language === 'hinglish' ? 'Net Run Rate ties me decide karega' : 'NRR will serve as the primary tiebreaker',
      ],
      language: request.language,
    };
  }
}
