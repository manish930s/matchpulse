import { NextRequest, NextResponse } from 'next/server';
import { MatchSituation, LiveMatchOption } from '@/lib/types';

// Curated live/featured match scenarios (always available even without external API key)
const FEATURED_MATCHES: LiveMatchOption[] = [
  {
    id: 'ind-aus-t20',
    name: 'India vs Australia — T20 International',
    status: 'India needs 42 runs in 33 balls',
    battingTeam: 'India',
    bowlingTeam: 'Australia',
    score: 153,
    wickets: 5,
    oversCompleted: 14.3,
    totalOvers: 20,
    target: 195,
    isChase: true,
  },
  {
    id: 'rcb-csk-ipl',
    name: 'RCB vs CSK — IPL Climax',
    status: 'RCB needs 13 runs in 6 balls',
    battingTeam: 'Royal Challengers Bengaluru',
    bowlingTeam: 'Chennai Super Kings',
    score: 188,
    wickets: 6,
    oversCompleted: 19.0,
    totalOvers: 20,
    target: 201,
    isChase: true,
  },
  {
    id: 'ind-sa-final',
    name: 'India vs South Africa — T20 World Cup Final',
    status: 'South Africa needs 30 runs off 30 balls',
    battingTeam: 'South Africa',
    bowlingTeam: 'India',
    score: 147,
    wickets: 4,
    oversCompleted: 15.0,
    totalOvers: 20,
    target: 177,
    isChase: true,
  },
  {
    id: 'mi-kkr-defend',
    name: 'Mumbai Indians vs KKR — 1st Innings Defending',
    status: 'MI 195/4 in 20 overs (Defending total)',
    battingTeam: 'Mumbai Indians',
    bowlingTeam: 'Kolkata Knight Riders',
    score: 195,
    wickets: 4,
    oversCompleted: 20.0,
    totalOvers: 20,
    isChase: false,
  },
  {
    id: 'eng-aus-ashes',
    name: 'England vs Australia — Powerplay Chase',
    status: 'England 58/2 in 6 overs chasing 185',
    battingTeam: 'England',
    bowlingTeam: 'Australia',
    score: 58,
    wickets: 2,
    oversCompleted: 6.0,
    totalOvers: 20,
    target: 185,
    isChase: true,
  },
];

export async function GET(req: NextRequest) {
  const apiKey = process.env.CRICAPI_KEY;
  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get('matchId');

  // If CricAPI key is provided, try to fetch real live matches
  if (apiKey && apiKey !== 'your_cricapi_key_here_optional') {
    try {
      const res = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`, {
        next: { revalidate: 30 },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          interface CricMatch {
            id?: string;
            name?: string;
            teams?: string[];
            status?: string;
            matchStarted?: boolean;
            matchEnded?: boolean;
            score?: Array<{
              r: number;
              w: number;
              o: number;
              inning: string;
            }>;
          }

          const rawMatches: CricMatch[] = json.data;
          const liveOptions: LiveMatchOption[] = rawMatches
            .filter((m) => m.matchStarted && m.score && m.score.length > 0)
            .map((m, idx) => {
              const currentInn = m.score![m.score!.length - 1];
              const prevInn = m.score!.length > 1 ? m.score![0] : null;
              const isChase = Boolean(prevInn);
              return {
                id: m.id || `cric-${idx}`,
                name: m.name || `${m.teams?.[0] || 'Team A'} vs ${m.teams?.[1] || 'Team B'}`,
                status: m.status || (isChase ? `Chasing ${prevInn!.r + 1}` : '1st Innings'),
                battingTeam: m.teams?.[0] || 'Team A',
                bowlingTeam: m.teams?.[1] || 'Team B',
                score: currentInn.r || 0,
                wickets: currentInn.w || 0,
                oversCompleted: currentInn.o || 0,
                totalOvers: 20,
                target: isChase ? prevInn!.r + 1 : undefined,
                isChase,
              };
            });

          if (liveOptions.length > 0) {
            const selected = requestedId
              ? liveOptions.find((m) => m.id === requestedId) || liveOptions[0]
              : liveOptions[0];

            const situation: MatchSituation = {
              battingTeam: selected.battingTeam,
              bowlingTeam: selected.bowlingTeam,
              score: selected.score,
              wickets: selected.wickets,
              oversCompleted: selected.oversCompleted,
              totalOvers: selected.totalOvers,
              target: selected.target,
            };

            return NextResponse.json({
              available: true,
              isRealApi: true,
              matches: liveOptions,
              situation,
              matchName: selected.name,
            });
          }
        }
      }
    } catch (err) {
      console.error('[CRICAPI_FETCH_ERROR]', err);
    }
  }

  // Fallback: provide rich featured matches list so users can always choose
  const selected = requestedId
    ? FEATURED_MATCHES.find((m) => m.id === requestedId) || FEATURED_MATCHES[0]
    : FEATURED_MATCHES[0];

  const situation: MatchSituation = {
    battingTeam: selected.battingTeam,
    bowlingTeam: selected.bowlingTeam,
    score: selected.score,
    wickets: selected.wickets,
    oversCompleted: selected.oversCompleted,
    totalOvers: selected.totalOvers,
    target: selected.target,
  };

  return NextResponse.json({
    available: true,
    isRealApi: false,
    matches: FEATURED_MATCHES,
    situation,
    matchName: selected.name,
  });
}
