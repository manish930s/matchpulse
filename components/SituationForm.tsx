'use client';

import React, { useState, useId, useCallback } from 'react';
import { RefreshCw, Zap, ChevronDown, Check, Trophy } from 'lucide-react';
import { MatchSituation, LiveMatchOption } from '@/lib/types';

interface SituationFormProps {
  onSubmit: (situation: MatchSituation) => void;
  isLoading?: boolean;
  language?: 'hinglish' | 'english';
  onDirtyChange?: (isDirty: boolean) => void;
  onSourceChange?: (source: 'manual' | 'live') => void;
}

interface FormState {
  battingTeam: string;
  bowlingTeam: string;
  score: string;
  wickets: string;
  oversCompleted: string;
  totalOvers: string;
  target: string;
  isChase: boolean;
}

interface ErrorsState {
  battingTeam?: string;
  bowlingTeam?: string;
  score?: string;
  wickets?: string;
  oversCompleted?: string;
  totalOvers?: string;
  target?: string;
}

const INITIAL_FORM: FormState = {
  battingTeam: 'India',
  bowlingTeam: 'Australia',
  score: '153',
  wickets: '5',
  oversCompleted: '14.3',
  totalOvers: '20',
  target: '195',
  isChase: true,
};

const inputClassName =
  'h-12 w-full rounded-xl border border-mp-rule bg-[#f4ede1] px-3 text-base font-bold text-mp-ink shadow-[inset_0_-2px_3px_rgb(100_65_46_/_8%)] transition-colors placeholder:text-mp-muted focus:border-mp-red-deep focus:bg-mp-sheet focus:outline-2 focus:outline-offset-2 focus:outline-mp-red-deep';

