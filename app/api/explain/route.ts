import { NextRequest, NextResponse } from 'next/server';
import { MatchSituationSchema, Explanation } from '@/lib/types';
import { calculateCricketStats } from '@/lib/cricket';
import { generateExplanation } from '@/lib/gemini';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate input schema
    const validationResult = MatchSituationSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json(
        { error: `Invalid input: ${firstError}`, status: 400 },
        { status: 400 }
      );
    }

    const situation = validationResult.data;
    const language = situation.language || 'hinglish';
    const isChase = situation.target !== undefined && situation.target > 0;
    const stats = calculateCricketStats(situation);

    // 2. Completed Match Fast-Path (returns immediately without AI call)
    // Case A: Chase completed (target achieved)
    if (isChase && situation.score >= situation.target!) {
      const wicketsLeft = 10 - situation.wickets;
      const completedExplanation: Explanation = {
        situation: language === 'hinglish'
          ? `Match khatam! ${situation.battingTeam} ne ${wicketsLeft} wickets se match jeet liya hai!`
          : `Match over! ${situation.battingTeam} has won by ${wicketsLeft} wickets!`,
        keyNumber: language === 'hinglish' ? 'Target achieved — Match Finished' : 'Target achieved — Won match',
        actions: [
          language === 'hinglish' ? 'Celebrations shuru — chase complete!' : 'Celebration time — clinical chase completed',
          language === 'hinglish' ? 'Presentation ceremony ka wait karo' : 'Await the post-match presentation',
          language === 'hinglish' ? 'Hero batsman ko Player of the Match milna chahiye' : 'Top performer in line for Player of the Match',
        ],
        bowlingPlan: [
          language === 'hinglish' ? 'Match khatam ho chuka hai' : 'Match has concluded',
          language === 'hinglish' ? 'Next match ki planning shuru karo' : 'Regroup and focus on the next fixture',
        ],
        winProbability: 100,
        probabilityReason: language === 'hinglish'
          ? `${situation.battingTeam} ne successfully target chase kar liya.`
          : `${situation.battingTeam} has completed the chase and won.`,
        watchFor: [
          language === 'hinglish' ? 'Post-match captain interviews' : 'Post-match captain interviews',
          language === 'hinglish' ? 'Player of the Match announcement' : 'Player of the match announcement',
        ],
        language,
        disclaimer: 'Match complete — final result',
      };

      return NextResponse.json({ data: completedExplanation, status: 200 }, { status: 200 });
    }

    // Case B: All 10 wickets down
    if (situation.wickets === 10) {
      const wonByRuns = isChase ? situation.target! - situation.score : 0;
      const completedExplanation: Explanation = {
        situation: language === 'hinglish'
          ? isChase
            ? `All out! ${situation.bowlingTeam} ne ${wonByRuns} runs se match jeet liya!`
            : `${situation.battingTeam} ki innings 10 wickets girne ke baad ${situation.score} runs par khatam ho gayi.`
          : isChase
            ? `All out! ${situation.bowlingTeam} won by ${wonByRuns} runs!`
            : `${situation.battingTeam}'s innings concluded all-out for ${situation.score} runs.`,
        keyNumber: isChase ? `${situation.bowlingTeam} won by ${wonByRuns} runs` : `All out: ${situation.score}/10 in ${situation.oversCompleted} ov`,
        actions: [
          language === 'hinglish' ? 'Innings khatam ho chuki hai' : 'Innings has ended',
          language === 'hinglish' ? 'Batting review aur debrief zaroori hai' : 'Debrief on shot selection and collapse',
          language === 'hinglish' ? 'Agli innings ya match par dhyan do' : 'Shift focus to upcoming phase/match',
        ],
        bowlingPlan: [
          language === 'hinglish' ? 'Bowling side ne saare 10 wickets nikaal liye!' : 'Bowlers executed clinical dismissals to clean up the tail',
          language === 'hinglish' ? 'Excellent bowling performance' : 'Excellent disciplined bowling effort',
        ],
        winProbability: isChase ? 0 : 50,
        probabilityReason: language === 'hinglish'
          ? 'Saare 10 wickets gir chuke hain, innings finish ho gayi.'
          : 'All 10 wickets have fallen, concluding the innings.',
        watchFor: [
          language === 'hinglish' ? 'Innings break analysis' : 'Innings break expert analysis',
          language === 'hinglish' ? 'Bowling scorecard and figures' : 'Bowler figures and economy rates',
        ],
        language,
        disclaimer: 'Innings complete',
      };

      return NextResponse.json({ data: completedExplanation, status: 200 }, { status: 200 });
    }

    // Case C: Overs completed in chase without reaching target
    if (isChase && situation.oversCompleted >= situation.totalOvers && situation.score < situation.target!) {
      const runsMargin = situation.target! - situation.score;
      const completedExplanation: Explanation = {
        situation: language === 'hinglish'
          ? `Overs khatam! ${situation.bowlingTeam} ne ye match ${runsMargin} runs se jeet liya.`
          : `Overs completed! ${situation.bowlingTeam} won by ${runsMargin} runs.`,
        keyNumber: `${situation.bowlingTeam} won by ${runsMargin} runs`,
        actions: [
          language === 'hinglish' ? 'Match khatam' : 'Match completed',
          language === 'hinglish' ? 'Chase short reh gaya' : 'Chase fell short of target',
          language === 'hinglish' ? 'Post-match debrief' : 'Post-match debrief',
        ],
        bowlingPlan: [
          language === 'hinglish' ? 'Bowlers ne match successfully defend kar liya' : 'Bowlers successfully defended the target',
          language === 'hinglish' ? 'Death bowling execution clutch rahi' : 'Death bowling discipline secured victory',
        ],
        winProbability: 0,
        probabilityReason: language === 'hinglish' ? 'Overs poore ho chuke hain.' : 'Full quota of overs completed.',
        watchFor: [
          language === 'hinglish' ? 'Final presentation' : 'Final trophy presentation',
          language === 'hinglish' ? 'Scorecard breakdown' : 'Scorecard breakdown',
        ],
        language,
        disclaimer: 'Match complete — final result',
      };

      return NextResponse.json({ data: completedExplanation, status: 200 }, { status: 200 });
    }

    // 3. Ambiguity Detection (Rain / DLS / Super Over)
    const rawString = JSON.stringify(body).toLowerCase();
    const hasAmbiguity = ['rain', 'dls', 'd/l', 'super over'].some(k => rawString.includes(k));

    // 4. Generate AI Explanation
    const explanation = await generateExplanation(situation, language);

    if (hasAmbiguity) {
      explanation.situation += language === 'hinglish'
        ? ' (Dhyan de: DLS ya special conditions ki wajah se targets me badlaav ho sakta hai).'
        : ' (Note: Special conditions such as DLS or weather interruptions may revise targets).';
    }

    return NextResponse.json({ data: explanation, status: 200 }, { status: 200 });
  } catch (error: unknown) {
    console.error('[API_EXPLAIN_ERROR]', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: `Invalid input: ${error.issues[0]?.message}`, status: 400 },
        { status: 400 }
      );
    }

    const errorMsg = error instanceof Error ? error.message : '';
    if (errorMsg.includes('429')) {
      return NextResponse.json(
        {
          error: 'API limit khatam ho gayi. 60 seconds baad phir try karo.',
          status: 429,
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to generate explanation. Please try again.', status: 500 },
      { status: 500 }
    );
  }
}
