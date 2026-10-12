'use client';

import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MatchSituation, Explanation } from '@/lib/types';
import { CACHE_DURATION_MS } from '@/lib/constants';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SituationForm } from '@/components/SituationForm';
import { ResultCard } from '@/components/ResultCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const WhatIfPanel = dynamic(
  () => import('@/components/WhatIfPanel').then((mod) => mod.WhatIfPanel),
  {
    loading: () => (
      <div className="rounded-[20px] border border-mp-rule bg-mp-sheet p-6 text-center text-sm text-mp-muted shadow-mp-sheet" role="status">
        Loading Playoff Simulator...
      </div>
    ),
    ssr: false,
  }
);

interface CacheEntry {
  data: Explanation;
  timestamp: number;
}

type SituationSource = 'manual' | 'live';
type AppTab = 'situation' | 'whatif';

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('situation');
  const [language, setLanguage] = useState<'hinglish' | 'english'>('hinglish');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [explanationSituation, setExplanationSituation] = useState<MatchSituation | null>(null);
  const [explanationSource, setExplanationSource] = useState<SituationSource>('manual');
  const [inputSource, setInputSource] = useState<SituationSource>('manual');
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const pendingRequestsRef = useRef<Map<string, Promise<Explanation>>>(new Map());
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const applyExplanation = useCallback((data: Explanation, situation: MatchSituation, source: SituationSource) => {
    setExplanation(data);
    setExplanationSituation(situation);
    setExplanationSource(source);
    setIsFormDirty(false);
  }, []);

  const handleExplain = useCallback(async (situation: MatchSituation) => {
    const source = inputSource;
    setIsLoading(true);
    setErrorMessage(null);

    const cacheKey = JSON.stringify({ ...situation, language });
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      applyExplanation(cached.data, situation, source);
      setIsLoading(false);
      return;
    }

    if (pendingRequestsRef.current.has(cacheKey)) {
      try {
        const result = await pendingRequestsRef.current.get(cacheKey)!;
        applyExplanation(result, situation, source);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to analyze situation');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const requestPromise = (async () => {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...situation, language }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const waitSecs = json.retryAfter || 60;
          setRetryCountdown(waitSecs);
          const interval = setInterval(() => {
            setRetryCountdown((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(interval);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
        throw new Error(json.error || 'Failed to analyze situation');
      }

      return json.data as Explanation;
    })();

    pendingRequestsRef.current.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
      applyExplanation(data, situation, source);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to get explanation. Please try again.');
    } finally {
      pendingRequestsRef.current.delete(cacheKey);
      setIsLoading(false);
    }
  }, [applyExplanation, inputSource, language]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % 2;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index + 1) % 2;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = 1;

    if (nextIndex !== null) {
      event.preventDefault();
      const nextTab: AppTab = nextIndex === 0 ? 'situation' : 'whatif';
      setActiveTab(nextTab);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const handleEditMatch = useCallback(() => {
    setActiveTab('situation');
    requestAnimationFrame(() => {
      const firstInput = document.querySelector<HTMLInputElement>('#match-form input:not([type="hidden"])');
      firstInput?.focus({ preventScroll: true });
      document.getElementById('match-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const hasResult = Boolean(explanation && explanationSituation);

  return (
    <main id="top" className="min-h-screen bg-mp-paper px-4 pb-10 text-mp-ink sm:px-6">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="pt-5 sm:pt-7">
          <div className="flex items-center justify-between gap-3 border-b border-mp-rule pb-4">
            <a href="#top" aria-label="MatchPulse home" className="inline-flex min-w-0 items-center gap-2.5 text-mp-ink no-underline">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center bg-mp-score text-base font-extrabold leading-none tracking-tight text-mp-paper sm:size-10 sm:text-lg">
                MP
              </span>
              <h1 className="truncate text-[21px] font-extrabold leading-none tracking-[-0.055em] sm:text-[27px]">
                Match<span className="text-mp-red-deep">Pulse</span>
              </h1>
            </a>
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>
        </header>

        <div
          className="mt-3 grid grid-cols-2 border-b border-mp-ink"
          role="tablist"
          aria-label="MatchPulse modes"
          onKeyDown={(event) => {
            const index = tabRefs.current.indexOf(event.target as HTMLButtonElement);
            if (index >= 0) handleTabKeyDown(event, index);
          }}
        >
          {(['situation', 'whatif'] as const).map((tab, index) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                ref={(element) => { tabRefs.current[index] = element; }}
                id={`tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                className={`min-h-12 border-b-[3px] px-3 text-center text-sm font-bold transition-colors ${
                  selected
                    ? 'border-mp-red text-mp-ink'
                    : 'border-transparent text-mp-muted hover:text-mp-ink'
                }`}
              >
                {tab === 'situation' ? 'Live Situation' : 'Playoff What-If'}
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-mp-red-deep/25 bg-mp-red-wash px-4 py-3 text-sm text-mp-red-deep" role="alert">
            <p className="font-bold">{errorMessage}</p>
            {retryCountdown !== null && (
              <p className="mt-1 text-xs">
                {language === 'hinglish'
                  ? `Please wait: ${retryCountdown} seconds me retry button enable hoga.`
                  : `Cooldown active: retry enables in ${retryCountdown} seconds.`}
              </p>
            )}
          </div>
        )}

        <ErrorBoundary>
          {activeTab === 'situation' ? (
            <section
              id="panel-situation"
              role="tabpanel"
              aria-labelledby="tab-situation"
              className="mt-5"
            >
              <div className={hasResult ? 'grid items-start gap-5 md:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] md:gap-7' : 'mx-auto w-full max-w-[640px]'}>
                {hasResult && explanation && explanationSituation && (
                  <section className="min-w-0 md:col-start-2 md:row-start-1" aria-label="Match explanation">
                    {isFormDirty && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mp-rule bg-mp-soft px-4 py-3 text-sm">
                        <div>
                          <p className="font-bold text-mp-ink">Previous explanation</p>
                          <p className="mt-1 text-xs leading-relaxed text-mp-muted">
                            Still based on {explanationSituation.battingTeam} {explanationSituation.score}/{explanationSituation.wickets} · {explanationSituation.oversCompleted} overs{explanationSituation.target ? ` · target ${explanationSituation.target}` : ''}. Update it before sharing.
                          </p>
                        </div>
                        <button type="button" onClick={handleEditMatch} className="min-h-10 rounded-full border border-mp-rule bg-mp-sheet px-4 text-xs font-bold text-mp-ink hover:border-mp-red-deep">
                          Update answer
                        </button>
                      </div>
                    )}
                    <ResultCard
                      explanation={explanation}
                      situation={explanationSituation}
                      source={explanationSource}
                      onEdit={handleEditMatch}
                    />
                  </section>
                )}

                <section className={`min-w-0 ${hasResult ? 'md:col-start-1 md:row-start-1' : ''}`} aria-label="Update match details">
                  <div id="match-form" className="scroll-mt-6 rounded-[20px] border border-mp-rule bg-mp-sheet p-4 shadow-mp-sheet sm:p-5">
                    <div className="mb-4">
                      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-mp-red-deep">Live match desk</p>
                      <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.045em] text-mp-ink sm:text-[27px]">
                        Update match details
                      </h2>
                      <p className="mt-1 max-w-[48ch] text-sm leading-relaxed text-mp-muted">
                        Adjust the score or start from a quick situation. Your answer stays tied to its original figures until you explain again.
                      </p>
                    </div>
                    <SituationForm
                      onSubmit={handleExplain}
                      isLoading={isLoading}
                      language={language}
                      onDirtyChange={(dirty) => setIsFormDirty(dirty)}
                      onSourceChange={setInputSource}
                    />
                    {isLoading && <LoadingSkeleton language={language} />}
                  </div>
                </section>
              </div>
            </section>
          ) : (
            <section
              id="panel-whatif"
              role="tabpanel"
              aria-labelledby="tab-whatif"
              className="mx-auto mt-5 w-full max-w-[760px] rounded-[20px] border border-mp-rule bg-mp-sheet p-4 shadow-mp-sheet sm:p-5"
            >
              <WhatIfPanel language={language} />
            </section>
          )}
        </ErrorBoundary>

        <footer className="mt-8 border-t border-mp-rule pt-4 text-xs leading-relaxed text-mp-muted">
          <p><strong className="text-mp-ink">MatchPulse</strong> · Cricket, clearly.</p>
          <p>For fans following the match. Not betting or fantasy advice.</p>
        </footer>
      </div>
    </main>
  );
}
