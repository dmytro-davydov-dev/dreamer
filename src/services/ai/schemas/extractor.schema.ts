/**
 * src/services/ai/schemas/extractor.schema.ts
 *
 * JSON Schema for the Extractor stage response.
 * Used with OpenAI structured outputs (response_format: json_schema).
 */

import type { ElementKind } from "../../../shared/types/domain";

/** Shape returned by the LLM for the extractor stage */
export interface ExtractorResponse {
  elements: ExtractorElement[];
}

export interface ExtractorElement {
  kind: ElementKind;
  label: string;
  evidence: string[];
}

/** JSON Schema passed to the API */
export const EXTRACTOR_JSON_SCHEMA = {
  type: "object",
  properties: {
    elements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["symbol", "character", "place", "action", "emotion", "shift"],
            description:
              "The category of the dream element. symbol=object/image, character=person/being, place=location/setting, action=event/movement, emotion=feeling, shift=scene change or narrative transition.",
          },
          label: {
            type: "string",
            description: "Short (1–5 word) descriptive label. No interpretation.",
          },
          evidence: {
            type: "array",
            items: { type: "string" },
            description:
              "1–2 short quotes or paraphrases (≤15 words each) from the dream text supporting this element.",
            minItems: 0,
            maxItems: 2,
          },
        },
        required: ["kind", "label", "evidence"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 15,
    },
  },
  required: ["elements"],
  additionalProperties: false,
} as const;
