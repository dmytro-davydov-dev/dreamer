/**
 * src/features/dreamInterpretation/service/generateHypotheses.service.ts
 *
 * Orchestrates the Interpreter AI stage
 */

import type { Firestore } from "firebase/firestore";
import { doc, collection } from "firebase/firestore";

import { callLlm, type LlmCallOptions } from "../../../services/ai/client/llmClient";
import {
  INTERPRETER_SYSTEM_PROMPT,
  buildInterpreterUserPrompt,
} from "../../../services/ai/prompts/interpreter";
import {
  INTERPRETER_SCHEMA,
  type InterpreterOutput,
} from "../../../services/ai/schemas/interpreter.schema";
import {
  bulkUpsertHypotheses,
  updateDream,
} from "../../../services/firestore/firestoreRepo";
import { nowTs } from "../../../services/firestore/timestamps";
import type {
  AssociationDoc,
  AssociationId,
  DreamDoc,
  DreamElementDoc,
  DreamId,
  ElementId,
  HypothesisDoc,
  HypothesisId,
  JungianLens,
  UID,
} from "../../../shared/types/domain";

export interface GenerateHypothesesOptions {
  db: Firestore;
  uid: UID;
  dreamId: DreamId;
  dream: DreamDoc;
  elements: Array<{ id: ElementId; data: DreamElementDoc }>;
  associations: Array<{ id: AssociationId; data: AssociationDoc }>;
  apiKey: string;
  model?: string;
}

export interface GenerateHypothesesResult {
  hypotheses: Array<{ id: HypothesisId; data: HypothesisDoc }>;
}

const HYPOTHESIS_PREFIX_RE =
  /^(could be|one possibility is|this could suggest|the dream may point to)/i;

const INTERPRETER_LENSES: JungianLens[] = [
  "compensation",
  "shadow",
  "archetypal_dynamics",
  "relational_anima_animus",
  "individuation",
];

function enforceHypothesisFraming(text: string): string {
  const trimmed = text.trim();
  if (HYPOTHESIS_PREFIX_RE.test(trimmed)) {
    return trimmed;
  }
  return `Could be that ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

function fallbackDreamQuote(rawText: string): string {
  const compact = rawText.replace(/\s+/g, " ").trim();
  if (!compact) return "dream excerpt";
  return compact.slice(0, 140);
}

export async function generateHypotheses(
  options: GenerateHypothesesOptions
): Promise<GenerateHypothesesResult> {
  const { db, uid, dreamId, dream, elements, associations, apiKey, model } = options;

  const elementMap = new Map<ElementId, string>();
  const elementLabelToId = new Map<string, ElementId>();
  elements.forEach((el) => {
    elementMap.set(el.id, el.data.label);
    elementLabelToId.set(el.data.label.trim().toLowerCase(), el.id);
  });

  const associationTextToId = new Map<string, AssociationId>();
  associations.forEach((assoc) => {
    associationTextToId.set(assoc.data.associationText.trim().toLowerCase(), assoc.id);
  });

  const validElementIds = new Set(elements.map((el) => el.id));
  const validAssociationIds = new Set(associations.map((assoc) => assoc.id));

  const associationInputs = associations.map((assoc) => {
    const elementLabel = elementMap.get(assoc.data.elementId) || "Unknown";
    return {
      id: assoc.id,
      elementId: assoc.data.elementId,
      elementLabel,
      associationText: assoc.data.associationText,
      emotionalValence: assoc.data.emotionalValence,
      salience: assoc.data.salience,
    };
  });

  const llmOptions: LlmCallOptions = {
    apiKey,
    model: model ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: INTERPRETER_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildInterpreterUserPrompt({
          rawText: dream.rawText,
          elements: elements.map((el) => ({
            id: el.id,
            kind: el.data.kind,
            label: el.data.label,
            evidence: el.data.evidence,
          })),
          associations: associationInputs,
        }),
      },
    ],
    jsonSchema: {
      name: "interpreter_output",
      schema: INTERPRETER_SCHEMA as Record<string, unknown>,
      strict: true,
    },
    temperature: 0.4,
    maxTokens: 2048,
  };

  const response = await callLlm<InterpreterOutput>(llmOptions);

  if (!response.hypotheses || !Array.isArray(response.hypotheses)) {
    throw new Error("Interpreter returned an unexpected response shape.");
  }

  const createdAt = nowTs();
  const hypothesesWithIds: Array<{ id: HypothesisId; data: HypothesisDoc }> =
    response.hypotheses.map((hyp) => {
      const id = doc(collection(db, "_")).id as HypothesisId;

      const lens = INTERPRETER_LENSES.includes(hyp.lens as JungianLens)
        ? (hyp.lens as JungianLens)
        : "compensation";

      const normalizedEvidence = hyp.evidence
        .map((ev) => {
          const quote = ev.quote.trim() || fallbackDreamQuote(dream.rawText);

          if (ev.type === "dream_text") {
            return {
              type: "dream_text" as const,
              refId: "dream_text",
              quote,
            };
          }

          if (ev.type === "element") {
            if (validElementIds.has(ev.refId as ElementId)) {
              return {
                type: "element" as const,
                refId: ev.refId,
                quote,
              };
            }

            const resolvedId = elementLabelToId.get(ev.refId.trim().toLowerCase());
            if (resolvedId) {
              return {
                type: "element" as const,
                refId: resolvedId,
                quote,
              };
            }

            return null;
          }

          if (ev.type === "association") {
            if (validAssociationIds.has(ev.refId as AssociationId)) {
              return {
                type: "association" as const,
                refId: ev.refId,
                quote,
              };
            }

            const resolvedId = associationTextToId.get(ev.refId.trim().toLowerCase());
            if (resolvedId) {
              return {
                type: "association" as const,
                refId: resolvedId,
                quote,
              };
            }

            return null;
          }

          return null;
        })
        .filter(
          (
            ev
          ): ev is {
            type: "dream_text" | "element" | "association";
            refId: string;
            quote: string;
          } => ev !== null
        );

      if (normalizedEvidence.length === 0) {
        normalizedEvidence.push({
          type: "dream_text",
          refId: "dream_text",
          quote: fallbackDreamQuote(dream.rawText),
        });
      }

      const data: HypothesisDoc = {
        lens,
        hypothesisText: enforceHypothesisFraming(hyp.hypothesisText),
        evidence: normalizedEvidence,
        reflectiveQuestion: hyp.reflectiveQuestion,
        createdAt,
      };

      return { id, data };
    });

  await bulkUpsertHypotheses(db, uid, dreamId, hypothesesWithIds);
  await updateDream(db, uid, dreamId, { status: "interpreted" });

  return { hypotheses: hypothesesWithIds };
}
