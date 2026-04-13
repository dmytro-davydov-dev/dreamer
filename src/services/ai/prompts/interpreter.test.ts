import {
  INTERPRETER_SYSTEM_PROMPT,
  buildInterpreterUserPrompt,
} from "./interpreter";

describe("INTERPRETER_SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof INTERPRETER_SYSTEM_PROMPT).toBe("string");
    expect(INTERPRETER_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it("enforces hypothesis-only framing", () => {
    const lower = INTERPRETER_SYSTEM_PROMPT.toLowerCase();
    expect(lower).toContain("hypothesis");
    expect(lower).toContain("never as fact");
  });

  it("includes evidence reference id rules", () => {
    expect(INTERPRETER_SYSTEM_PROMPT).toContain("refId");
    expect(INTERPRETER_SYSTEM_PROMPT).toContain('type="element"');
    expect(INTERPRETER_SYSTEM_PROMPT).toContain('type="association"');
    expect(INTERPRETER_SYSTEM_PROMPT).toContain('type="dream_text"');
  });
});

describe("buildInterpreterUserPrompt", () => {
  it("includes element and association IDs for reference mapping", () => {
    const prompt = buildInterpreterUserPrompt({
      rawText: "I saw a black dog near a bridge.",
      elements: [
        { id: "el_1", kind: "symbol", label: "black dog", evidence: ["black dog"] },
      ],
      associations: [
        {
          id: "as_1",
          elementId: "el_1",
          elementLabel: "black dog",
          associationText: "fear and loyalty",
          emotionalValence: "mixed",
          salience: 4,
        },
      ],
    });

    expect(prompt).toContain("[elementId:el_1]");
    expect(prompt).toContain("[associationId:as_1]");
    expect(prompt).toContain("dream_text -> refId must be \"dream_text\"");
  });
});
