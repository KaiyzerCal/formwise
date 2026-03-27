import React from 'react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { base44 } from '@/api/base44Client';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    try {
      base44.analytics.track({
        eventName: 'error_boundary_triggered',
        properties: {
          section: this.props.section || 'unknown',
          error_message: error?.message?.slice(0, 200) || 'unknown',
        },
      });
    } catch (_) {}
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full min-h-[200px] p-8"
        style={{ background: COLORS.bg }}
        role="alert"
        aria-live="assertive"
      >
        <div
          className="max-w-sm w-full rounded-lg border p-6 text-center space-y-4"
          style={{ background: COLORS.surface, borderColor: `${COLORS.fault}40` }}
        >
          <div className="text-[9px] tracking-[0.25em] uppercase font-bold" style={{ color: COLORS.fault, fontFamily: FONT.mono }}>
            ⚠ SYSTEM ERROR
          </div>
          <p className="text-[11px] tracking-[0.1em] uppercase" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
            Something went wrong
            {this.props.section ? ` in ${this.props.section}` : ''}
          </p>
          {this.state.error?.message && (
            <p className="text-[9px] px-3 py-2 rounded border" style={{
              color: COLORS.textTertiary,
              borderColor: COLORS.border,
              background: COLORS.bg,
              fontFamily: FONT.mono,
              wordBreak: 'break-all',
            }}>
              {this.state.error.message.slice(0, 120)}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="w-full py-2.5 rounded border text-[10px] font-bold tracking-[0.15em] uppercase transition-colors"
            style={{
              borderColor: COLORS.goldBorder,
              color: COLORS.gold,
              background: COLORS.goldDim,
              fontFamily: FONT.mono,
            }}
            aria-label="Retry — reload this section"
          >
            ↺ RETRY
          </button>
        </div>
      </div>
    );
  }
}