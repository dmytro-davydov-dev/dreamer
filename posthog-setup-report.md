<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. Below is a summary of all changes made.

## Summary of changes

**Environment variables** — Added `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to `.env`. Values are set via environment variables and must not be hardcoded in source files.

**`src/services/analytics/client.ts`** — Fixed the previously hardcoded `api_host` value to read from `VITE_POSTHOG_HOST` so all events route to the correct data region as configured in the environment.

**`src/screens/DashboardPage.tsx`** — Added two new capture calls:
- `past_dream_replayed` fires in the `handleDreamClick` handler whenever a user taps a past dream in their history list.
- `first_dream_completed` fires during the initial session load when exactly one dream exists, including a calculated `minutesFromCaptureToDone` derived from the first dream's `createdAt` timestamp.

**`src/screens/LoginPage.tsx`** — Added `identifyUser` calls after successful email sign-in and sign-up so that Firebase UIDs are linked to PostHog person profiles at the moment of authentication.

**`src/features/dreamIntegration/ui/DreamIntegrationPage.tsx`** — Replaced the `useEffect`-based `integration_triggered` capture (which required an ESLint-disable comment) with a `useRef` guard that fires the capture during the first render when `dreamId` is present. `useEffect` import removed.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `past_dream_replayed` | User clicks a past dream from the Dashboard history list | `src/screens/DashboardPage.tsx` |
| `first_dream_completed` | Fires once when the user's dream count first reaches 1, with time elapsed since capture | `src/screens/DashboardPage.tsx` |
| `identifyUser` (sign-in) | Identifies the Firebase UID in PostHog after email sign-in | `src/screens/LoginPage.tsx` |
| `identifyUser` (sign-up) | Identifies the Firebase UID in PostHog after email sign-up | `src/screens/LoginPage.tsx` |
| `integration_triggered` | Refactored: now fires via `useRef` guard on first render rather than `useEffect` | `src/features/dreamIntegration/ui/DreamIntegrationPage.tsx` |

### Pre-existing events (already well-instrumented)

| Event | File |
|---|---|
| `user_created` | `src/main.tsx` |
| `session_started` | `src/screens/DashboardPage.tsx` |
| `dream_history_opened` | `src/screens/DashboardPage.tsx` |
| `dream_capture_started` | `src/features/dreamCapture/ui/DreamEntryPage.tsx` |
| `dream_submitted` | `src/features/dreamCapture/ui/DreamEntryPage.tsx` |
| `structuring_triggered` | `src/features/dreamStructuring/ui/DreamBreakdownPage.tsx` |
| `element_edited` | `src/features/dreamStructuring/ui/DreamBreakdownPage.tsx` |
| `element_deleted` | `src/features/dreamStructuring/ui/DreamBreakdownPage.tsx` |
| `element_added_manually` | `src/features/dreamStructuring/ui/DreamBreakdownPage.tsx` |
| `association_added` | `src/features/dreamAssociations/ui/AssociationsPage.tsx` |
| `interpretation_triggered` | `src/features/dreamInterpretation/ui/InterpretationPage.tsx` |
| `hypothesis_feedback_given` | `src/features/dreamInterpretation/ui/InterpretationPage.tsx` |
| `journal_saved` | `src/features/dreamIntegration/ui/DreamIntegrationPage.tsx` |
| `ai_stage_completed` | `src/features/dreamStructuring/service/extractElements.service.ts`, `src/features/dreamInterpretation/service/generateHypotheses.service.ts`, `src/features/dreamIntegration/service/generateIntegration.service.ts` |
| `ai_stage_failed` | same as above |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/684958)
- [Dream Journey Funnel](/insights/5sB4Z8br) — Conversion from dream submitted → structured → interpreted → integrated
- [Daily Active Users](/insights/R1ONzLuE) — Unique users with an active session per day
- [Dream Submissions Over Time](/insights/nwoDTPuf) — Total dreams submitted per day (bar chart)
- [AI Pipeline Health](/insights/PtruMTYI) — Successful vs failed AI stage calls
- [Feature Engagement](/insights/MveDZ8tH) — Associations added, hypothesis feedback, and journal saves per day

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-react-router-7-declarative/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
