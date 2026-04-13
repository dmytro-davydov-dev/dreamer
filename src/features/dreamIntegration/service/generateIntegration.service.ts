/**
 * src/features/dreamIntegration/service/generateIntegration.service.ts
 *
 * Orchestrates the Integrator AI stage.
 */

import type { Firestore } from "firebase/firestore";

import { callLlm, type LlmCallOptions } from "../../../services/ai/client/llmClient";
import {
  INTEGRATOR_SYSTEM_PROMPT,
  buildIntegratorUserPrompt,
} from "../../../services/ai/prompts/integrator";
import {
  INTEGRATOR_SCHEMA,
  type IntegratorOutput,
} from "../../../services/ai/schemas/integrator.schema";
import {
  getIntegration,
  upsertIntegration,
  updateDream,
} from "../../../services/firestore/firestoreRepo";
import { nowTs } from "../../../services/firestore/timestamps";
import type {
  AssociationDoc,
  AssociationId,
  DreamDoc,
  DreamId,
  HypothesisDoc,
  HypothesisId,
  IntegrationDoc,
  UID,
} from "../../../shared/types/domain";

export interface GenerateIntegrationOptions {
  db: Firestore;
  uid: UID;
  dreamId: DreamId;
  dream: DreamDoc;
  hypotheses: Array<{ id: HypothesisId; data: HypothesisDoc }>;
  associations: Array<{ id: AssociationId; data: AssociationDoc }>;
  selectedHypothesisIds?: HypothesisId[];
  selectedAssociationIds?: AssociationId[];
  apiKey: string;
  model?: string;
}

export interface GenerateIntegrationResult {
  integration: IntegrationDoc;
}

const DEFAULT_QUESTIONS = [
  "What feels most alive or unfinished about this dream right now?",
  "What small step could honor the feeling this dream leaves you with?",
];

const PRESCRIPTIVE_RE = /\b(you should|you must|must|should|need to|have to|always|never)\b/i;
const NON_PRESCRIPTIVE_PREFIX_RE = /^(if it feels|you might|you could|one gentle option|perhaps)/i;

function normalizeQuestion(text: string): string | null {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("?")) return trimmed;
  return `${trimmed}?`;
}

function enforceNonPrescriptiveSuggestion(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "If it feels supportive, you might try a brief grounding pause and note what shifts inside.";
  }

  const softened = PRESCRIPTIVE_RE.test(trimmed)
    ? trimmed
        .replace(/\byou should\b/gi, "you might")
        .replace(/\byou must\b/gi, "you might")
        .replace(/\bmust\b/gi, "might")
        .replace(/\bshould\b/gi, "might")
        .replace(/\bneed to\b/gi, "could")
        .replace(/\bhave to\b/gi, "could")
        .replace(/\balways\b/gi, "often")
        .replace(/\bnever\b/gi, "not necessarily")
    : trimmed;

  if (NON_PRESCRIPTIVE_PREFIX_RE.test(softened)) {
    return softened;
  }

  return `If it feels right, you might ${softened.charAt(0).toLowerCase()}${softened.slice(1)}`;
}

export async function generateIntegration(
  options: GenerateIntegrationOptions
): Promise<GenerateIntegrationResult> {
  const {
    db,
    uid,
    dreamId,
    dream,
    hypotheses,
    associations,
    selectedHypothesisIds,
    selectedAssociationIds,
    apiKey,
    model,
  } = options;

  const selectedHypothesisSet = selectedHypothesisIds
    ? new Set(selectedHypothesisIds)
    : null;
  const selectedAssociationSet = selectedAssociationIds
    ? new Set(selectedAssociationIds)
    : null;

  const selectedHypotheses = hypotheses
    .filter((h) => !selectedHypothesisSet || selectedHypothesisSet.has(h.id))
    .map((h) => ({
      id: h.id,
      lens: h.data.lens,
      hypothesisText: h.data.hypothesisText,
      reflectiveQuestion: h.data.reflectiveQuestion,
    }));

  const selectedAssociations = associations
    .filter((a) => !selectedAssociationSet || selectedAssociationSet.has(a.id))
    .map((a) => ({
      id: a.id,
      elementLabel: a.data.elementId,
      associationText: a.data.associationText,
      emotionalValence: a.data.emotionalValence,
      salience: a.data.salience,
    }));

  const llmOptions: LlmCallOptions = {
    apiKey,
    model: model ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: INTEGRATOR_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildIntegratorUserPrompt({
          rawText: dream.rawText,
          selectedHypotheses,
          selectedAssociations,
        }),
      },
    ],
    jsonSchema: {
      name: "integrator_output",
      schema: INTEGRATOR_SCHEMA as Record<string, unknown>,
      strict: true,
    },
    temperature: 0.4,
    maxTokens: 1024,
  };

  const response = await callLlm<IntegratorOutput>(llmOptions);

  if (!response.reflectiveQuestions || !Array.isArray(response.reflectiveQuestions)) {
    throw new Error("Integrator returned an unexpected response shape.");
  }

  const normalizedQuestions = Array.from(
    new Set(response.reflectiveQuestions.map(normalizeQuestion).filter((q): q is string => !!q))
  ).slice(0, 2);

  const reflectiveQuestions =
    normalizedQuestions.length > 0 ? normalizedQuestions : DEFAULT_QUESTIONS;

  const practiceSuggestion = enforceNonPrescriptiveSuggestion(
    response.practiceSuggestion
  );

  const existing = await getIntegration(db, uid, dreamId);
  const createdAt = existing?.createdAt ?? nowTs();

  const integration: IntegrationDoc = {
    reflectiveQuestions,
    practiceSuggestion,
    journalText: existing?.journalText,
    createdAt,
    updatedAt: nowTs(),
  };

  await upsertIntegration(db, uid, dreamId, integration);
  await updateDream(db, uid, dreamId, { status: "integrated" });

  return { integration };
}