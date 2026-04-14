/* src/shared/types/domain.ts
 * Dreamer — Firestore Domain Models
 * Firestore-first, backendless MVP
 */

import type { Timestamp } from "firebase/firestore";

/** -----------------------------
 *  Shared / primitives
 *  ----------------------------- */

export type UID = string;
export type DreamId = string;
export type ElementId = string;
export type AssociationId = string;
export type HypothesisId = string;

export type ISO8601 = string;

/** Firestore timestamps in domain models are represented as Firebase Timestamp */
export type FsTimestamp = Timestamp;

/** Status lifecycle derived from persisted artifacts */
export type DreamStatus =
  | "draft"
  | "structured"
  | "associated"
  | "interpreted"
  | "integrated";

export type ElementKind =
  | "symbol"
  | "character"
  | "place"
  | "action"
  | "emotion"
  | "shift";

export type ElementSource = "ai" | "user";

export type EmotionalValence = "positive" | "negative" | "mixed";

export type JungianLens =
  | "compensation"
  | "shadow"
  | "archetypal_dynamics"
  | "relational_anima_animus"
  | "individuation";

export type HypothesisFeedback = "resonates" | "does_not_fit";

/** Utility: safe-ish string */
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number";

/** -----------------------------
 *  Firestore document models
 *  ----------------------------- */

/** /users/{uid} */
export interface UserDoc {
  createdAt: FsTimestamp;
  lastSeenAt?: FsTimestamp;
  settings?: {
    language?: string;
    disclaimerAcceptedAt?: FsTimestamp;
  };
}

/** /users/{uid}/dreams/{dreamId} */
export interface DreamDoc {
  rawText: string;
  dreamedAt: FsTimestamp;
  createdAt: FsTimestamp;
  updatedAt?: FsTimestamp;

  mood?: string;
  lifeContext?: string;

  status: DreamStatus;
}

/** /users/{uid}/dreams/{dreamId}/elements/{elementId} */
export interface DreamElementDoc {
  kind: ElementKind;
  label: string;

  /** short anchors/excerpts; keep short to avoid storing large text fragments */
  evidence?: string[];

  /** for UI ordering within kind buckets */
  order?: number;

  source: ElementSource;

  /** soft delete (hide from UI, preserve for undo/audit) */
  deleted?: boolean;

  createdAt: FsTimestamp;
  updatedAt?: FsTimestamp;
}

/** /users/{uid}/dreams/{dreamId}/associations/{associationId} */
export interface AssociationDoc {
  /** references elements/{elementId}; typically kind="symbol" */
  elementId: ElementId;

  associationText: string;

  emotionalValence: EmotionalValence;

  /** 1..5 */
  salience: number;

  createdAt: FsTimestamp;
  updatedAt?: FsTimestamp;
}

/** Hypothesis evidence item stored inside hypothesis doc */
export type HypothesisEvidenceType = "dream_text" | "element" | "association";

export interface HypothesisEvidence {
  type: HypothesisEvidenceType;
  refId: string; // elementId or associationId, or "dream_text" anchor id
  quote: string; // short excerpt/anchor
}

/** /users/{uid}/dreams/{dreamId}/hypotheses/{hypothesisId} */
export interface HypothesisDoc {
  lens: JungianLens;
  hypothesisText: string;
  evidence: HypothesisEvidence[];
  reflectiveQuestion: string;

  /** optional user response */
  userFeedback?: HypothesisFeedback | null;

  createdAt: FsTimestamp;
  updatedAt?: FsTimestamp;
}

/** /users/{uid}/dreams/{dreamId}/integration/main */
export interface IntegrationDoc {
  reflectiveQuestions: string[]; // 1..2 in MVP
  practiceSuggestion: string;
  journalText?: string;

  createdAt: FsTimestamp;
  updatedAt?: FsTimestamp;
}

/** -----------------------------
 *  Aggregate "Session" types (app-level)
 *  ----------------------------- */

export interface DreamSession {
  dreamId: DreamId;
  dream: DreamDoc;

  elements: Array<{ id: ElementId; data: DreamElementDoc }>;
  associations: Array<{ id: AssociationId; data: AssociationDoc }>;
  hypotheses: Array<{ id: HypothesisId; data: HypothesisDoc }>;
  integration: { id: "main"; data: IntegrationDoc } | null;
}

/** -----------------------------
 *  Minimal runtime validators (optional)
 *  Use these when reading unknown DocumentData.
 *  ----------------------------- */

export function isDreamDoc(v: unknown): v is DreamDoc {
  const x = v as Partial<DreamDoc>;
  return (
    !!x &&
    isString(x.rawText) &&
    !!x.dreamedAt &&
    !!x.createdAt &&
    isString(x.status)
  );
}

export function isDreamElementDoc(v: unknown): v is DreamElementDoc {
  const x = v as Partial<DreamElementDoc>;
  return (
    !!x &&
    isString(x.kind) &&
    isString(x.label) &&
    isString(x.source) &&
    !!x.createdAt
  );
}

export function isAssociationDoc(v: unknown): v is AssociationDoc {
  const x = v as Partial<AssociationDoc>;
  return (
    !!x &&
    isString(x.elementId) &&
    isString(x.associationText) &&
    isString(x.emotionalValence) &&
    isNumber(x.salience) &&
    !!x.createdAt
  );
}

export function isHypothesisEvidence(v: unknown): v is HypothesisEvidence {
  const x = v as Partial<HypothesisEvidence>;
  return (
    !!x && isString(x.type) && isString(x.refId) && isString(x.quote)
  );
}

export function isHypothesisDoc(v: unknown): v is HypothesisDoc {
  const x = v as Partial<HypothesisDoc>;
  return (
    !!x &&
    isString(x.lens) &&
    isString(x.hypothesisText) &&
    Array.isArray(x.evidence) &&
    x.evidence.every(isHypothesisEvidence) &&
    isString(x.reflectiveQuestion) &&
    !!x.createdAt
  );
}

export function isIntegrationDoc(v: unknown): v is IntegrationDoc {
  const x = v as Partial<IntegrationDoc>;
  return (
    !!x &&
    Array.isArray(x.reflectiveQuestions) &&
    x.reflectiveQuestions.every(isString) &&
    isString(x.practiceSuggestion) &&
    !!x.createdAt
  );
}

/** -----------------------------
 *  Defaults / constructors (recommended)
 *  ----------------------------- */

export const defaults = {
  dream: (params: {
    rawText: string;
    dreamedAt: FsTimestamp;
    createdAt: FsTimestamp;
    mood?: string;
    lifeContext?: string;
  }): DreamDoc => ({
    rawText: params.rawText,
    dreamedAt: params.dreamedAt,
    createdAt: params.createdAt,
    ...(params.mood !== undefined ? { mood: params.mood } : {}),
    ...(params.lifeContext !== undefined ? { lifeContext: params.lifeContext } : {}),
    status: "draft",
  }),

  element: (params: {
    kind: ElementKind;
    label: string;
    createdAt: FsTimestamp;
    source: ElementSource;
    order?: number;
    evidence?: string[];
  }): DreamElementDoc => ({
    kind: params.kind,
    label: params.label,
    createdAt: params.createdAt,
    source: params.source,
    order: params.order,
    evidence: params.evidence,
    deleted: false,
  }),
} as const;
