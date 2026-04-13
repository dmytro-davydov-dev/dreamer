import type { Firestore, Timestamp } from "firebase/firestore";

import { generateHypotheses } from "./generateHypotheses.service";
import type {
  AssociationDoc,
  DreamDoc,
  DreamElementDoc,
  DreamId,
  ElementId,
  UID,
} from "../../../shared/types/domain";

const mockCallLlm = jest.fn();
jest.mock("../../../services/ai/client/llmClient", () => ({
  callLlm: (...args: unknown[]) => mockCallLlm(...args),
}));

const mockBulkUpsertHypotheses = jest.fn();
const mockUpdateDream = jest.fn();
jest.mock("../../../services/firestore/firestoreRepo", () => ({
  bulkUpsertHypotheses: (...args: unknown[]) => mockBulkUpsertHypotheses(...args),
  updateDream: (...args: unknown[]) => mockUpdateDream(...args),
}));

const MOCK_NOW_TS = { seconds: 1000, nanoseconds: 0 } as unknown as Timestamp;
jest.mock("../../../services/firestore/timestamps", () => ({
  nowTs: jest.fn(() => MOCK_NOW_TS),
}));

let idCounter = 0;
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({ id: `hypothesis-id-${++idCounter}` })),
  collection: jest.fn(() => ({})),
}));

const DB = {} as Firestore;
const UID_VALUE: UID = "user-1";
const DREAM_ID: DreamId = "dream-1";

const TIMESTAMP = { seconds: 1, nanoseconds: 0 } as unknown as Timestamp;

const DREAM: DreamDoc = {
  rawText: "I kept running through a school hallway while all doors were locked.",
  dreamedAt: TIMESTAMP,
  createdAt: TIMESTAMP,
  status: "associated",
};

const ELEMENTS: Array<{ id: ElementId; data: DreamElementDoc }> = [
  {
    id: "element-1",
    data: {
      kind: "place",
      label: "school hallway",
      evidence: ["school hallway"],
      order: 0,
      source: "ai",
      deleted: false,
      createdAt: TIMESTAMP,
    },
  },
];

const ASSOCIATIONS: Array<{ id: string; data: AssociationDoc }> = [
  {
    id: "assoc-1",
    data: {
      elementId: "element-1",
      associationText: "I feel judged at work",
      emotionalValence: "negative",
      salience: 4,
      createdAt: TIMESTAMP,
    },
  },
];

describe("generateHypotheses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    idCounter = 0;
    mockBulkUpsertHypotheses.mockResolvedValue(undefined);
    mockUpdateDream.mockResolvedValue(undefined);
  });

  it("writes generated rows to hypotheses and sets dream status to interpreted", async () => {
    mockCallLlm.mockResolvedValue({
      hypotheses: [
        {
          lens: "shadow",
          hypothesisText: "Could be that this dream reflects anxiety about external judgment.",
          evidence: [{ type: "element", refId: "element-1", quote: "school hallway" }],
          reflectiveQuestion: "Where do you currently feel watched or evaluated?",
        },
        {
          lens: "compensation",
          hypothesisText: "Could be that your psyche is balancing pressure with a need for inner safety.",
          evidence: [{ type: "association", refId: "assoc-1", quote: "I feel judged at work" }],
          reflectiveQuestion: "What would feeling safe in this situation look like?",
        },
      ],
    });

    const result = await generateHypotheses({
      db: DB,
      uid: UID_VALUE,
      dreamId: DREAM_ID,
      dream: DREAM,
      elements: ELEMENTS,
      associations: ASSOCIATIONS,
      apiKey: "sk-test",
    });

    expect(result.hypotheses).toHaveLength(2);
    expect(mockBulkUpsertHypotheses).toHaveBeenCalledWith(
      DB,
      UID_VALUE,
      DREAM_ID,
      expect.arrayContaining([
        expect.objectContaining({ id: "hypothesis-id-1" }),
        expect.objectContaining({ id: "hypothesis-id-2" }),
      ])
    );
    expect(mockUpdateDream).toHaveBeenCalledWith(DB, UID_VALUE, DREAM_ID, { status: "interpreted" });
  });

  it("falls back to dream_text evidence when model evidence cannot be mapped", async () => {
    mockCallLlm.mockResolvedValue({
      hypotheses: [
        {
          lens: "individuation",
          hypothesisText: "Could be that this dream points to reclaiming agency in uncertain environments.",
          evidence: [{ type: "element", refId: "missing-element", quote: "locked doors" }],
          reflectiveQuestion: "Where are you ready to choose differently?",
        },
        {
          lens: "shadow",
          hypothesisText: "Could be that blocked doors reflect avoided emotions asking for attention.",
          evidence: [{ type: "association", refId: "missing-association", quote: "blocked" }],
          reflectiveQuestion: "What emotion feels hardest to name right now?",
        },
      ],
    });

    await generateHypotheses({
      db: DB,
      uid: UID_VALUE,
      dreamId: DREAM_ID,
      dream: DREAM,
      elements: ELEMENTS,
      associations: ASSOCIATIONS,
      apiKey: "sk-test",
    });

    const rows = mockBulkUpsertHypotheses.mock.calls[0][3] as Array<{
      data: { evidence: Array<{ type: string; refId: string }> };
    }>;

    expect(rows[0].data.evidence[0]).toMatchObject({ type: "dream_text", refId: "dream_text" });
    expect(rows[1].data.evidence[0]).toMatchObject({ type: "dream_text", refId: "dream_text" });
  });
});
