import type { Firestore } from "firebase/firestore";
import type { DreamId, UID } from "../../../shared/types/domain";
import { extractElements } from "./extractElements.service";
import { LlmError } from "../../../services/ai/client/llmClient";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCallLlm = jest.fn();
jest.mock("../../../services/ai/client/llmClient", () => ({
  callLlm: (...args: unknown[]) => mockCallLlm(...args),
  LlmError: class LlmError extends Error {
    kind: string;
    statusCode?: number;
    constructor(kind: string, message: string, statusCode?: number) {
      super(message);
      this.name = "LlmError";
      this.kind = kind;
      this.statusCode = statusCode;
    }
  },
}));

const mockBulkUpsertElements = jest.fn();
const mockUpdateDream = jest.fn();
jest.mock("../../../services/firestore/firestoreRepo", () => ({
  bulkUpsertElements: (...args: unknown[]) => mockBulkUpsertElements(...args),
  updateDream: (...args: unknown[]) => mockUpdateDream(...args),
}));

const MOCK_NOW_TS = { seconds: 1000, nanoseconds: 0 };
jest.mock("../../../services/firestore/timestamps", () => ({
  nowTs: jest.fn(() => MOCK_NOW_TS),
}));

// Provide stable IDs for doc(collection(...)).id
let idCounter = 0;
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({ id: `element-id-${++idCounter}` })),
  collection: jest.fn(() => ({})),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DB = {} as Firestore;
const UID: UID = "user-1";
const DREAM_ID: DreamId = "dream-abc";
const RAW_TEXT = "I was flying over a dark forest with a white owl.";
const API_KEY = "sk-test";

const MOCK_EXTRACTOR_RESPONSE = {
  elements: [
    { kind: "symbol" as const, label: "white owl", evidence: ["a white owl"] },
    { kind: "place" as const, label: "dark forest", evidence: ["over a dark forest"] },
    { kind: "action" as const, label: "flying", evidence: ["I was flying"] },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("extractElements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    idCounter = 0;
    mockCallLlm.mockResolvedValue(MOCK_EXTRACTOR_RESPONSE);
    mockBulkUpsertElements.mockResolvedValue(undefined);
    mockUpdateDream.mockResolvedValue(undefined);
  });

  it("calls callLlm with the dream text and correct params", async () => {
    await extractElements({ db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY });

    expect(mockCallLlm).toHaveBeenCalledTimes(1);
    const [options] = mockCallLlm.mock.calls[0] as [{ messages: Array<{ role: string; content: string }>; apiKey: string }];
    expect(options.apiKey).toBe(API_KEY);
    // system prompt must be present
    expect(options.messages[0].role).toBe("system");
    // user message must include dream text
    expect(options.messages[1].content).toContain(RAW_TEXT);
  });

  it("returns mapped elements with source='ai' and correct order", async () => {
    const result = await extractElements({
      db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY,
    });

    expect(result.elements).toHaveLength(3);

    result.elements.forEach((el, index) => {
      expect(el.data.source).toBe("ai");
      expect(el.data.order).toBe(index);
      expect(el.data.deleted).toBe(false);
    });

    expect(result.elements[0].data.kind).toBe("symbol");
    expect(result.elements[0].data.label).toBe("white owl");
    expect(result.elements[1].data.kind).toBe("place");
    expect(result.elements[2].data.kind).toBe("action");
  });

  it("persists elements via bulkUpsertElements", async () => {
    await extractElements({ db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY });

    expect(mockBulkUpsertElements).toHaveBeenCalledWith(DB, UID, DREAM_ID, expect.any(Array));
    const [, , , rows] = mockBulkUpsertElements.mock.calls[0] as [unknown, unknown, unknown, unknown[]];
    expect(rows).toHaveLength(3);
  });

  it("updates dream status to 'structured'", async () => {
    await extractElements({ db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY });

    expect(mockUpdateDream).toHaveBeenCalledWith(DB, UID, DREAM_ID, { status: "structured" });
  });

  it("uses provided custom model", async () => {
    await extractElements({
      db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY,
      model: "gpt-4o",
    });

    const [options] = mockCallLlm.mock.calls[0] as [{ model: string }];
    expect(options.model).toBe("gpt-4o");
  });

  it("defaults to gpt-4o-mini when no model is specified", async () => {
    await extractElements({ db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY });

    const [options] = mockCallLlm.mock.calls[0] as [{ model: string }];
    expect(options.model).toBe("gpt-4o-mini");
  });

  it("throws when callLlm returns a response with no elements array", async () => {
    mockCallLlm.mockResolvedValue({ unexpected: "shape" });

    await expect(
      extractElements({ db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY })
    ).rejects.toThrow("unexpected response shape");
  });

  it("propagates LlmError thrown by callLlm", async () => {
    const { LlmError: MockLlmError } = jest.requireMock("../../../services/ai/client/llmClient") as {
      LlmError: new (kind: string, message: string, statusCode?: number) => InstanceType<typeof LlmError>;
    };
    mockCallLlm.mockRejectedValue(new MockLlmError("invalid_key", "bad key", 401));

    await expect(
      extractElements({ db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY })
    ).rejects.toMatchObject({ kind: "invalid_key" });
  });

  it("assigns correct createdAt timestamp to all elements", async () => {
    const result = await extractElements({
      db: DB, uid: UID, dreamId: DREAM_ID, rawText: RAW_TEXT, apiKey: API_KEY,
    });

    result.elements.forEach((el) => {
      expect(el.data.createdAt).toEqual(MOCK_NOW_TS);
    });
  });
});
