import { BALLS_PER_OVER } from './constants';

/**
 * Parses decimal overs format (e.g. 14.3 -> 14 overs and 3 balls).
 *
 * @param oversCompleted Decimal overs format (e.g. 14.3)
 * @returns Object with full overs and extra balls
 * @throws Error if overs is negative or balls > 5
 */
export function parseDecimalOvers(oversCompleted: number): { overs: number; balls: number } {
  if (oversCompleted < 0) {
    throw new Error('Overs cannot be negative');
  }
  const overs = Math.floor(oversCompleted);
  const fraction = Number((oversCompleted % 1).toFixed(1));
  const balls = Math.round(fraction * 10);

  if (balls > 5) {
    throw new Error('Balls must be 0-5');
  }
  return { overs, balls };
}

/**
 * Calculate balls remaining in an innings.
 *
 * @param oversCompleted Overs completed in decimal format (e.g. 14.3 = 14 overs 3 balls)
 * @param totalOvers Total overs in the innings
 * @returns Number of balls remaining (0 to totalOvers * 6)
 *
 * @example
 * calculateBallsRemaining(14.3, 20) // Returns 33
 * // Calculation: (20*6) - (14*6) - 3 = 120 - 84 - 3 = 33
 */
export function calculateBallsRemaining(
  oversCompleted: number,
  totalOvers: number
): number {
  if (totalOvers <= 0) return 0;
  if (oversCompleted >= totalOvers) return 0;

  const fullOvers = Math.floor(oversCompleted);
  // Get decimal portion: for 14.3 => 0.3 => 3 balls
  const fraction = Number((oversCompleted % 1).toFixed(1));
  const balls = Math.min(5, Math.max(0, Math.round(fraction * 10)));

  const completedBalls = fullOvers * BALLS_PER_OVER + balls;
  const totalBalls = totalOvers * BALLS_PER_OVER;

  return Math.max(0, Math.min(totalBalls, totalBalls - completedBalls));
}

/**
 * Calculate runs needed for a chase.
 *
 * @param target Target runs to win
 * @param score Current score of batting team
 * @returns Runs needed (integer >= 0)
 */
export function calculateRunsNeeded(target: number, score: number): number {
  return Math.max(0, target - score);
}

/**
 * Calculate Required Run Rate (RRR).
 *
 * @param target Target score
 * @param score Current score
 * @param oversCompleted Overs completed
 * @param totalOvers Total overs in the match
 * @returns Required run rate rounded to 2 decimal places, or 0 if chase complete or balls expired
 */
export function calculateRRR(
  target: number,
  score: number,
  oversCompleted: number,
  totalOvers: number
): number {
  const runsNeeded = calculateRunsNeeded(target, score);
  const ballsRemaining = calculateBallsRemaining(oversCompleted, totalOvers);

  if (runsNeeded <= 0 || ballsRemaining <= 0) {
    return 0;
  }

  const rrr = runsNeeded / (ballsRemaining / BALLS_PER_OVER);
  return Number(rrr.toFixed(2));
}

/**
 * Calculate Current Run Rate (CRR).
 *
 * @param score Current score
 * @param oversCompleted Overs completed in decimal format (e.g. 14.3)
 * @returns Current run rate rounded to 2 decimal places, or 0 if overs <= 0
 */
export function calculateCurrentRR(score: number, oversCompleted: number): number {
  if (oversCompleted <= 0 || score <= 0) {
    return 0;
  }

  const fullOvers = Math.floor(oversCompleted);
  const fraction = Number((oversCompleted % 1).toFixed(1));
  const balls = Math.min(5, Math.max(0, Math.round(fraction * 10)));
  const actualOvers = fullOvers + balls / BALLS_PER_OVER;

  if (actualOvers <= 0) return 0;

  const crr = score / actualOvers;
  return Number(crr.toFixed(2));
}

/**
 * Calculate resource remaining metric (heuristic between 0 and 1).
 *
 * @param wickets Wickets lost (0-10)
 * @param oversCompleted Overs completed
 * @param totalOvers Total overs in the innings
 * @returns Value between 0 and 1
 */
export function calculateResourceRemaining(
  wickets: number,
  oversCompleted: number,
  totalOvers: number
): number {
  if (totalOvers <= 0) return 0;
  const wicketsLeft = Math.max(0, 10 - wickets);
  const ballsRemaining = calculateBallsRemaining(oversCompleted, totalOvers);
  const totalBalls = totalOvers * BALLS_PER_OVER;

  if (totalBalls <= 0) return 0;

  const resource = (wicketsLeft / 10) * (ballsRemaining / totalBalls);
  return Math.max(0, Math.min(1, Number(resource.toFixed(3))));
}

/**
 * Compute all deterministic cricket stats for a match situation.
 */
export function calculateCricketStats(situation: {
  score: number;
  wickets: number;
  oversCompleted: number;
  totalOvers: number;
  target?: number;
}) {
  const isChase = situation.target !== undefined && situation.target > 0;
  const ballsRemaining = calculateBallsRemaining(situation.oversCompleted, situation.totalOvers);
  const runsNeeded = isChase ? calculateRunsNeeded(situation.target!, situation.score) : 0;
  const rrr = isChase ? calculateRRR(situation.target!, situation.score, situation.oversCompleted, situation.totalOvers) : 0;
  const currentRR = calculateCurrentRR(situation.score, situation.oversCompleted);
  const wicketsLeft = Math.max(0, 10 - situation.wickets);
  const resourceLeft = calculateResourceRemaining(situation.wickets, situation.oversCompleted, situation.totalOvers);

  return {
    isChase,
    ballsRemaining,
    runsNeeded,
    rrr,
    currentRR,
    wicketsLeft,
    resourceLeft,
  };
}
