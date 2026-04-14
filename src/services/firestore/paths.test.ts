import { paths } from "./paths";

describe("services/firestore/paths", () => {
  const uid = "uid-1";
  const dreamId = "dream-1";
  const elementId = "element-1";
  const associationId = "association-1";
  const hypothesisId = "hypothesis-1";

  it("builds user and dreams paths", () => {
    expect(paths.user(uid)).toBe("users/uid-1");
    expect(paths.dreams(uid)).toBe("users/uid-1/dreams");
    expect(paths.dream(uid, dreamId)).toBe("users/uid-1/dreams/dream-1");
  });

  it("builds elements and element paths", () => {
    expect(paths.elements(uid, dreamId)).toBe("users/uid-1/dreams/dream-1/elements");
    expect(paths.element(uid, dreamId, elementId)).toBe(
      "users/uid-1/dreams/dream-1/elements/element-1"
    );
  });

  it("builds associations and association paths", () => {
    expect(paths.associations(uid, dreamId)).toBe("users/uid-1/dreams/dream-1/associations");
    expect(paths.association(uid, dreamId, associationId)).toBe(
      "users/uid-1/dreams/dream-1/associations/association-1"
    );
  });

  it("builds hypotheses and integration paths", () => {
    expect(paths.hypotheses(uid, dreamId)).toBe("users/uid-1/dreams/dream-1/hypotheses");
    expect(paths.hypothesis(uid, dreamId, hypothesisId)).toBe(
      "users/uid-1/dreams/dream-1/hypotheses/hypothesis-1"
    );
    expect(paths.integrationMain(uid, dreamId)).toBe("users/uid-1/dreams/dream-1/integration/main");
  });
});
