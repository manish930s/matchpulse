import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { parseMatchSituation, formatShareText } from '@/lib/utils';
import { Explanation } from '@/lib/types';

describe('Round-trip property and formatting', () => {
  test('Parse → Serialize → Parse preserves data for valid inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          battingTeam: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          bowlingTeam: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          score: fc.integer({ min: 0, max: 999 }),
          wickets: fc.integer({ min: 0, max: 10 }),
          fullOvers: fc.integer({ min: 0, max: 49 }),
          extraBalls: fc.integer({ min: 0, max: 5 }),
          totalOvers: fc.integer({ min: 1, max: 50 }),
          target: fc.option(fc.integer({ min: 1, max: 999 }), { nil: undefined }),
        }),
        ({ battingTeam, bowlingTeam, score, wickets, fullOvers, extraBalls, totalOvers, target }) => {
          const oversCompleted = fullOvers + extraBalls / 10;
          fc.pre(oversCompleted <= totalOvers);

          const input = {
            battingTeam,
            bowlingTeam,
            score,
            wickets,
            oversCompleted,
            totalOvers,
            target,
          };

          const parsed = parseMatchSituation(input);
          const serialized = JSON.stringify(parsed);
          const reparsed = parseMatchSituation(JSON.parse(serialized));

          expect(reparsed.battingTeam).toBe(parsed.battingTeam);
          expect(reparsed.bowlingTeam).toBe(parsed.bowlingTeam);
          expect(reparsed.score).toBe(parsed.score);
          expect(reparsed.wickets).toBe(parsed.wickets);
          expect(reparsed.oversCompleted).toBeCloseTo(parsed.oversCompleted, 1);
          expect(reparsed.totalOvers).toBe(parsed.totalOvers);
          expect(reparsed.target).toBe(parsed.target);
        }
      ),
      { numRuns: 500 }
    );
  });

  test('formatShareText formats properly for WhatsApp', () => {
    const mockExplanation: Explanation = {
      situation: 'Ye match ka turning point hai — India ko 42 runs aur chahiye 27 balls me.',
      keyNumber: 'RRR 9.33 | 42 needed off 27 balls',
      actions: [
        'Har over me kam se kam 9-10 runs banao',
        'Death overs ke liye wickets bachao',
        'Next 3 overs me 25-27 runs ka target rakho',
      ],
      bowlingPlan: [
        'Wide yorkers aur slower balls use karo',
        'Slip/backward point mein fielders rakho',
      ],
      winProbability: 45,
      probabilityReason: 'Resource remaining is moderate but required run rate is high.',
      watchFor: [
        'Agar next over me 15+ runs aaye to momentum shift ho sakta hai',
        'Spin bowlers ki spell',
      ],
      language: 'hinglish',
      disclaimer: 'AI estimate — not a prediction',
    };

    const shareText = formatShareText(mockExplanation);
    expect(shareText).toContain('MatchPulse Analysis');
    expect(shareText).toContain('42 needed off 27 balls');
    expect(shareText).toContain('Batting Actions:');
    expect(shareText).toContain('Bowling Plan:');
    expect(shareText).toContain('Win Probability: 45%');
    expect(shareText).toContain('AI estimate — not a prediction');
  });
});
