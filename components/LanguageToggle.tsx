'use client';

import React, { useEffect } from 'react';

interface LanguageToggleProps {
  language: 'hinglish' | 'english';
  onChange: (lang: 'hinglish' | 'english') => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('matchpulse_lang');
      if (saved === 'hinglish' || saved === 'english') {
        if (saved !== language) {
          onChange(saved);
        }
      }
    } catch {
      // sessionStorage unavailable (private browsing)
    }
  }, [onChange, language]);

  const handleSelect = (lang: 'hinglish' | 'english') => {
    onChange(lang);
    try {
      sessionStorage.setItem('matchpulse_lang', lang);
    } catch {
      // sessionStorage unavailable
    }
  };

  return (
    <div
      data-testid="language-toggle"
      className="inline-flex shrink-0 items-center rounded-full border border-mp-rule bg-mp-sheet p-1 shadow-sm"
      role="radiogroup"
      aria-label="Select explanation language"
    >
      <label
        className={`flex min-h-9 cursor-pointer items-center justify-center rounded-full px-3 text-xs font-bold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-mp-red-deep ${
          language === 'hinglish'
            ? 'bg-mp-score text-mp-paper'
            : 'text-mp-muted hover:text-mp-ink'
        }`}
      >
        <input
          type="radio"
          name="language"
          value="hinglish"
          checked={language === 'hinglish'}
          onChange={() => handleSelect('hinglish')}
          className="sr-only"
        />
        <span>Hinglish</span>
      </label>

      <label
        className={`flex min-h-9 cursor-pointer items-center justify-center rounded-full px-3 text-xs font-bold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-mp-red-deep ${
          language === 'english'
            ? 'bg-mp-score text-mp-paper'
            : 'text-mp-muted hover:text-mp-ink'
        }`}
      >
        <input
          type="radio"
          name="language"
          value="english"
          checked={language === 'english'}
          onChange={() => handleSelect('english')}
          className="sr-only"
        />
        <span>English</span>
      </label>
    </div>
  );
}
