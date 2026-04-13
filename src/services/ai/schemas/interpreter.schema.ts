/**
 * src/services/ai/schemas/interpreter.schema.ts
 *
 * Strict JSON schema for interpreter output.
 */

export interface InterpreterOutput {
  hypotheses: Array<{
    lens: string;
    hypothesisText: string;
    evidence: Array<{ type: string; refId: string; quote: string }>;
    reflectiveQuestion: string;
  }>;
}

export const INTERPRETER_SCHEMA = {
  type: "object",
  properties: {
    hypotheses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lens: {
            type: "string",
            enum: [
              "compensation",
              "shadow",
              "archetypal_dynamics",
              "relational_anima_animus",
              "individuation",
            ],
            description: "The Jungian lens for this hypothesis",
          },
          hypothesisText: {
            type: "string",
            description: "The hypothesis framed as a possibility, not a conclusion",
            minLength: 20,
            maxLength: 500,
            pattern: "^(Could be|One possibility is|This could suggest|The dream may point to)",
          },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["dream_text", "element", "association"],
                },
                refId: {
                  type: "string",
                  description: "Element label, association quote, or dream_text anchor",
                },
                quote: {
                  type: "string",
                  description: "Short excerpt/anchor supporting this evidence",
                  minLength: 5,
                  maxLength: 150,
                },
              },
              required: ["type", "refId", "quote"],
              additionalProperties: false,
            },
            minItems: 1,
            maxItems: 3,
          },
          reflectiveQuestion: {
            type: "string",
            description: "An open-ended question inviting personal reflection",
            minLength: 10,
            maxLength: 200,
          },
        },
        required: ["lens", "hypothesisText", "evidence", "reflectiveQuestion"],
        additionalProperties: false,
      },
      minItems: 2,
      maxItems: 3,
    },
  },
  required: ["hypotheses"],
  additionalProperties: false,
} as const;
