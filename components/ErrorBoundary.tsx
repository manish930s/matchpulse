'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <section role="alert" className="my-5 rounded-[20px] border border-mp-red-deep/25 bg-mp-sheet p-6 text-center shadow-mp-sheet">
          <div aria-hidden="true" className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-mp-red-wash text-xl text-mp-red-deep">
            <TriangleAlert className="size-5" />
          </div>
          <h2 className="mb-2 text-lg font-extrabold text-mp-ink">Something went wrong</h2>
          <p className="mb-4 text-sm text-mp-muted">
            {this.state.error?.message || 'An unexpected error occurred while rendering.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="min-h-11 rounded-full bg-mp-red px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-mp-red-deep"
          >
            Try Again
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
