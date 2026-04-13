import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Firestore, Timestamp } from "firebase/firestore";

import InterpretationPage from "./InterpretationPage";
import type {
  AssociationDoc,
  DreamDoc,
  DreamElementDoc,
  DreamId,
  ElementId,
  HypothesisDoc,
  HypothesisId,
  UID,
} from "../../../shared/types/domain";

const mockGetDream = jest.fn();
const mockListElements = jest.fn();
const mockListAssociations = jest.fn();
const mockListHypotheses = jest.fn();
const mockSetHypothesisFeedback = jest.fn();

jest.mock("../../../services/firestore/firestoreRepo", () => ({
  getDream: (...args: unknown[]) => mockGetDream(...args),
  listElements: (...args: unknown[]) => mockListElements(...args),
  listAssociations: (...args: unknown[]) => mockListAssociations(...args),
  listHypotheses: (...args: unknown[]) => mockListHypotheses(...args),
  setHypothesisFeedback: (...args: unknown[]) => mockSetHypothesisFeedback(...args),
}));

jest.mock("../../../features/byok/service/keyStorage.service", () => ({
  hasLlmApiKey: () => true,
  getLlmApiKey: () => "sk-test",
}));

const mockGenerateHypotheses = jest.fn();
jest.mock("../service/generateHypotheses.service", () => ({
  generateHypotheses: (...args: unknown[]) => mockGenerateHypotheses(...args),
}));

const TS = { seconds: 1, nanoseconds: 0 } as unknown as Timestamp;

const DREAM: DreamDoc = {
  rawText: "I was walking in a dim corridor and could not find an exit.",
  dreamedAt: TS,
  createdAt: TS,
  status: "associated",
};

const ELEMENTS: Array<{ id: ElementId; data: DreamElementDoc }> = [
  {
    id: "el-1",
    data: {
      kind: "place",
      label: "corridor",
      evidence: ["dim corridor"],
      order: 0,
      source: "ai",
      deleted: false,
      createdAt: TS,
    },
  },
];

const ASSOCIATIONS: Array<{ id: string; data: AssociationDoc }> = [
  {
    id: "assoc-1",
    data: {
      elementId: "el-1",
      associationText: "I feel trapped in current routines",
      emotionalValence: "negative",
      salience: 4,
      createdAt: TS,
    },
  },
];

const HYPOTHESES: Array<{ id: HypothesisId; data: HypothesisDoc }> = [
  {
    id: "hyp-1",
    data: {
      lens: "shadow",
      hypothesisText: "Could be that this dream reflects parts of your life where avoidance is growing.",
      evidence: [{ type: "element", refId: "el-1", quote: "dim corridor" }],
      reflectiveQuestion: "What are you postponing that asks for attention now?",
      userFeedback: null,
      createdAt: TS,
    },
  },
];

const renderPage = (overrides?: { dreamId?: DreamId; uid?: UID }) => {
  const db = {} as Firestore;
  const uid = overrides?.uid ?? "user-1";
  const dreamId = overrides?.dreamId ?? "dream-1";

  render(<InterpretationPage db={db} uid={uid} dreamId={dreamId} />);
  return { db, uid, dreamId };
};

describe("InterpretationPage feedback persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetDream.mockResolvedValue(DREAM);
    mockListElements.mockResolvedValue(ELEMENTS);
    mockListAssociations.mockResolvedValue(ASSOCIATIONS);
    mockListHypotheses.mockResolvedValue(HYPOTHESES);
    mockSetHypothesisFeedback.mockResolvedValue(undefined);
    mockGenerateHypotheses.mockResolvedValue({ hypotheses: HYPOTHESES });
  });

  it("writes user feedback and updates selected feedback state", async () => {
    const user = userEvent.setup();
    const { db, uid, dreamId } = renderPage();

    await screen.findByText("1 hypotheses");

    await user.click(screen.getByText(/reflects parts of your life where avoidance is growing/i));
    const resonatesButton = screen.getByRole("button", { name: /resonates/i });

    await user.click(resonatesButton);

    expect(mockSetHypothesisFeedback).toHaveBeenCalledWith(
      db,
      uid,
      dreamId,
      "hyp-1",
      "resonates"
    );

    await waitFor(() => {
      expect(resonatesButton).toHaveClass("MuiButton-contained");
    });
  });

  it("disables feedback buttons while feedback write is in-flight", async () => {
    const user = userEvent.setup();
    let resolveWrite: (() => void) | null = null;

    mockSetHypothesisFeedback.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        })
    );

    renderPage();

    await screen.findByText("1 hypotheses");

    await user.click(screen.getByText(/reflects parts of your life where avoidance is growing/i));

    const resonatesButton = screen.getByRole("button", { name: /resonates/i });
    const doesNotFitButton = screen.getByRole("button", { name: /doesn't fit/i });

    await user.click(resonatesButton);

    expect(resonatesButton).toBeDisabled();
    expect(doesNotFitButton).toBeDisabled();

    resolveWrite?.();

    await waitFor(() => {
      expect(resonatesButton).not.toBeDisabled();
      expect(doesNotFitButton).not.toBeDisabled();
    });
  });
});
