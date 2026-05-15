# Observability & Analytics Implementation Plan

**Dreamer — Jungian Dreamwork App**

This plan defines how to instrument the app for product analytics, error monitoring, and AI performance observability. The approach follows the "ship → instrument → measure → iterate" mindset from the Inception-1 experimental feature doc, adapted to Dreamer's backendless, privacy-first, Firestore-based architecture.

**Core constraint:** no dream text, journal text, association text, or element labels may ever appear in any analytics or error event. Only counts, durations, enums, and boolean flags.

---

## 1. Stack Decision

| Concern | Tool | Rationale |
|---|---|---|
| Product analytics & funnels | **PostHog** (Cloud) | Client-side, self-serve, free tier covers MVP scale; built-in funnel/retention views; event-based; privacy-safe config available |
| Error monitoring | **Sentry** (Browser SDK) | Industry standard; captures stack traces, release tags, breadcrumbs; free tier sufficient |
| AI performance (latency, cost) | **PostHog custom events** | Since there is no backend, Datadog APM is unnecessary; PostHog can host AI-specific event charts for p95 latency, token cost, and failure rate |

No Datadog needed at MVP scale — the backendless architecture means there are no server metrics to collect. PostHog covers both product analytics and AI observability in one place.

---

## 2. Privacy Rules (Non-Negotiable)

These rules apply to every event, forever:

- **Never capture:** `rawText`, `journalText`, `associationText`, `hypothesisText`, element `label`, dream `mood` string, `lifeContext` string
- **Safe to capture:** counts (word count bucket, element count, association count), durations (ms), enums (`status`, `lens`, `emotionalValence`), booleans, numeric ratings
- **Word count bucketing:** if capturing length signal, use buckets — `<50`, `50-150`, `150-500`, `500+` — never the raw count
- **No user identity:** Firebase Anonymous UID may be passed to `identify()` as an opaque ID only; never email, name, or device fingerprint
- Pair every `capture()` with `identify()` traits: `{ plan: "byok", totalDreams, signupDate }` — no PII

---

## 3. File Structure

New files to create under `src/services/analytics/`:

```
src/services/analytics/
  client.ts          # PostHog init + typed capture() + identify() wrappers
  types.ts           # Discriminated union of all event payloads (compile-time safety)
  sentry.ts          # Sentry init + captureError() wrapper (no PII scrubbing needed)
  performance.ts     # AI stage timer utility: startTimer() → stopAndCapture()
  index.ts           # Re-exports
```

Sentry is initialized in `main.tsx` before the React tree. PostHog is initialized in `src/services/analytics/client.ts` and called from `main.tsx`.

---

## 4. Event Schema

All events are typed via a discriminated union in `types.ts`. No free-form strings.

### Layer 1 — User Lifecycle

```ts
analytics.capture("user_created", {
  authMethod: "anonymous",
})

analytics.capture("disclaimer_accepted", {
  sessionNumber: 1,
})
```

### Layer 2 — Session & Dream Activation

```ts
analytics.capture("session_started", {
  sessionNumber: number,       // total sessions for this user
  totalDreamsOnRecord: number, // dreams already in Firestore
})

analytics.capture("dream_capture_started", {
  sessionNumber: number,
})

analytics.capture("dream_submitted", {
  wordCountBucket: "<50" | "50-150" | "150-500" | "500+",
  hasLifeContext: boolean,
  hasMood: boolean,
})

// Fires once — the aha moment
analytics.capture("first_dream_completed", {
  minutesFromCaptureToDone: number,
})
```

### Layer 3 — Feature Interaction Events

```ts
// Dream Structuring
analytics.capture("structuring_triggered", { dreamId: string })
analytics.capture("element_edited",  { elementKind: ElementKind })
analytics.capture("element_deleted", { elementKind: ElementKind })
analytics.capture("element_added_manually", { elementKind: ElementKind })

// Associations
analytics.capture("association_added", {
  emotionalValence: "positive" | "negative" | "mixed",
  salience: 1 | 2 | 3 | 4 | 5,
})

// Interpretation
analytics.capture("interpretation_triggered", {
  associationCount: number,
  elementCount: number,
})
analytics.capture("hypothesis_feedback_given", {
  lens: HypothesisLens,   // "compensation" | "shadow" | etc.
  feedback: "resonates" | "does_not_fit",
  hypothesisIndex: number, // 0, 1, 2
})

// Integration
analytics.capture("integration_triggered", {})
analytics.capture("journal_saved", {
  wordCountBucket: "<50" | "50-150" | "150-500" | "500+",
})

// Navigation
analytics.capture("dream_history_opened", {
  totalDreamsOnRecord: number,
})
analytics.capture("past_dream_replayed", {})
```

### Layer 4 — AI-Specific Events

These are the most critical for cost control and latency SLAs.

```ts
analytics.capture("ai_stage_completed", {
  stage: "extract" | "interpret" | "integrate",
  latencyMs: number,
  promptTokens: number,
  completionTokens: number,
  model: string,           // e.g. "gpt-4o-mini"
  success: true,
})

analytics.capture("ai_stage_failed", {
  stage: "extract" | "interpret" | "integrate",
  errorKind: LlmErrorKind, // from existing llmClient.ts
  latencyMs: number,       // time until failure
})
```

---

## 5. AI Performance Utility

`performance.ts` wraps `callLlm()` timing so every call site gets instrumented consistently:

```ts
// src/services/analytics/performance.ts

export function startAiTimer() {
  const t0 = performance.now();
  return {
    stop: () => Math.round(performance.now() - t0),
  };
}
```

Usage pattern in each `*.service.ts`:

