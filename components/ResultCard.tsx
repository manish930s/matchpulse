'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clipboard, Pencil, Share2 } from 'lucide-react';
import { Explanation, MatchSituation } from '@/lib/types';
import { calculateCricketStats } from '@/lib/cricket';
import { formatShareText } from '@/lib/utils';

interface ResultCardProps {
  explanation: Explanation;
  situation: MatchSituation;
  source: 'manual' | 'live';
  onEdit: () => void;
}

export const ResultCard = React.memo(function ResultCard({
  explanation,
  situation,
  source,
  onEdit,
}: ResultCardProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [canShare, setCanShare] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stats = calculateCricketStats(situation);
  const isChase = stats.isChase;
  const target = situation.target;

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', duration = 2200) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    setToastType(type);
    toastTimer.current = setTimeout(() => setToastMessage(null), duration);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      const text = formatShareText(explanation);
      let copied = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch {
          // Fall back to the selection-based API if permission is unavailable.
        }
      }

      if (!copied) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('aria-hidden', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (!copied) throw new Error('Clipboard copy was unavailable');
      showToast('Copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy. Please try again.', 'error', 3000);
    }
  }, [explanation, showToast]);

  const handleShare = useCallback(async () => {
    const text = formatShareText(explanation);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'MatchPulse Cricket Explainer', text });
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') handleCopy();
      }
      return;
    }
    handleCopy();
  }, [explanation, handleCopy]);

  const oversRemaining = Math.max(0, situation.totalOvers - Math.floor(situation.oversCompleted));
  const scoreLabel = `${situation.battingTeam} ${situation.score}/${situation.wickets}`;
  const oversLabel = `${situation.oversCompleted} of ${situation.totalOvers} overs`;

  return (
    <article
      data-testid="result-card"
      className="relative min-w-0 space-y-4 text-mp-body sm:space-y-5"
    >
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-bold shadow-mp-sheet ${
            toastType === 'success'
              ? 'border-mp-red-deep/20 bg-mp-score text-mp-paper'
              : 'border-mp-red-deep/25 bg-mp-red-wash text-mp-red-deep'
          }`}
        >
          {toastMessage}
        </div>
      )}

      <div className="flex min-h-11 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-mp-muted">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-mp-red" />
          <span className="truncate">{source === 'live' ? 'Live score snapshot' : 'Entered manually'}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-mp-rule bg-mp-sheet px-4 text-sm font-bold text-mp-ink transition-colors hover:border-mp-red-deep hover:text-mp-red-deep"
          aria-label="Edit match details"
        >
          <Pencil aria-hidden="true" className="size-4 text-mp-red-deep" />
          Edit match
        </button>
      </div>

      <section aria-label="Match details this answer uses" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-y border-mp-rule py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-mp-muted">
            {situation.battingTeam} batting · {situation.bowlingTeam} bowling
          </p>
          <p className="mt-1 truncate text-[25px] font-extrabold leading-none tracking-[-0.055em] text-mp-ink sm:text-[28px]">{scoreLabel}</p>
        </div>
        <div className="text-right text-xs leading-snug text-mp-muted">
          {target !== undefined && <strong className="block text-base font-extrabold text-mp-ink">Target {target}</strong>}
          <span>{oversLabel}</span>
        </div>
      </section>

      <section aria-label="Match answer" className="overflow-hidden rounded-[20px] bg-mp-score px-5 py-5 text-mp-paper shadow-mp-score sm:px-6 sm:py-6">
        <div className="grid grid-cols-[minmax(0,1fr)_100px] items-center gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-base font-bold leading-tight text-mp-paper">
              {isChase ? `${situation.battingTeam} need` : `${situation.battingTeam} scored`}
            </p>
            <p className="truncate text-[clamp(3.5rem,16vw,5rem)] font-extrabold leading-[0.83] tracking-[-0.075em] text-mp-red" data-testid="key-number">
              {isChase ? stats.runsNeeded : situation.score}
            </p>
            <p className="mt-2 text-base font-bold text-mp-paper">
              {isChase ? `from ${stats.ballsRemaining} balls` : `in ${oversRemaining} overs`}
            </p>
          </div>
          <div className="border-l border-mp-silver/40 pl-3">
            <strong className="block text-[27px] font-extrabold leading-none tracking-tight text-mp-paper">
              {isChase ? stats.rrr.toFixed(2) : `${situation.wickets}`}
            </strong>
            <span className="mt-1 block text-[11px] leading-snug text-mp-silver">
              {isChase ? <>required runs<br />per over</> : 'wickets lost'}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-3 border-t border-mp-silver/30 pt-3">
          <span className="text-[29px] font-extrabold leading-none tracking-tight text-mp-red" data-testid="win-probability">
            {explanation.winProbability}%
          </span>
          <p className="text-xs leading-relaxed text-mp-paper/85">
            <strong className="block text-sm text-mp-paper">Estimated win chance</strong>
            AI estimate, not a prediction
          </p>
        </div>
      </section>

      <p data-testid="situation" className="text-[15px] leading-relaxed text-mp-body sm:text-base">
        {explanation.situation}
      </p>

      {explanation.actions[0] && (
        <section aria-label="The next move" className="rounded-[18px] border-y-2 border-mp-red bg-mp-red-wash px-4 py-3.5">
          <p className="mb-1 text-xs font-extrabold tracking-wide text-mp-red-deep">THE NEXT MOVE</p>
          <p className="text-base font-bold leading-snug text-mp-body">{explanation.actions[0]}</p>
        </section>
      )}

      <section className="border-t border-mp-rule pt-4">
        <h2 className="mb-2 text-[21px] font-extrabold leading-tight tracking-[-0.04em] text-mp-ink">Batting actions</h2>
        <ol className="m-0 list-none p-0">
          {explanation.actions.map((action, index) => (
            <li key={`${index}-${action}`} className="relative border-b border-mp-rule py-3 pl-8 text-sm leading-relaxed text-mp-body last:border-b-0">
              <span className="absolute left-0 top-3 text-xl font-extrabold leading-none text-mp-red-deep" aria-hidden="true">{index + 1}</span>
              {action}
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-mp-rule pt-4">
        <h2 className="mb-2 text-[21px] font-extrabold leading-tight tracking-[-0.04em] text-mp-ink">Bowling plan</h2>
        <ul className="m-0 list-none p-0">
          {explanation.bowlingPlan.map((plan, index) => (
            <li key={`${index}-${plan}`} className="relative border-b border-mp-rule py-3 pl-8 text-sm leading-relaxed text-mp-body last:border-b-0">
              <span className="absolute left-0 top-3 text-lg font-extrabold leading-none text-mp-red-deep" aria-hidden="true">—</span>
              {plan}
            </li>
          ))}
        </ul>
        {explanation.probabilityReason && (
          <p className="mt-2 text-sm leading-relaxed text-mp-muted">{explanation.probabilityReason}</p>
        )}
      </section>

      {explanation.watchFor.length > 0 && (
        <section className="border-t border-mp-rule pt-4">
          <h2 className="mb-2 text-[21px] font-extrabold leading-tight tracking-[-0.04em] text-mp-ink">Watch the next overs</h2>
          <div className="space-y-2 rounded-[16px] border border-mp-rule bg-mp-sheet p-4 shadow-sm">
            <p className="text-xs font-extrabold tracking-wide text-mp-red-deep">WHAT COULD SHIFT THE CHASE</p>
            <ul className="m-0 list-none space-y-2 p-0 text-sm leading-relaxed text-mp-body">
              {explanation.watchFor.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
            </ul>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2.5 border-t border-mp-rule pt-4">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-mp-rule bg-mp-sheet px-3 text-center text-xs font-bold leading-tight text-mp-ink transition-colors hover:border-mp-red-deep hover:text-mp-red-deep"
        >
          <Clipboard aria-hidden="true" className="size-4 shrink-0 text-mp-red-deep" />
          Copy match explanation
        </button>
        {canShare ? (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-mp-red bg-mp-red px-3 text-center text-xs font-extrabold leading-tight text-white transition-colors hover:bg-mp-red-deep hover:border-mp-red-deep"
          >
            <Share2 aria-hidden="true" className="size-4 shrink-0 text-white" />
            Share explanation
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-mp-red bg-mp-red px-3 text-center text-xs font-extrabold leading-tight text-white transition-colors hover:bg-mp-red-deep hover:border-mp-red-deep"
          >
            <Share2 aria-hidden="true" className="size-4 shrink-0 text-white" />
            Share explanation
          </button>
        )}
      </div>

      <p className="pb-2 text-xs leading-relaxed text-mp-muted">
        <strong className="text-mp-ink">{explanation.disclaimer || 'Estimate, not a prediction.'}</strong>{' '}
        This answer reflects the match details shown above.
      </p>
    </article>
  );
});
