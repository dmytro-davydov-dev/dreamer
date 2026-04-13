# TODO.md — Dreamer MVP Progress

> Last updated: 2026-04-13  
> Jira project: [DRM board](https://dd77ua.atlassian.net/jira/software/projects/DRM/boards/35)

---

## ✅ Done

| Ticket | Summary | Key files |
|--------|---------|-----------|
| DRM-35 | Firebase initializer + env configuration | `src/app/config/firebase.ts` |
| DRM-8  | Technical Foundation (Vite + React + TS + Firebase) | `package.json`, `vite.config.ts`, `tsconfig.json` |
| DRM-16 | Firestore schema (collections + field definitions) | `src/services/firestore/firestoreRepo.ts`, `converters.ts`, `paths.ts` |
| DRM-18 | TypeScript domain models from Firestore schema | `src/shared/types/domain.ts`, `src/entities/*/model/types.ts` |
| DRM-19 | Typed Firestore repository layer (CRUD + real-time queries) | `src/services/firestore/firestoreRepo.ts` |
| DRM-9  | Dashboard: Record Dream + Dream History list | `src/screens/DashboardPage.tsx` |
| DRM-10 | Dream Entry: capture + autosave + Continue | `src/features/dreamCapture/ui/DreamEntryPage.tsx`, `dreamCapture.service.ts` |
| DRM-11 | Dream Breakdown: editable extracted elements UI | `src/features/dreamStructuring/ui/DreamBreakdownPage.tsx` |
| DRM-20 | Extractor AI stage (no interpretation, descriptive only) | `src/services/ai/client/llmClient.ts`, `src/features/dreamStructuring/service/extractElements.service.ts` |
| DRM-23 | AI guardrails & prompt constraints | `src/services/ai/prompts/extractor.ts`, `src/services/ai/schemas/extractor.schema.ts` |
| DRM-14 | Integration: reflective prompts + journaling UI | `src/features/dreamIntegration/ui/DreamIntegrationPage.tsx` |
| DRM-7  | BYOK — Bring Your Own Key (localStorage key management) | `src/features/byok/service/keyStorage.service.ts` |
| DRM-24 | BYOK Settings UI (password input, show/hide, save/clear) | `src/features/byok/ui/SettingsPage.tsx` |
| DRM-25 | AI step gating when BYOK key missing | `src/features/byok/ui/ByokGate.tsx` |
| DRM-26 | BYOK error handling (invalid key / rate limit / network) | `src/services/ai/client/llmClient.ts` — `LlmError` class |
| DRM-27 | UX_FLOW.md updated with BYOK section + status badges | `documentation/UX_FLOW.md` |
| DRM-28 | Design tokens: `design-tokens.json` + `DESIGN_TOKENS.md` | `documentation/design-tokens.json`, `DESIGN_TOKENS.md` |
| DRM-21 | Interpreter stage — hypotheses only (AI), framing + evidence ref normalization | `src/features/dreamInterpretation/service/generateHypotheses.service.ts`, `src/services/ai/prompts/interpreter.ts`, `src/services/ai/schemas/interpreter.schema.ts` |
| DRM-13 | Interpretation screen: 2–3 expandable hypothesis cards + feedback UX | `src/features/dreamInterpretation/ui/InterpretationPage.tsx`, `src/entities/hypothesis/ui/HypothesisCard.tsx` |
| DRM-22 | Integrator stage — reflection + small practice (AI service + guardrails + persistence) | `src/features/dreamIntegration/service/generateIntegration.service.ts`, `src/services/ai/prompts/integrator.ts`, `src/services/ai/schemas/integrator.schema.ts`, `src/features/dreamIntegration/service/generateIntegration.service.test.ts` |

---

## 🔲 Not Started / In Progress

### High Priority — blocks end-to-end MVP flow

| Ticket | Summary | Why it matters |
|--------|---------|----------------|
| **DRM-17** | Firestore security rules (per-UID isolation) | Required before any public deployment; currently no `firestore.rules` |
| **DRM-33** | Disclaimer gating (first-use modal + persistent access) | MVP ethics requirement; must appear before first AI call |

### Medium Priority — important for completeness

| Ticket | Summary | Why it matters |
|--------|---------|----------------|
| **DRM-15** | Dream Session View: read-only replay of full session | Lets users return to past dreams; closes the full UX loop |
| **DRM-34** | Distressing content handling (UI copy + safe fallback) | Safety requirement; graceful fallback if dream content triggers distress |
| **DRM-36** | Basic error reporting without PII (no dream text logged) | Observability; needed before production deployment |

### Lower Priority — design / polish

| Ticket | Summary | Notes |
|--------|---------|-------|
| DRM-29 | Figma file setup (pages + naming conventions) | Design work, not blocking development |
| DRM-30 | Figma Atoms (buttons, inputs, badges, icons) | Design work |
| DRM-31 | Figma Molecules (cards, list items) | Design work |
| DRM-32 | Figma screens: Core flow + edge states | Design work |

### Epics (parent issues — close when children are done)

| Ticket | Epic | Status |
|--------|------|--------|
| DRM-1 | MVP Core | Partially done |
| DRM-2 | Data & Architecture | Partially done |
| DRM-3 | UX Flow — Dream Sessions | Partially done |
| DRM-4 | AI Pipeline — Client Orchestration | Partially done |
| DRM-5 | Design System — Tokens & Figma | Partially done |
| DRM-6 | Safety, Ethics & Disclaimers | Not started |

---

## 🎯 Recommended Next Steps

Work in this order to reach a complete end-to-end MVP:

**1. DRM-17 — Firestore security rules**
Add `firestore.rules` enforcing per-UID isolation: `allow read, write: if request.auth != null && request.auth.uid == resource.data.userId`. Run `firebase emulators:start` to validate before deploy.

**2. DRM-33 — Disclaimer gating**
Implement a one-time modal on first session that explains: not therapy, not medical advice, hypotheses only, data stays local. Persist acknowledgement to localStorage. Also expose a persistent "About / Disclaimer" link in nav.

**3. DRM-15 — Dream Session View (read-only replay)**
A route like `/dreams/:id/session` that renders the full session in read-only mode: dream text, elements, associations, hypotheses, integration. Needed for returning users.

**4. Wire Integration page to DRM-22 service**
`generateIntegration.service.ts` is implemented and tested, but `DreamIntegrationPage` is still mostly static. Connect the page to load context from Firestore, call the service via BYOK gating, and render generated reflective questions + suggestion from persisted `/integration/main`.

---

## Architecture notes

- **No backend** — all AI calls go client → OpenAI-compatible API directly (BYOK)
- **Auth** — Firebase Anonymous Auth (no sign-up friction)
- **State** — Firestore real-time listeners; no global client-side store
- **AI** — `callLlm<T>()` + `response_format: json_schema` structured outputs
- **Error model** — `LlmError` with kinds: `invalid_key | rate_limit | quota_exceeded | model_not_found | network | parse_error | api_error`
- **FSD layers**: `screens → features → entities → services → shared`
