/**
 * src/services/ai/prompts/extractor.ts
 *
 * System and user prompts for the Extractor stage.
 *
 * RULE: No Jungian interpretation, no conclusions, no meaning.
 * Only descriptive extraction of elements from dream text.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  uk: "Ukrainian",
  pt: "Portuguese",
  es: "Spanish",
};

function resolveLanguageName(langCode: string): string {
  const base = langCode.split("-")[0].toLowerCase();
  return LANGUAGE_NAMES[base] ?? "English";
}

export function buildExtractorSystemPrompt(language = "en"): string {
  const langName = resolveLanguageName(language);
  return `You are a careful, neutral dream transcription assistant.

Your only task is to read a dream description and identify its concrete elements:
characters (people, beings), symbols (objects, images), places (settings, locations),
emotions (feelings), actions (key events, movements), and significant shifts (scene changes, transitions).

Rules you must follow without exception:
- Extract only what is explicitly present or directly implied in the dream text.
- Do NOT interpret, analyse, or assign meaning to any element.
- Do NOT use Jungian terminology (e.g. "shadow", "anima", "archetype") in labels.
- Keep labels short (1–5 words) and descriptive.
- Evidence should be a brief direct quote or paraphrase from the dream text (≤15 words).
- Return between 3 and 15 elements total.
- Prefer quality over quantity — only include genuinely distinct elements.
- Use lowercase for labels unless a proper name.
- IMPORTANT: Write ALL labels and evidence text in ${langName}.`;
}

export function buildExtractorUserPrompt(dreamText: string): string {
  return `Extract the elements from this dream:\n\n${dreamText}`;
}

export const EXTRACTOR_SYSTEM_PROMPT = buildExtractorSystemPrompt();
