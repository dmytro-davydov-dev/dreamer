/**
 * src/features/dreamStructuring/service/extractElements.service.ts
 *
 * Orchestrates the Extractor AI stage:
 *  1. Call the LLM with the dream text (no interpretation — description only)
 *  2. Map LLM output to DreamElementDoc[]
 *  3. Bulk-upsert to Firestore
 *  4. Advance dream status to "structured"
 */

import type { Firestore } from "firebase/firestore";
import { doc, collection } from "firebase/firestore";

import { callLlm, LlmError, type LlmCallOptions } from "../../../services/ai/client/llmClient";
import { analytics, startAiTimer } from "../../../services/analytics";
import {
  buildExtractorSystemPrompt,
  buildExtractorUserPrompt,
} from "../../../services/ai/prompts/extractor";
import {
  EXTRACTOR_JSON_SCHEMA,
  type ExtractorResponse,
} from "../../../services/ai/schemas/extractor.schema";
import {
  bulkUpsertElements,
  updateDream,
} from "../../../services/firestore/firestoreRepo";
import { nowTs } from "../../../services/firestore/timestamps";
import { defaults } from "../../../shared/types/domain";
import type {
  DreamElementDoc,
  DreamId,
  ElementId,
  UID,
} from "../../../shared/types/domain";

export interface ExtractElementsOptions {
  db: Firestore;
  uid: UID;
  dreamId: DreamId;
  rawText: string;
  apiKey: string;
  language?: string;
  model?: string;
}

export interface ExtractElementsResult {
  elements: Array<{ id: ElementId; data: DreamElementDoc }>;
}

/**
 * Run the extractor stage: call LLM, persist elements, update dream status.
 */
export async function extractElements(
  options: ExtractElementsOptions
): Promise<ExtractElementsResult> {
  const { db, uid, dreamId, rawText, apiKey, language, model } = options;

  const llmOptions: LlmCallOptions = {
    apiKey,
    model: model ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: buildExtractorSystemPrompt(language) },
      { role: "user", content: buildExtractorUserPrompt(rawText) },
    ],
    jsonSchema: {
      name: "dream_elements",
      schema: EXTRACTOR_JSON_SCHEMA as Record<string, unknown>,
      strict: true,
    },
    temperature: 0.2,
    maxTokens: 1024,
  };

  const timer = startAiTimer();
  let response: ExtractorResponse;
  try {
    response = await callLlm<ExtractorResponse>(llmOptions);
    analytics.capture("ai_stage_completed", {
      stage: "extract",
      latencyMs: timer.stop(),
      promptTokens: 0,
      completionTokens: 0,
      model: llmOptions.model ?? "gpt-4o-mini",
      success: true,
    });
  } catch (err) {
    analytics.capture("ai_stage_failed", {
      stage: "extract",
      errorKind: err instanceof LlmError ? err.kind : "api_error",
      latencyMs: timer.stop(),
    });
    throw err;
  }

  if (!response.elements || !Array.isArray(response.elements)) {
    throw new Error("Extractor returned an unexpected response shape.");
  }

  // Map to Firestore docs with stable IDs (auto-generated via collection ref)
  const createdAt = nowTs();
  const elementsWithIds: Array<{ id: ElementId; data: DreamElementDoc }> =
    response.elements.map((el, index) => {
      // Generate a stable client-side id using Firestore's doc() with no path
      const id = doc(collection(db, "_")).id as ElementId;
      const data = defaults.element({
        kind: el.kind,
        label: el.label,
        evidence: el.evidence,
        source: "ai",
        order: index,
        createdAt,
      });
      return { id, data };
    });

  // Persist elements
  await bulkUpsertElements(db, uid, dreamId, elementsWithIds);

  // Advance dream status
  await updateDream(db, uid, dreamId, { status: "structured" });

  return { elements: elementsWithIds };
}
