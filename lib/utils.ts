import { MatchSituation, MatchSituationSchema, Explanation } from './types';

/**
 * Parses and validates match situation using Zod schema.
 */
export function parseMatchSituation(input: unknown): MatchSituation {
  return MatchSituationSchema.parse(input);
}

/**
 * Formats an Explanation into a clean, shareable plain text WhatsApp message.
 */
export function formatShareText(explanation: Explanation): string {
  const actionsList = explanation.actions.map((a, i) => `${i + 1}. ${a}`).join('\n');
  const bowlingList = explanation.bowlingPlan.map((b, i) => `${i + 1}. ${b}`).join('\n');
  const watchList = explanation.watchFor.map((w, i) => `${i + 1}. ${w}`).join('\n');

  return `🏏 MatchPulse Analysis

Situation: ${explanation.situation}
Key Number: ${explanation.keyNumber}

Batting Actions:
${actionsList}

Bowling Plan:
${bowlingList}

Win Probability: ${explanation.winProbability}%
${explanation.probabilityReason}

Watch For:
${watchList}

${explanation.disclaimer}`;
}
