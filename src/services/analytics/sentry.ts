import * as Sentry from "@sentry/browser";

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    beforeSend(event) {
      if (event.request) delete event.request.data;
      return event;
    },
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

export function captureError(
  err: unknown,
  context?: Record<string, string | number | boolean>
) {
  Sentry.captureException(err, { extra: context });
}
