import {
  EXTRACTOR_SYSTEM_PROMPT,
  buildExtractorUserPrompt,
} from "./extractor";

describe("EXTRACTOR_SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof EXTRACTOR_SYSTEM_PROMPT).toBe("string");
    expect(EXTRACTOR_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it("explicitly forbids interpretation", () => {
    const lower = EXTRACTOR_SYSTEM_PROMPT.toLowerCase();
    expect(lower).toContain("interpret");
  });

  it("explicitly forbids Jungian terminology", () => {
    const lower = EXTRACTOR_SYSTEM_PROMPT.toLowerCase();
    expect(lower).toContain("jungian");
  });

  it("mentions the expected element kinds", () => {
    const lower = EXTRACTOR_SYSTEM_PROMPT.toLowerCase();
    expect(lower).toContain("symbol");
    expect(lower).toContain("character");
    expect(lower).toContain("emotion");
  });
});

describe("buildExtractorUserPrompt", () => {
  it("returns a string containing the provided dream text", () => {
    const dreamText = "I was standing on a bridge over dark water.";
    const prompt = buildExtractorUserPrompt(dreamText);

    expect(typeof prompt).toBe("string");
    expect(prompt).toContain(dreamText);
  });

  it("handles multi-line dream text", () => {
    const dreamText = "First part of the dream.\nSecond part with a stranger.";
    const prompt = buildExtractorUserPrompt(dreamText);

    expect(prompt).toContain(dreamText);
  });

  it("handles empty string without throwing", () => {
    expect(() => buildExtractorUserPrompt("")).not.toThrow();
  });
});
