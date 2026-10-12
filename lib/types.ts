import { z } from 'zod';

/**
 * Validation schema for match situation input.
 */
export const MatchSituationSchema = z
  .object({
    battingTeam: z.string().min(1, 'Batting team is required').max(50, 'Batting team max 50 characters'),
    bowlingTeam: z.string().min(1, 'Bowling team is required').max(50, 'Bowling team max 50 characters'),
    score: z.number().int('Score must be an integer').min(0, 'Score cannot be negative').max(999, 'Score max 999'),
    wickets: z.number().int('Wickets must be an integer').min(0, 'Wickets must be 0-10').max(10, 'Wickets must be 0-10'),
    oversCompleted: z.number().min(0, 'Overs completed cannot be negative').max(999.5, 'Overs completed max 999.5'),
    totalOvers: z.number().int('Total overs must be an integer').min(1, 'Total overs must be at least 1').max(999, 'Total overs max 999'),
    target: z.number().int('Target must be an integer').min(1, 'Target must be at least 1').max(999, 'Target max 999').optional(),
    language: z.enum(['hinglish', 'english']).default('hinglish').optional(),
  })
  .superRefine((data, ctx) => {
    // Overs completed cannot exceed total overs
    if (data.oversCompleted > data.totalOvers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['oversCompleted'],
        message: 'Overs completed cannot exceed total overs',
      });
    }

    // Decimal overs check: e.g. 14.3 -> balls = 3 (0-5 balls allowed)
    const oversDecimal = Number((data.oversCompleted % 1).toFixed(1));
    const balls = Math.round(oversDecimal * 10);
    if (balls > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['oversCompleted'],
        message: 'Balls must be between 0 and 5 (e.g., 14.3 for 14 overs 3 balls)',
      });
    }
  });

export type MatchSituation = z.infer<typeof MatchSituationSchema>;

/**
 * Validation schema for AI-generated Match Explanation card.
 */
export const ExplanationSchema = z.object({
  situation: z.string().min(10).max(500),
  keyNumber: z.string(), // "RRR 8.4 | 42 needed off 27 balls"
  actions: z.array(z.string()).length(3), // Batting strategies
  bowlingPlan: z.array(z.string()).length(2), // Bowling strategies
  winProbability: z.number().int().min(0).max(100),
  probabilityReason: z.string().min(20).max(200),
  watchFor: z.array(z.string()).min(2).max(3), // Key aspects next 5 overs
  language: z.enum(['hinglish', 'english']),
  disclaimer: z.string().default('AI estimate — not a prediction'),
});

export type Explanation = z.infer<typeof ExplanationSchema>;

/**
 * Validation schema for playoff what-if scenarios.
 */
export const WhatIfRequestSchema = z.object({
  scenario: z.string().min(1, 'Scenario is required').max(500, 'Scenario max 500 characters'),
  standings: z.string().min(1, 'Standings table is required').max(5000, 'Standings max 5000 characters'),
  language: z.enum(['hinglish', 'english']).default('hinglish'),
});

export type WhatIfRequest = z.infer<typeof WhatIfRequestSchema>;

export const WhatIfResponseSchema = z.object({
  explanation: z.string().min(10),
  scenarios: z.array(z.string()).min(1),
  language: z.enum(['hinglish', 'english']),
});

export type WhatIfResponse = z.infer<typeof WhatIfResponseSchema>;

/**
 * Live Match option item for match selector
 */
export interface LiveMatchOption {
  id: string;
  name: string;
  status: string;
  battingTeam: string;
  bowlingTeam: string;
  score: number;
  wickets: number;
  oversCompleted: number;
  totalOvers: number;
  target?: number;
  isChase: boolean;
}

/**
 * API Standard Response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  retryAfter?: number;
}
