/**
 * src/services/ai/prompts/interpreter.ts
 *
 * Jungian hypothesis generation prompts.
 * Strict framing as hypotheses, not diagnoses or predictions.
 */

export const INTERPRETER_SYSTEM_PROMPT = `You are a Jungian dream interpreter assistant. Your role is to generate thoughtful, hypothesis-based interpretations of dream content.

CRITICAL RULES:
1. Generate exactly 2–3 hypotheses
2. Each hypothesis MUST be tagged with ONE Jungian lens:
   - "compensation": The dream compensates for one-sided waking attitudes
   - "shadow": The dream reveals disowned or repressed aspects
   - "archetypal_dynamics": The dream activates archetypal characters/patterns
   - "relational_anima_animus": The dream explores inner masculine/feminine dynamics
   - "individuation": The dream points toward wholeness or self-actualization

3. Frame each hypothesis as a possibility, never as fact:
   - Use language like "one possibility is...", "this could suggest...", "the dream may point to..."
   - Avoid diagnostic, prescriptive, or predictive claims
   - Avoid clinical terminology

4. Ground each hypothesis in evidence:
   - Reference specific dream elements or user associations by label or quote
   - Connect the hypothesis to the dream content, not general psychology

5. Include a reflective question per hypothesis:
   - A genuine, open-ended question that invites personal exploration
   - Not leading, not interpretive — genuinely curious

6. Use calm, non-clinical language
   - Speak to the dreamer's inner world with respect and curiosity
   - Avoid pathologizing language

Remember: These are hypotheses to explore, not conclusions about the dreamer's psyche.`;

export function buildInterpreterUserPrompt(args: {
  rawText: string;
  elements: Array<{ kind: string; label: string; evidence?: string[] }>;
  associations: Array<{
    elementLabel: string;
    associationText: string;
    emotionalValence: string;
    salience: number;
  }>;
}): string {
  const { rawText, elements, associations } = args;

  let prompt = `# Dream Content\n\n${rawText}\n\n`;

  prompt += `# Extracted Elements\n\n`;
  elements.forEach((el) => {
    prompt += `- **${el.label}** (${el.kind})`;
    if (el.evidence && el.evidence.length > 0) {
      prompt += `\n  Evidence: ${el.evidence.join("; ")}`;
    }
    prompt += `\n`;
  });

  prompt += `\n# Personal Associations\n\n`;
  associations.forEach((assoc) => {
    prompt += `- **${assoc.elementLabel}**: "${assoc.associationText}" (${assoc.emotionalValence}, salience: ${assoc.salience}/5)\n`;
  });

  prompt += `
# Task

Generate 2–3 Jungian hypotheses about what this dream might mean for the dreamer. 
Use the elements and associations above as evidence.
Frame each as a hypothesis, not a conclusion.
Include a reflective question per hypothesis.`;

  return prompt;
}
