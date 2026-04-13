/**
 * src/services/ai/schemas/integrator.schema.ts
 *
 * Strict JSON schema for Integrator stage output.
 */

export interface IntegratorOutput {
  reflectiveQuestions: string[];
  practiceSuggestion: string;
}

export const INTEGRATOR_SCHEMA = {
  type: "object",
  properties: {
    reflectiveQuestions: {
      type: "array",
      items: {
        type: "string",
        minLength: 10,
        maxLength: 220,
      },
      minItems: 1,
      maxItems: 2,
      description: "Open-ended reflective questions.",
    },
    practiceSuggestion: {
      type: "string",
      minLength: 20,
      maxLength: 260,
      description: "A small non-prescriptive integration suggestion.",
    },
  },
  required: ["reflectiveQuestions", "practiceSuggestion"],
  additionalProperties: false,
} as const;