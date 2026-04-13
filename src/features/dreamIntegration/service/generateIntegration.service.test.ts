import type { Firestore, Timestamp } from "firebase/firestore";

import { generateIntegration } from "./generateIntegration.service";
import type {
  AssociationDoc,
  DreamDoc,
  DreamId,
  HypothesisDoc,
  UID,
} from "../../../shared/types/domain";

const mockCallLlm = jest.fn();
jest.mock("../../../services/ai/client/llmClient", () => ({
  callLlm: (...args: unknown[]) => mockCallLlm(...args),
}));

const mockGetIntegration = jest.fn();
const mockUpsertIntegration = jest.fn();
const mockUpdateDream = jest.fn();
jest.mock("../../../services/firestore/firestoreRepo", () => ({
  getIntegration: (...args: unknown[]) => mockGetIntegration(...args),
  upsertIntegration: (...args: unknown[]) => mockUpsertIntegration(...args),
  updateDream: (...args: unknown[]) => mockUpdateDream(...args),
}));

const NOW_TS = { seconds: 100, nanoseconds: 0 } as unknown as Timestamp;
jest.mock("../../../services/firestore/timestamps", () => ({
  nowTs: jest.fn(() => NOW_TS),
}));

const DB = {} as Firestore;
const UID_VALUE: UID = "user-1";
const DREAM_ID: DreamId = "dream-1";
const TS = { seconds: 1, nanoseconds: 0 } as unknown as Timestamp;

const DREAM: DreamDoc = {
  rawText: "I stood by a river at dusk and watched the water carry leaves away.",
  dreamedAt: TS,
  createdAt: TS,
  status: "interpreted",
};

const HYPOTHESES: Array<{ id: string; data: HypothesisDoc }> = [
  {
    id: "hyp-1",
    data: {
      lens: "individuation",
      hypothesisText: "One possibility is that the dream marks a quiet transition.",
      evidence: [{ type: "dream_text", refId: "dream_text", quote: "river at dusk" }],
      reflectiveQuestion: "What feels ready to change in a gentle way?",
      createdAt: TS,
    },
  },
  {
    id: "hyp-2",
    data: {
      lens: "compensation",
      hypothesisText: "Could be that your psyche is balancing pressure with release.",
      evidence: [{ type: "dream_text", refId: "dream_text", quote: "carry leaves away" }],
      reflectiveQuestion: "Where could you allow a little more flow this week?",
      createdAt: TS,
    },
  },
];

const ASSOCIATIONS: Array<{ id: string; data: AssociationDoc }> = [
  {
    id: "assoc-1",
    data: {
      elementId: "element-1",
      associationText: "The river reminds me of letting go.",
      emotionalValence: "mixed",
      salience: 4,
      createdAt: TS,
    },
  },
  {
    id: "assoc-2",
    data: {
      elementId: "element-2",
      associationText: "Dusk feels uncertain but calm.",
      emotionalValence: "mixed",
      salience: 3,
      createdAt: TS,
    },
  },
];

describe("generateIntegration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIntegration.mockResolvedValue(null);
    mockUpsertIntegration.mockResolvedValue(undefined);
    mockUpdateDream.mockResolvedValue(undefined);
    mockCallLlm.mockResolvedValue({
      reflectiveQuestions: [
        "What feeling from this dream still lingers with you",
        "Where might you make a little room for that feeling this week?",
      ],
      practiceSuggestion:
        "If it feels right, you might spend two quiet minutes noticing your breath before bed.",
    });
  });

  it("writes integration to /integration/main and marks dream as integrated", async () => {
    const result = await generateIntegration({
      db: DB,
      uid: UID_VALUE,
      dreamId: DREAM_ID,
      dream: DREAM,
      hypotheses: HYPOTHESES,
      associations: ASSOCIATIONS,
      apiKey: "sk-test",
    });

    expect(result.integration.reflectiveQuestions).toHaveLength(2);
    expect(mockUpsertIntegration).toHaveBeenCalledWith(
      DB,
      UID_VALUE,
      DREAM_ID,
      expect.objectContaining({
        reflectiveQuestions: expect.any(Array),
        practiceSuggestion: expect.any(String),
      })
    );
    expect(mockUpdateDream).toHaveBeenCalledWith(DB, UID_VALUE, DREAM_ID, {
      status: "integrated",
    });
  });

  it("uses selected hypotheses and associations context in prompt building", async () => {
    await generateIntegration({
      db: DB,
      uid: UID_VALUE,
      dreamId: DREAM_ID,
      dream: DREAM,
      hypotheses: HYPOTHESES,
      associations: ASSOCIATIONS,
      selectedHypothesisIds: ["hyp-2"],
      selectedAssociationIds: ["assoc-2"],
      apiKey: "sk-test",
    });

    const [llmOptions] = mockCallLlm.mock.calls[0] as [
      { messages: Array<{ role: string; content: string }> }
    ];
    const userContent = llmOptions.messages[1].content;

    expect(userContent).toContain("[hypothesisId:hyp-2]");
    expect(userContent).not.toContain("[hypothesisId:hyp-1]");
    expect(userContent).toContain("[associationId:assoc-2]");
    expect(userContent).not.toContain("[associationId:assoc-1]");
  });

  it("normalizes prescriptive practice language to non-prescriptive", async () => {
    mockCallLlm.mockResolvedValue({
      reflectiveQuestions: ["What is asking for gentle attention right now?"],
      practiceSuggestion: "You should write down three goals tonight.",
    });

    const result = await generateIntegration({
      db: DB,
      uid: UID_VALUE,
      dreamId: DREAM_ID,
      dream: DREAM,
      hypotheses: HYPOTHESES,
      associations: ASSOCIATIONS,
      apiKey: "sk-test",
    });

    expect(result.integration.practiceSuggestion.toLowerCase()).not.toContain(
      "you should"
    );
    expect(result.integration.practiceSuggestion.toLowerCase()).toContain(
      "you might"
    );
  });

  it("preserves existing journal text if integration doc already exists", async () => {
    mockGetIntegration.mockResolvedValue({
      reflectiveQuestions: ["older question"],
      practiceSuggestion: "older suggestion",
      journalText: "Private note",
      createdAt: TS,
      updatedAt: TS,
    });

    const result = await generateIntegration({
      db: DB,
      uid: UID_VALUE,
      dreamId: DREAM_ID,
      dream: DREAM,
      hypotheses: HYPOTHESES,
      associations: ASSOCIATIONS,
      apiKey: "sk-test",
    });

    expect(result.integration.journalText).toBe("Private note");
    expect(result.integration.createdAt).toBe(TS);
  });
});