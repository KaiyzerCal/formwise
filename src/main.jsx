import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react';
import App from '@/App.jsx'
import '@/index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    if (event.request?.data) delete event.request.data;
    return event;
  },
});

const SentryApp = Sentry.withProfiler(App);

ReactDOM.createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary fallback={<p style={{color:'#fff',padding:24}}>Something went wrong. Please refresh.</p>}>
    <SentryApp />
  </Sentry.ErrorBoundary>
)