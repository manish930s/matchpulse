import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { 
  calculateBallsRemaining, 
  calculateRRR, 
  calculateCurrentRR,
  calculateResourceRemaining,
  parseDecimalOvers,
  calculateCricketStats
} from '@/lib/cricket';

describe('Cricket Calculator', () => {
  // Property-based tests
  test('RRR is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999 }),
        fc.integer({ min: 0, max: 998 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(19.5), noNaN: true }),
        fc.integer({ min: 1, max: 20 }),
        (target, score, oversCompleted, totalOvers) => {
          fc.pre(score < target && oversCompleted < totalOvers);
          const rrr = calculateRRR(target, score, oversCompleted, totalOvers);
          expect(rrr).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('Balls remaining is always 0 to totalOvers*6', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.float({ min: 0, max: 50, noNaN: true }),
        (totalOvers, oversCompleted) => {
          fc.pre(oversCompleted <= totalOvers);
          const balls = calculateBallsRemaining(oversCompleted, totalOvers);
          expect(balls).toBeGreaterThanOrEqual(0);
          expect(balls).toBeLessThanOrEqual(totalOvers * 6);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('Current RR is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
        (score, oversCompleted) => {
          const rr = calculateCurrentRR(score, oversCompleted);
          expect(rr).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 1000 }
    );
  });

  test('Resource remaining is between 0 and 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.float({ min: 0, max: 20, noNaN: true }),
        fc.integer({ min: 1, max: 20 }),
        (wickets, oversCompleted, totalOvers) => {
          fc.pre(oversCompleted <= totalOvers);
          const resource = calculateResourceRemaining(wickets, oversCompleted, totalOvers);
          expect(resource).toBeGreaterThanOrEqual(0);
          expect(resource).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 1000 }
    );
  });

  // Edge case tests
  test('Division by zero: overs = 0 returns RR = 0', () => {
    expect(calculateCurrentRR(50, 0)).toBe(0);
  });

  test('Division by zero: balls remaining = 0 returns RRR = 0', () => {
    expect(calculateRRR(200, 150, 20, 20)).toBe(0);
  });

  test('Decimal overs: 14.3 = 14 overs 3 balls', () => {
    const balls = calculateBallsRemaining(14.3, 20);
    expect(balls).toBe((20 * 6) - (14 * 6) - 3);
  });

  test('Tight chase: 42 needed off 27 balls (15.3 overs completed in 20 ov match)', () => {
    const rrr = calculateRRR(195, 153, 15.3, 20);
    expect(rrr).toBeCloseTo(9.33, 1);
  });

  test('Tight chase at 14.3 overs: 42 needed off 33 balls', () => {
    const rrr = calculateRRR(195, 153, 14.3, 20);
    expect(rrr).toBeCloseTo(7.64, 1);
  });

  test('parseDecimalOvers parses correctly', () => {
    expect(parseDecimalOvers(14.3)).toEqual({ overs: 14, balls: 3 });
    expect(parseDecimalOvers(0)).toEqual({ overs: 0, balls: 0 });
    expect(() => parseDecimalOvers(-1)).toThrow();
    expect(() => parseDecimalOvers(14.7)).toThrow('Balls must be 0-5');
  });

  test('calculateCricketStats returns comprehensive stats', () => {
    const stats = calculateCricketStats({
      score: 153,
      wickets: 5,
      oversCompleted: 14.3,
      totalOvers: 20,
      target: 195,
    });
    expect(stats.isChase).toBe(true);
    expect(stats.runsNeeded).toBe(42);
    expect(stats.ballsRemaining).toBe(33);
    expect(stats.wicketsLeft).toBe(5);
    expect(stats.rrr).toBeGreaterThan(0);
    expect(stats.currentRR).toBeGreaterThan(0);
    expect(stats.resourceLeft).toBeGreaterThanOrEqual(0);
  });
});
