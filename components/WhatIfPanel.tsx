'use client';

import React, { useId, useState } from 'react';
import { ChartNoAxesCombined, Clipboard } from 'lucide-react';
import { WhatIfResponse } from '@/lib/types';

interface WhatIfPanelProps {
  language: 'hinglish' | 'english';
}

const SAMPLE_STANDINGS = `1. KKR - 14 matches, 20 pts, NRR +1.428 (Q)
2. SRH - 14 matches, 17 pts, NRR +0.414 (Q)
3. RR  - 14 matches, 17 pts, NRR +0.273 (Q)
4. RCB - 13 matches, 12 pts, NRR +0.387 (1 match left vs CSK)
5. CSK - 13 matches, 14 pts, NRR +0.528 (1 match left vs RCB)
6. DC  - 14 matches, 14 pts, NRR -0.377 (Eliminated)`;

const SAMPLE_SCENARIO = 'Agar RCB CSK ko 18 runs se hara de, toh playoffs me kaun qualify karega?';

export function WhatIfPanel({ language }: WhatIfPanelProps) {
  const [standings, setStandings] = useState(SAMPLE_STANDINGS);
  const [scenario, setScenario] = useState(SAMPLE_SCENARIO);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const standingsId = useId();
  const scenarioId = useId();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!standings.trim() || !scenario.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standings, scenario, language }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to analyze what-if scenario');
      setResult(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const scenariosText = result.scenarios.map((item, index) => `${index + 1}. ${item}`).join('\n');
    const share = `📊 MatchPulse Playoff What-If Analysis\n\nScenario: ${scenario}\n\nAnalysis:\n${result.explanation}\n\nKey Qualification Scenarios:\n${scenariosText}\n\nAI estimate — not a prediction`;

    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Unable to copy this analysis. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mp-rule pb-4">
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-mp-red-deep">Season scenarios</p>
          <h2 className="text-xl font-extrabold tracking-[-0.04em] text-mp-ink">Playoff qualification simulator</h2>
          <p className="mt-1 text-sm leading-relaxed text-mp-muted">Explore how a match result could shift the qualification picture.</p>
        </div>
        <button
          type="button"
          onClick={() => { setStandings(SAMPLE_STANDINGS); setScenario(SAMPLE_SCENARIO); }}
          className="min-h-10 rounded-full border border-mp-rule bg-mp-paper px-4 text-xs font-bold text-mp-ink transition-colors hover:border-mp-red-deep hover:text-mp-red-deep"
        >
          Reset sample
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={standingsId} className="mb-1.5 block text-sm font-bold text-mp-ink">Points table <span className="font-medium text-mp-muted">(paste standings)</span></label>
          <textarea
            id={standingsId}
            value={standings}
            onChange={(event) => setStandings(event.target.value)}
            placeholder="Paste points table here..."
            maxLength={5000}
            rows={6}
            className="w-full resize-y rounded-2xl border border-mp-rule bg-[#f4ede1] p-3.5 font-mono text-xs leading-relaxed text-mp-ink transition-colors placeholder:text-mp-muted focus:border-mp-red-deep focus:bg-mp-sheet focus:outline-2 focus:outline-offset-2 focus:outline-mp-red-deep sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor={scenarioId} className="mb-1.5 block text-sm font-bold text-mp-ink">Scenario question <span className="font-medium text-mp-muted">(Ab kya hoga?)</span></label>
          <input
            id={scenarioId}
            type="text"
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            placeholder="e.g., agar MI jeet gayi to KKR ka kya hoga"
            maxLength={500}
            className="h-12 w-full rounded-xl border border-mp-rule bg-[#f4ede1] px-3.5 text-sm text-mp-ink transition-colors placeholder:text-mp-muted focus:border-mp-red-deep focus:bg-mp-sheet focus:outline-2 focus:outline-offset-2 focus:outline-mp-red-deep sm:text-base"
          />
        </div>

        {error && <p role="alert" className="rounded-xl border border-mp-red-deep/20 bg-mp-red-wash px-3 py-2.5 text-sm font-semibold text-mp-red-deep">{error}</p>}

        <button
          type="submit"
          disabled={isLoading || !standings.trim() || !scenario.trim()}
          className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-mp-red bg-mp-red px-5 py-3 text-sm font-extrabold text-white transition-colors hover:border-mp-red-deep hover:bg-mp-red-deep disabled:cursor-not-allowed disabled:border-mp-rule disabled:bg-mp-soft disabled:text-mp-muted"
        >
          {isLoading ? <><span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />Analyzing points table...</> : <><ChartNoAxesCombined className="size-4" aria-hidden="true" />Analyze scenario</>}
        </button>
      </form>

      {result && (
        <section aria-label="Playoff analysis result" className="space-y-4 border-t border-mp-rule pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold tracking-tight text-mp-ink">Playoff analysis</h3>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-mp-rule bg-mp-sheet px-4 text-xs font-bold text-mp-ink transition-colors hover:border-mp-red-deep hover:text-mp-red-deep"
            >
              <Clipboard aria-hidden="true" className="size-4 text-mp-red-deep" />
              {copied ? 'Copied' : 'Copy analysis'}
            </button>
          </div>
          <p className="rounded-2xl border border-mp-rule bg-mp-paper p-4 text-sm font-medium leading-relaxed text-mp-body sm:text-base">{result.explanation}</p>
          <div>
            <h4 className="mb-2 text-sm font-extrabold text-mp-ink">Qualification scenarios</h4>
            <ul className="space-y-2 pl-5 text-sm leading-relaxed text-mp-body marker:text-mp-red-deep">
              {result.scenarios.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
            </ul>
          </div>
          <p className="border-t border-mp-rule pt-3 text-xs font-semibold text-mp-muted">AI estimate — not a prediction</p>
        </section>
      )}
    </div>
  );
}
