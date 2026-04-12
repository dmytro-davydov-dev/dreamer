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

export async function generateHypotheses(
  options: GenerateHypothesesOptions
): Promise<GenerateHypothesesResult> {
  const { db, uid, dreamId, dream, elements, associations, apiKey, model } = options;

  const elementMap = new Map<ElementId, string>();
  elements.forEach((el) => {
    elementMap.set(el.id, el.data.label);
  });

  const associationInputs = associations.map((assoc) => {
    const elementLabel = elementMap.get(assoc.data.elementId) || "Unknown";
    return {
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

      const validLenses: JungianLens[] = [
        "compensation",
        "shadow",
        "archetypal_dynamics",
        "relational_anima_animus",
        "individuation",
      ];
      const lens = validLenses.includes(hyp.lens as JungianLens)
        ? (hyp.lens as JungianLens)
        : "compensation";

      const data: HypothesisDoc = {
        lens,
        hypothesisText: hyp.hypothesisText,
        evidence: hyp.evidence.map((ev) => ({
          type: ev.type as "dream_text" | "element" | "association",
          refId: ev.refId,
          quote: ev.quote,
        })),
        reflectiveQuestion: hyp.reflectiveQuestion,
        createdAt,
      };

      return { id, data };
    });

  await bulkUpsertHypotheses(db, uid, dreamId, hypothesesWithIds);
  await updateDream(db, uid, dreamId, { status: "interpreted" });

  return { hypotheses: hypothesesWithIds };
}
