import type { Timestamp } from "firebase/firestore";

import {
  defaults,
  isAssociationDoc,
  isDreamDoc,
  isDreamElementDoc,
  isHypothesisDoc,
  isHypothesisEvidence,
  isIntegrationDoc,
} from "./domain";

const ts = { seconds: 1, nanoseconds: 0 } as unknown as Timestamp;

describe("shared/types/domain validators", () => {
  it("validates a dream doc", () => {
    expect(
      isDreamDoc({
        rawText: "Ocean wave",
        dreamedAt: ts,
        createdAt: ts,
        status: "draft",
      })
    ).toBe(true);

    expect(isDreamDoc({ rawText: "missing timestamps" })).toBe(false);
  });

  it("validates element and association docs", () => {
    expect(
      isDreamElementDoc({
        kind: "symbol",
        label: "Door",
        source: "ai",
        createdAt: ts,
      })
    ).toBe(true);

    expect(
      isAssociationDoc({
        elementId: "el-1",
        associationText: "Opportunity",
        emotionalValence: "positive",
        salience: 3,
        createdAt: ts,
      })
    ).toBe(true);

    expect(isAssociationDoc({ elementId: "el-1", salience: "3", createdAt: ts })).toBe(false);
  });

  it("validates hypothesis evidence and document shape", () => {
    const evidence = { type: "dream_text", refId: "dream_text", quote: "locked room" };
    expect(isHypothesisEvidence(evidence)).toBe(true);
    expect(isHypothesisEvidence({ type: "dream_text", quote: "missing id" })).toBe(false);

    expect(
      isHypothesisDoc({
        lens: "shadow",
        hypothesisText: "Could be unresolved fear.",
        evidence: [evidence],
        reflectiveQuestion: "What fear is present right now?",
        createdAt: ts,
      })
    ).toBe(true);
  });

  it("validates integration docs", () => {
    expect(
      isIntegrationDoc({
        reflectiveQuestions: ["What feels unfinished?"],
        practiceSuggestion: "Write for five minutes.",
        createdAt: ts,
      })
    ).toBe(true);

    expect(
      isIntegrationDoc({
        reflectiveQuestions: [1],
        practiceSuggestion: "bad",
        createdAt: ts,
      })
    ).toBe(false);
  });
});

describe("shared/types/domain defaults", () => {
  it("builds default dream with draft status", () => {
    const dream = defaults.dream({
      rawText: "Running through a corridor",
      dreamedAt: ts,
      createdAt: ts,
      mood: "uneasy",
    });

    expect(dream).toMatchObject({
      rawText: "Running through a corridor",
      status: "draft",
      mood: "uneasy",
      createdAt: ts,
      dreamedAt: ts,
    });
  });

  it("builds default element with deleted=false", () => {
    const element = defaults.element({
      kind: "symbol",
      label: "Bridge",
      createdAt: ts,
      source: "user",
      order: 1,
    });

    expect(element).toMatchObject({
      kind: "symbol",
      label: "Bridge",
      source: "user",
      deleted: false,
      order: 1,
      createdAt: ts,
    });
  });
});
