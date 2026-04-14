import { buildIntegratorUserPrompt } from "./integrator";

describe("buildIntegratorUserPrompt", () => {
  it("renders selected hypotheses and associations in prompt", () => {
    const prompt = buildIntegratorUserPrompt({
      rawText: "I missed a train and watched it leave.",
      selectedHypotheses: [
        {
          id: "h1",
          lens: "compensation",
          hypothesisText: "Could be pressure around timing and readiness.",
          reflectiveQuestion: "Where do you feel rushed in waking life?",
        },
      ],
      selectedAssociations: [
        {
          id: "a1",
          elementLabel: "train",
          associationText: "career timeline",
          emotionalValence: "negative",
          salience: 4,
        },
      ],
    });

    expect(prompt).toContain("# Dream");
    expect(prompt).toContain("[hypothesisId:h1]");
    expect(prompt).toContain("[associationId:a1]");
    expect(prompt).toContain("non-prescriptive language only");
  });

  it("includes explicit none-selected markers when context arrays are empty", () => {
    const prompt = buildIntegratorUserPrompt({
      rawText: "A silent room",
      selectedHypotheses: [],
      selectedAssociations: [],
    });

    expect(prompt).toContain("- none selected");
    expect(prompt).toContain("# Selected Hypotheses Context");
    expect(prompt).toContain("# Selected Associations Context");
  });
});
