'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Component Error</h2>
            <p className="text-gray-500 mb-4 text-sm">Something went wrong while loading this section.</p>
            <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="border-gray-200 text-sm"
            >
                Try Again
            </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