```ts
import { startAiTimer } from "@/services/analytics/performance";
import { analytics } from "@/services/analytics";

const timer = startAiTimer();
try {
  const result = await callLlm({ ... });
  analytics.capture("ai_stage_completed", {
    stage: "extract",
    latencyMs: timer.stop(),
    promptTokens: result.usage?.prompt_tokens ?? 0,
    completionTokens: result.usage?.completion_tokens ?? 0,
    model: options.model ?? "gpt-4o-mini",
    success: true,
  });
  return result;
} catch (err) {
  analytics.capture("ai_stage_failed", {
    stage: "extract",
    errorKind: err instanceof LlmError ? err.kind : "api_error",
    latencyMs: timer.stop(),
  });
  throw err;
}
```

The three services to instrument: `extractElements.service.ts`, `generateHypotheses.service.ts`, `generateIntegration.service.ts`.

---

## 6. Sentry Setup

```ts
// src/services/analytics/sentry.ts

import * as Sentry from "@sentry/browser";

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    // Never send dream text — beforeSend strips request bodies
    beforeSend(event) {
      // Strip any accidental body data
      if (event.request) delete event.request.data;
      return event;
    },
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1, // 10% of sessions for performance traces
  });
}

export function captureError(err: unknown, context?: Record<string, string | number | boolean>) {
  Sentry.captureException(err, { extra: context });
}
```

Call `initSentry()` in `main.tsx` before `initFirebase()`.

**Alert to configure in Sentry:** `ai_stage_failed` error spike — alert if error rate > 3% over a 1-hour window.

---

## 7. PostHog Setup

```ts
// src/services/analytics/client.ts

import posthog from "posthog-js";
import type { AnalyticsEvent } from "./types";

let initialized = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,         // disable — we instrument manually
    persistence: "localStorage+cookie",
    respect_dnt: true,
    session_recording: { maskAllInputs: true }, // never record dream text
  });
  initialized = true;
}

export function identifyUser(uid: string, traits: {
  plan: "byok";
  totalDreams: number;
  signupDate: string; // ISO date
}) {
  if (!initialized) return;
  posthog.identify(uid, traits);
}

export const analytics = {
  capture<E extends AnalyticsEvent>(event: E["event"], properties: Omit<E, "event">) {
    if (!initialized) return;
    posthog.capture(event, properties);
  },
};
```

Call `initAnalytics()` in `main.tsx` after `initFirebase()`.

---

## 8. Integration Points

Where to wire events in the existing codebase:

| File | Events to add |
|---|---|
| `main.tsx` | `initSentry()`, `initAnalytics()` |
| `app/config/firebase.ts` — after `ensureAnonymousAuth` resolves | `identifyUser(uid, ...)`, `user_created` (first time only) |
| `features/dreamCapture/ui/DreamEntryPage.tsx` | `dream_capture_started`, `dream_submitted` |
| `features/dreamCapture/service/dreamCapture.service.ts` | persist triggers |
| `features/dreamStructuring/service/extractElements.service.ts` | `structuring_triggered`, `ai_stage_completed/failed` |
| `features/dreamStructuring/ui/DreamBreakdownPage.tsx` | `element_edited`, `element_deleted`, `element_added_manually` |
| `features/dreamAssociations/ui/AssociationsPage.tsx` | `association_added` |
| `features/dreamInterpretation/service/generateHypotheses.service.ts` | `interpretation_triggered`, `ai_stage_completed/failed` |
| `features/dreamInterpretation/ui/InterpretationPage.tsx` | `hypothesis_feedback_given` |
| `features/dreamIntegration/service/generateIntegration.service.ts` | `integration_triggered`, `ai_stage_completed/failed` |
| `features/dreamIntegration/ui/DreamIntegrationPage.tsx` | `journal_saved` |
| `screens/DashboardPage.tsx` | `session_started`, `dream_history_opened` |

---

## 9. Environment Variables

Add to `.env.example`:

```
VITE_POSTHOG_KEY=phc_...
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_APP_VERSION=0.1.0
```

---

## 10. Key Funnels & Dashboards to Build in PostHog

Once events are live, configure these views:

**Activation funnel (primary):**
`dream_capture_started` → `dream_submitted` → `structuring_triggered` → `interpretation_triggered` → `integration_triggered` → `first_dream_completed`

**AI health dashboard:**
- p95 latency per stage (extract / interpret / integrate)
- Failure rate per stage over 7 days
- Daily token spend (promptTokens + completionTokens) per stage

**Engagement signals:**
- `hypothesis_feedback_given` rate (what % of users rate hypotheses)
- `journal_saved` rate (what % complete integration)
- `past_dream_replayed` as a retention proxy

**Retention (if PostHog plan allows):**
- D1, D7 retention cohorts seeded from `user_created`

---

## 11. Implementation Order

1. **Setup & plumbing** — add PostHog and Sentry packages; create `src/services/analytics/` files; wire `main.tsx`; add env vars
2. **AI observability first** — instrument the three `*.service.ts` AI calls (highest leverage, easiest to isolate)
3. **Activation funnel** — wire `DreamEntryPage`, `DreamBreakdownPage`, `InterpretationPage`, `DreamIntegrationPage`
4. **User identity** — wire `identifyUser()` after anonymous auth resolves; add `user_created` on first session
5. **Dashboard config** — build the PostHog funnel and AI health charts
6. **Alert config** — set up Sentry alert for AI error spike (>3%, 1h window)

---

## 12. Success Criteria for the Stack Itself

| Metric | Target |
|---|---|
| All 4 AI stage events firing in prod | Day 1 after deploy |
| Activation funnel visible end-to-end | Week 1 |
| AI p95 latency visible per stage | Week 1 |
| AI failure rate < 3% baseline | Ongoing |
| Zero dream content in Sentry or PostHog | Always — verified by manual event review |
