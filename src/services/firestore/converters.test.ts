import { converters } from "./converters";

describe("services/firestore/converters", () => {
  it("toFirestore returns the model object unchanged", () => {
    const model = { rawText: "dream", status: "draft" };

    expect(converters.dream.toFirestore(model)).toBe(model);
  });

  it("fromFirestore returns typed snapshot data", () => {
    const data = { reflectiveQuestions: ["What feels alive?"], practiceSuggestion: "Journal briefly." };
    const snapshot = {
      data: jest.fn(() => data),
    };

    const parsed = converters.integration.fromFirestore(snapshot as never, {} as never);

    expect(parsed).toEqual(data);
    expect(snapshot.data).toHaveBeenCalled();
  });
});