export function SituationForm({
  onSubmit,
  isLoading = false,
  language = 'hinglish',
  onDirtyChange,
  onSourceChange,
}: SituationFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveScoreError, setLiveScoreError] = useState<string | null>(null);
  const [availableMatches, setAvailableMatches] = useState<LiveMatchOption[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isMatchPickerOpen, setIsMatchPickerOpen] = useState(false);

  const battingTeamId = useId();
  const bowlingTeamId = useId();
  const scoreId = useId();
  const wicketsId = useId();
  const oversCompletedId = useId();
  const totalOversId = useId();
  const targetId = useId();

  const validateForm = useCallback(
    (currentForm: FormState): { isValid: boolean; newErrors: ErrorsState } => {
      const newErrors: ErrorsState = {};

      if (!currentForm.battingTeam.trim()) {
        newErrors.battingTeam = language === 'hinglish' ? 'Batting team name zaroori hai' : 'Batting team is required';
      } else if (currentForm.battingTeam.length > 50) {
        newErrors.battingTeam = language === 'hinglish' ? 'Team name max 50 characters' : 'Team name max 50 characters';
      }

      if (!currentForm.bowlingTeam.trim()) {
        newErrors.bowlingTeam = language === 'hinglish' ? 'Bowling team name zaroori hai' : 'Bowling team is required';
      } else if (currentForm.bowlingTeam.length > 50) {
        newErrors.bowlingTeam = language === 'hinglish' ? 'Team name max 50 characters' : 'Team name max 50 characters';
      }

      const scoreNum = Number(currentForm.score);
      if (currentForm.score === '' || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 999) {
        newErrors.score = language === 'hinglish' ? 'Score 0-999 ke beech hona chahiye' : 'Score must be between 0 and 999';
      }

      const wicketsNum = Number(currentForm.wickets);
      if (currentForm.wickets === '' || isNaN(wicketsNum) || wicketsNum < 0 || wicketsNum > 10) {
        newErrors.wickets = language === 'hinglish' ? 'Wickets 0-10 ke beech honi chahiye' : 'Wickets must be between 0-10';
      }

      const totalOversNum = Number(currentForm.totalOvers);
      if (currentForm.totalOvers === '' || isNaN(totalOversNum) || totalOversNum < 1 || totalOversNum > 999) {
        newErrors.totalOvers = language === 'hinglish' ? 'Total overs kam se kam 1 hone chahiye' : 'Total overs must be at least 1';
      }

      const oversCompNum = Number(currentForm.oversCompleted);
      if (currentForm.oversCompleted === '' || isNaN(oversCompNum) || oversCompNum < 0) {
        newErrors.oversCompleted = language === 'hinglish' ? 'Overs valid number hona chahiye' : 'Overs must be a valid number';
      } else if (!isNaN(totalOversNum) && oversCompNum > totalOversNum) {
        newErrors.oversCompleted =
          language === 'hinglish'
            ? 'Overs completed total overs se zyada nahi ho sakta'
            : 'Overs completed cannot exceed total overs';
      } else {
        const fraction = Number((oversCompNum % 1).toFixed(1));
        const balls = Math.round(fraction * 10);
        if (balls > 5) {
          newErrors.oversCompleted =
            language === 'hinglish'
              ? 'Balls 0-5 ke beech hone chahiye (e.g., 14.3 for 14 overs 3 balls)'
              : 'Balls must be between 0 and 5 (e.g., 14.3 for 14 overs 3 balls)';
        }
      }

      if (currentForm.isChase) {
        const targetNum = Number(currentForm.target);
        if (currentForm.target === '' || isNaN(targetNum) || targetNum < 1) {
          newErrors.target =
            language === 'hinglish'
              ? 'Chasing mode me target zaroori hai (min 1 run)'
              : 'Target is required when chasing (min 1 run)';
        }
      }

      return { isValid: Object.keys(newErrors).length === 0, newErrors };
    },
    [language]
  );

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setSelectedMatchId(null);
    onDirtyChange?.(true);
    onSourceChange?.('manual');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const { isValid } = validateForm(form);
    if (!isValid) return;

    onSubmit({
      battingTeam: form.battingTeam.trim(),
      bowlingTeam: form.bowlingTeam.trim(),
      score: parseInt(form.score, 10),
      wickets: parseInt(form.wickets, 10),
      oversCompleted: parseFloat(form.oversCompleted),
      totalOvers: parseInt(form.totalOvers, 10),
      target: form.isChase ? parseInt(form.target, 10) : undefined,
      language,
    });
  };

  const handleSelectMatch = (match: LiveMatchOption) => {
    setForm({
      battingTeam: match.battingTeam,
      bowlingTeam: match.bowlingTeam,
      score: match.score.toString(),
      wickets: match.wickets.toString(),
      oversCompleted: match.oversCompleted.toString(),
      totalOvers: match.totalOvers.toString(),
      target: match.target ? match.target.toString() : '',
      isChase: match.isChase,
    });
    setSelectedMatchId(match.id);
    setIsMatchPickerOpen(false);
    onDirtyChange?.(true);
    onSourceChange?.('live');
  };

  const handleFetchLiveScore = async () => {
    setIsLiveLoading(true);
    setLiveScoreError(null);
    try {
      const response = await fetch('/api/livescore');
      const data = await response.json();
      if (data.available && (data.matches || data.situation)) {
        const matchesList: LiveMatchOption[] = data.matches || (data.situation ? [{
          id: 'live-default',
          name: data.matchName || `${data.situation.battingTeam} vs ${data.situation.bowlingTeam}`,
          status: 'Live match score',
          battingTeam: data.situation.battingTeam,
          bowlingTeam: data.situation.bowlingTeam,
          score: data.situation.score,
          wickets: data.situation.wickets,
          oversCompleted: data.situation.oversCompleted,
          totalOvers: data.situation.totalOvers,
          target: data.situation.target,
          isChase: Boolean(data.situation.target),
        }] : []);

        setAvailableMatches(matchesList);
        setIsMatchPickerOpen(true);

        // Auto-select first match if none currently selected
        if (!selectedMatchId && matchesList.length > 0) {
          handleSelectMatch(matchesList[0]);
        }
      } else {
        setLiveScoreError(data.message || 'No live matches found');
        setTimeout(() => setLiveScoreError(null), 3000);
      }
    } catch {
      setLiveScoreError('Failed to fetch live score');
      setTimeout(() => setLiveScoreError(null), 3000);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const loadPreset = (preset: 'tight' | 'super' | 'defend') => {
    setSelectedMatchId(null);
    if (preset === 'tight') {
      setForm({ ...INITIAL_FORM });
    } else if (preset === 'super') {
      setForm({
        battingTeam: 'RCB',
        bowlingTeam: 'CSK',
        score: '188',
        wickets: '6',
        oversCompleted: '19.0',
        totalOvers: '20',
        target: '201',
        isChase: true,
      });
    } else {
      setForm({
        battingTeam: 'Mumbai Indians',
        bowlingTeam: 'KKR',
        score: '195',
        wickets: '4',
        oversCompleted: '20',
        totalOvers: '20',
        target: '',
        isChase: false,
      });
    }
    onDirtyChange?.(true);
    onSourceChange?.('manual');
  };

  const { isValid } = validateForm(form);
  const tightSelected =
    form.battingTeam === 'India' && form.score === '153' && form.oversCompleted === '14.3' && form.target === '195';
  const superSelected = form.battingTeam === 'RCB' && form.score === '188' && form.oversCompleted === '19.0';
  const defendSelected = !form.isChase && form.battingTeam === 'Mumbai Indians' && form.score === '195';
  const { newErrors: errors } = validateForm(form);

  const renderError = (field: keyof ErrorsState) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-1.5 text-xs font-semibold text-mp-red-deep" role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Match Presets */}
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="text-sm font-extrabold text-mp-ink">Start with a situation</legend>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2" aria-label="Match presets">
          <button
            type="button"
            aria-pressed={tightSelected}
            onClick={() => loadPreset('tight')}
            className={`min-h-11 rounded-full border px-1.5 py-2 text-center text-xs font-bold transition-colors sm:px-2 ${
              tightSelected
                ? 'border-mp-red-deep bg-mp-red-wash text-mp-red-deep'
                : 'border-mp-rule bg-mp-paper text-mp-ink hover:border-mp-red-deep'
            }`}
          >
            42 off 33
          </button>
          <button
            type="button"
            aria-pressed={superSelected}
            onClick={() => loadPreset('super')}
            className={`min-h-11 rounded-full border px-1.5 py-2 text-center text-xs font-bold transition-colors sm:px-2 ${
              superSelected
                ? 'border-mp-red-deep bg-mp-red-wash text-mp-red-deep'
                : 'border-mp-rule bg-mp-paper text-mp-ink hover:border-mp-red-deep'
            }`}
          >
            13 off 6
          </button>
          <button
            type="button"
            aria-pressed={defendSelected}
            onClick={() => loadPreset('defend')}
            className={`min-h-11 rounded-full border px-1.5 py-2 text-center text-xs font-bold transition-colors sm:px-2 ${
              defendSelected
                ? 'border-mp-red-deep bg-mp-red-wash text-mp-red-deep'
                : 'border-mp-rule bg-mp-paper text-mp-ink hover:border-mp-red-deep'
            }`}
          >
            Defend 195
          </button>
        </div>
      </fieldset>

      {/* Live Match Bar & Match Selector Trigger */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs leading-relaxed text-mp-muted">
          <p className="font-semibold text-mp-ink">
            {selectedMatchId ? 'Selected Live Match' : 'Manual / Custom Match'}
          </p>
          <p className="text-[11px] text-mp-muted">Pick a live match or type your own below.</p>
        </div>
        <button
          type="button"
          onClick={handleFetchLiveScore}
          disabled={isLiveLoading}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-mp-rule bg-mp-sheet px-3 text-xs font-bold text-mp-ink transition-colors hover:border-mp-red-deep disabled:opacity-55 sm:px-4"
        >
          <RefreshCw className={`size-3.5 text-mp-red-deep ${isLiveLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isLiveLoading ? 'Loading…' : 'Load Live Score'}</span>
          <ChevronDown className={`size-3.5 transition-transform ${isMatchPickerOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {liveScoreError && (
        <p role="alert" className="rounded-xl border border-mp-red-deep/20 bg-mp-red-wash px-3 py-2 text-xs font-semibold text-mp-red-deep">
          {liveScoreError}
        </p>
      )}

      {/* Expandable Match Picker List */}
      {isMatchPickerOpen && availableMatches.length > 0 && (
        <div className="rounded-2xl border border-mp-rule bg-mp-sheet p-3 shadow-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-mp-rule/60 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-mp-ink">
              <Trophy className="size-3.5 text-mp-red-deep" />
              <span>Choose Live or Featured Match</span>
            </span>
            <span className="text-[10px] font-semibold text-mp-muted">
              {availableMatches.length} matches available
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {availableMatches.map((match) => {
              const isSelected = selectedMatchId === match.id;
              return (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => handleSelectMatch(match)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-mp-red-deep bg-mp-red-wash/60 text-mp-ink font-bold'
                      : 'border-mp-rule/60 bg-mp-paper hover:border-mp-red-deep/60 text-mp-ink'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="truncate text-xs font-bold text-mp-ink">{match.name}</p>
                    <p className="text-[11px] text-mp-muted truncate">
                      {match.score}/{match.wickets} in {match.oversCompleted} ov
                      {match.target ? ` • Target: ${match.target}` : ' • 1st Innings'}
                      <span className="ml-1 text-mp-red-deep font-semibold">({match.status})</span>
                    </p>
                  </div>
                  {isSelected && <Check className="size-4 text-mp-red-deep shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Innings Mode */}
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="text-sm font-extrabold text-mp-ink">Innings mode</legend>
        <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-full border border-mp-rule bg-mp-soft">
          <button
            type="button"
            aria-pressed={form.isChase}
            onClick={() => handleChange('isChase', true)}
            className={`min-h-11 px-2 text-xs font-bold transition-colors sm:px-3 ${
              form.isChase ? 'bg-mp-score text-mp-paper' : 'text-mp-muted hover:text-mp-ink'
            }`}
          >
            Chasing a target
          </button>
          <button
            type="button"
            aria-pressed={!form.isChase}
            onClick={() => handleChange('isChase', false)}
            className={`min-h-11 px-2 text-xs font-bold transition-colors sm:px-3 ${
              !form.isChase ? 'bg-mp-score text-mp-paper' : 'text-mp-muted hover:text-mp-ink'
            }`}
          >
            Defending / 1st innings
          </button>
        </div>
      </fieldset>

      {/* Teams Grid */}
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="w-full border-b border-mp-rule pb-2 text-sm font-extrabold text-mp-ink">Teams</legend>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <div className="min-w-0">
            <label htmlFor={battingTeamId} className="mb-1 block text-xs font-bold text-mp-muted">
              Batting team
            </label>
            <input
              id={battingTeamId}
              name="battingTeam"
              type="text"
              maxLength={50}
              value={form.battingTeam}
              onChange={(event) => handleChange('battingTeam', event.target.value)}
              aria-invalid={Boolean(errors.battingTeam)}
              aria-describedby={errors.battingTeam ? 'battingTeam-error' : undefined}
              className={inputClassName}
              placeholder="e.g. India"
            />
            {renderError('battingTeam')}
          </div>
          <div className="min-w-0">
            <label htmlFor={bowlingTeamId} className="mb-1 block text-xs font-bold text-mp-muted">
              Bowling team
            </label>
            <input
              id={bowlingTeamId}
              name="bowlingTeam"
              type="text"
              maxLength={50}
              value={form.bowlingTeam}
              onChange={(event) => handleChange('bowlingTeam', event.target.value)}
              aria-invalid={Boolean(errors.bowlingTeam)}
              aria-describedby={errors.bowlingTeam ? 'bowlingTeam-error' : undefined}
              className={inputClassName}
              placeholder="e.g. Australia"
            />
            {renderError('bowlingTeam')}
          </div>
        </div>
      </fieldset>

      {/* Current Score Grid */}
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="w-full border-b border-mp-rule pb-2 text-sm font-extrabold text-mp-ink">Current score</legend>
        <div className="mt-2 grid grid-cols-2 gap-x-2.5 gap-y-3">
          <div className="min-w-0">
            <label htmlFor={scoreId} className="mb-1 block text-xs font-bold text-mp-muted">
              Runs
            </label>
            <input
              id={scoreId}
              name="score"
              type="number"
              min={0}
              max={999}
              value={form.score}
              onChange={(event) => handleChange('score', event.target.value)}
              aria-invalid={Boolean(errors.score)}
              aria-describedby={errors.score ? 'score-error' : undefined}
              className={inputClassName}
              placeholder="153"
            />
            {renderError('score')}
          </div>
          <div className="min-w-0">
            <label htmlFor={wicketsId} className="mb-1 block text-xs font-bold text-mp-muted">
              Wickets lost
            </label>
            <input
              id={wicketsId}
              name="wickets"
              type="number"
              min={0}
              max={10}
              value={form.wickets}
              onChange={(event) => handleChange('wickets', event.target.value)}
              aria-invalid={Boolean(errors.wickets)}
              aria-describedby={errors.wickets ? 'wickets-error' : undefined}
              className={inputClassName}
              placeholder="5"
            />
            {renderError('wickets')}
          </div>
          <div className="min-w-0">
            <label htmlFor={oversCompletedId} className="mb-1 block text-xs font-bold text-mp-muted">
              Overs completed
            </label>
            <input
              id={oversCompletedId}
              name="oversCompleted"
              type="number"
              step="0.1"
              min={0}
              max={999.5}
              value={form.oversCompleted}
              onChange={(event) => handleChange('oversCompleted', event.target.value)}
              aria-invalid={Boolean(errors.oversCompleted)}
              aria-describedby={`overs-help${errors.oversCompleted ? ' oversCompleted-error' : ''}`}
              className={inputClassName}
              placeholder="14.3"
            />
            <p id="overs-help" className="mt-1.5 text-xs leading-snug text-mp-muted">
              14.3 means 14 overs + 3 balls.
            </p>
            {renderError('oversCompleted')}
          </div>
          <div className="min-w-0">
            <label htmlFor={totalOversId} className="mb-1 block text-xs font-bold text-mp-muted">
              Total overs
            </label>
            <input
              id={totalOversId}
              name="totalOvers"
              type="number"
              min={1}
              max={999}
              value={form.totalOvers}
              onChange={(event) => handleChange('totalOvers', event.target.value)}
              aria-invalid={Boolean(errors.totalOvers)}
              aria-describedby={errors.totalOvers ? 'totalOvers-error' : undefined}
              className={inputClassName}
              placeholder="20"
            />
            {renderError('totalOvers')}
          </div>
        </div>
      </fieldset>

      {/* Target Runs (Only for Chase) */}
      {form.isChase && (
        <div>
          <label htmlFor={targetId} className="mb-1 block text-xs font-bold text-mp-muted">
            Target runs
          </label>
          <input
            id={targetId}
            name="target"
            type="number"
            min={1}
            max={999}
            value={form.target}
            onChange={(event) => handleChange('target', event.target.value)}
            aria-invalid={Boolean(errors.target)}
            aria-describedby={errors.target ? 'target-error' : undefined}
            className={inputClassName}
            placeholder="195"
          />
          {renderError('target')}
        </div>
      )}

      {/* Submit Button */}
      <button
        data-testid="explain-match"
        type="submit"
        disabled={!isValid || isLoading}
        className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-mp-red bg-mp-red px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:border-mp-red-deep hover:bg-mp-red-deep disabled:cursor-not-allowed disabled:border-mp-rule disabled:bg-mp-soft disabled:text-mp-muted"
      >
        {isLoading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <Zap className="size-4" aria-hidden="true" />
            <span>Explain this match</span>
          </>
        )}
      </button>
    </form>
  );
}
