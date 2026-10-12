import React from 'react';

export function LoadingSkeleton({ language = 'hinglish' }: { language?: 'hinglish' | 'english' }) {
  return (
    <div
      data-testid="loading-skeleton"
      role="status"
      aria-live="polite"
      className="my-4 space-y-4 rounded-[18px] border border-mp-rule bg-mp-sheet p-4 shadow-sm animate-pulse"
    >
      <div className="flex items-center justify-between border-b border-mp-rule pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-mp-soft" />
          <div className="h-4 w-32 rounded-full bg-mp-soft" />
        </div>
        <div className="h-6 w-16 rounded-full bg-mp-soft" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-full rounded-full bg-mp-soft" />
        <div className="h-4 w-5/6 rounded-full bg-mp-soft" />
        <div className="h-4 w-3/4 rounded-full bg-mp-soft" />
      </div>
      <div className="h-12 rounded-xl border border-mp-rule bg-mp-paper" />
      <div className="space-y-2 border-t border-mp-rule pt-3">
        <div className="h-4 w-28 rounded-full bg-mp-soft" />
        <div className="h-3.5 w-11/12 rounded-full bg-mp-soft" />
        <div className="h-3.5 w-4/5 rounded-full bg-mp-soft" />
      </div>
      <div className="flex items-center justify-center gap-2 pt-1 text-xs font-semibold text-mp-red-deep">
        <span className="size-2 animate-ping rounded-full bg-mp-red" aria-hidden="true" />
        <span>
          {language === 'hinglish'
            ? 'AI pitch aur match stats calculate kar raha hai...'
            : 'AI analyzing live match dynamics and win probability...'}
        </span>
      </div>
    </div>
  );
}
