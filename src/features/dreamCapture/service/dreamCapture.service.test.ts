import type { Firestore } from "firebase/firestore";

import { createDreamEntry, updateDreamEntry } from "./dreamCapture.service";
import type { DreamId, UID } from "../../../shared/types/domain";

const mockCreateDream = jest.fn();
const mockUpdateDream = jest.fn();

jest.mock("../../../services/firestore/firestoreRepo", () => ({
  createDream: (...args: unknown[]) => mockCreateDream(...args),
  updateDream: (...args: unknown[]) => mockUpdateDream(...args),
}));

describe("dreamCapture.service", () => {
  const db = {} as Firestore;
  const uid = "user-1" as UID;
  const dreamId = "dream-1" as DreamId;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createDreamEntry returns dreamId from repository", async () => {
    mockCreateDream.mockResolvedValue({ dreamId, dream: { status: "draft" } });

    const result = await createDreamEntry(db, uid, { rawText: "A river and a bridge" });

    expect(result).toEqual({ dreamId });
    expect(mockCreateDream).toHaveBeenCalledWith(db, uid, { rawText: "A river and a bridge" });
  });

  it("updateDreamEntry delegates patch to repository", async () => {
    mockUpdateDream.mockResolvedValue(undefined);

    await updateDreamEntry(db, uid, dreamId, {
      rawText: "Revised dream text",
      status: "structured",
    });

    expect(mockUpdateDream).toHaveBeenCalledWith(db, uid, dreamId, {
      rawText: "Revised dream text",
      status: "structured",
    });
  });
});