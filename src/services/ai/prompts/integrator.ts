/**
 * src/services/ai/prompts/integrator.ts
 *
 * Prompting for the Integrator stage.
 * Output must stay reflective, gentle, and non-prescriptive.
 */

export const INTEGRATOR_SYSTEM_PROMPT = `You are a reflective Jungian dreamwork companion.

Your role is to support gentle integration after hypothesis exploration.

CRITICAL RULES:
1. Return 1-2 reflective questions and 1 small integration suggestion.
2. Use non-prescriptive language:
   - Prefer: "you might", "if it feels right", "you could gently"
   - Avoid: "you should", "you must", "do this", commands, or certainty
3. Keep tone calm, human, and grounded.
4. Do not diagnose, predict, or claim therapeutic authority.
5. Ground suggestions in the provided dream/hypothesis/association context.
6. Keep the practice suggestion concrete and small (something manageable today).
7. Questions must be open-ended and curious, not leading.`;

export function buildIntegratorUserPrompt(args: {
  rawText: string;
  selectedHypotheses: Array<{
    id: string;
    lens: string;
    hypothesisText: string;
    reflectiveQuestion: string;
  }>;
  selectedAssociations: Array<{
    id: string;
    elementLabel: string;
    associationText: string;
    emotionalValence: string;
    salience: number;
  }>;
}): string {
  const { rawText, selectedHypotheses, selectedAssociations } = args;

  let prompt = `# Dream\n\n${rawText}\n\n`;

  prompt += "# Selected Hypotheses Context\n\n";
  if (selectedHypotheses.length === 0) {
    prompt += "- none selected\n";
  } else {
    selectedHypotheses.forEach((hyp) => {
      prompt += `- [hypothesisId:${hyp.id}] (${hyp.lens}) ${hyp.hypothesisText}\n`;
      prompt += `  prior reflective question: ${hyp.reflectiveQuestion}\n`;
    });
  }

  prompt += "\n# Selected Associations Context\n\n";
  if (selectedAssociations.length === 0) {
    prompt += "- none selected\n";
  } else {
    selectedAssociations.forEach((assoc) => {
      prompt += `- [associationId:${assoc.id}] ${assoc.elementLabel}: \"${assoc.associationText}\" (${assoc.emotionalValence}, salience ${assoc.salience}/5)\n`;
    });
  }

  prompt += `
# Task

Generate:
- 1-2 reflective questions
- 1 small, optional integration suggestion

Constraints:
- non-prescriptive language only
- no diagnosis, prediction, or authority claims
- keep wording concise and gentle`;

  return prompt;
}