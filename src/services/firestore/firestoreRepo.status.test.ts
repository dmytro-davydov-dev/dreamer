import { deriveDreamStatusFromArtifacts } from "./firestoreRepo";

describe("deriveDreamStatusFromArtifacts", () => {
  it("returns integrated when integration exists", () => {
    expect(
      deriveDreamStatusFromArtifacts({
        hasElements: true,
        hasAnyAssociation: true,
        hasHypotheses: true,
        hasIntegration: true,
      })
    ).toBe("integrated");
  });

  it("returns interpreted when hypotheses exist", () => {
    expect(
      deriveDreamStatusFromArtifacts({
        hasElements: true,
        hasAnyAssociation: true,
        hasHypotheses: true,
        hasIntegration: false,
      })
    ).toBe("interpreted");
  });

  it("returns associated when associations exist but no hypotheses", () => {
    expect(
      deriveDreamStatusFromArtifacts({
        hasElements: true,
        hasAnyAssociation: true,
        hasHypotheses: false,
        hasIntegration: false,
      })
    ).toBe("associated");
  });

  it("returns structured when only elements exist", () => {
    expect(
      deriveDreamStatusFromArtifacts({
        hasElements: true,
        hasAnyAssociation: false,
        hasHypotheses: false,
        hasIntegration: false,
      })
    ).toBe("structured");
  });

  it("returns draft when no artifacts exist", () => {
    expect(
      deriveDreamStatusFromArtifacts({
        hasElements: false,
        hasAnyAssociation: false,
        hasHypotheses: false,
        hasIntegration: false,
      })
    ).toBe("draft");
  });
});