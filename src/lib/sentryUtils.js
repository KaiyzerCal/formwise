import * as Sentry from '@sentry/react';

/**
 * Report a non-fatal error to Sentry with context.
 * Use this instead of console.error in pipeline code.
 * Safe to call even if Sentry is not initialised.
 */
export function captureError(error, context = {}) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(error);
  });
}

/**
 * Add a breadcrumb (lightweight event trail) — use in session lifecycle hooks.
 */
export function addBreadcrumb(message, data = {}) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}