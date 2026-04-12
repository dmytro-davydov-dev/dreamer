import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Firestore } from "firebase/firestore";
import "@testing-library/jest-dom";

import DreamBreakdownPage from "./DreamBreakdownPage";
import type { DreamId, UID } from "../../../shared/types/domain";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGetDream = jest.fn();
const mockListElements = jest.fn();
const mockUpsertElement = jest.fn();
const mockSoftDeleteElement = jest.fn();

jest.mock("../../../services/firestore/firestoreRepo", () => ({
  getDream: (...args: unknown[]) => mockGetDream(...args),
  listElements: (...args: unknown[]) => mockListElements(...args),
  upsertElement: (...args: unknown[]) => mockUpsertElement(...args),
  softDeleteElement: (...args: unknown[]) => mockSoftDeleteElement(...args),
}));

const mockExtractElements = jest.fn();
jest.mock("../service/extractElements.service", () => ({
  extractElements: (...args: unknown[]) => mockExtractElements(...args),
}));

const mockHasLlmApiKey = jest.fn();
const mockGetLlmApiKey = jest.fn();
jest.mock("../../byok/service/keyStorage.service", () => ({
  hasLlmApiKey: () => mockHasLlmApiKey(),
  getLlmApiKey: () => mockGetLlmApiKey(),
}));

// Mock ByokGate to a simple div for component-level tests
jest.mock("../../byok/ui/ByokGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="byok-gate">{children}</div>
  ),
}));

const MOCK_NOW_TS = { seconds: 1000, nanoseconds: 0 };
jest.mock("../../../services/firestore/timestamps", () => ({
  nowTs: jest.fn(() => MOCK_NOW_TS),
}));

let idSeq = 0;
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({ id: `new-id-${++idSeq}` })),
  collection: jest.fn(() => ({})),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DB = {} as Firestore;
const UID: UID = "user-1";
const DREAM_ID: DreamId = "dream-xyz";

const DREAM_DOC = {
  rawText: "I was flying over a dark forest and saw a white owl.",
  dreamedAt: MOCK_NOW_TS,
  createdAt: MOCK_NOW_TS,
  status: "draft" as const,
};

function makeElement(id: string, kind: string, label: string) {
  return {
    id,
    data: {
      kind,
      label,
      evidence: [`evidence for ${label}`],
      source: "ai" as const,
      order: 0,
      deleted: false,
      createdAt: MOCK_NOW_TS,
    },
  };
}

const ELEMENTS = [
  makeElement("el-1", "symbol", "white owl"),
  makeElement("el-2", "place", "dark forest"),
  makeElement("el-3", "emotion", "wonder"),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderPage = (overrides: {
  hasKey?: boolean;
  dreamLoads?: boolean;
  elements?: typeof ELEMENTS;
  onContinue?: jest.Mock;
} = {}) => {
  const {
    hasKey = true,
    dreamLoads = true,
    elements = [],
    onContinue = jest.fn(),
  } = overrides;

  mockHasLlmApiKey.mockReturnValue(hasKey);
  mockGetLlmApiKey.mockReturnValue(hasKey ? "sk-test" : null);
  mockGetDream.mockResolvedValue(dreamLoads ? DREAM_DOC : null);
  mockListElements.mockResolvedValue(elements);
  mockUpsertElement.mockResolvedValue(undefined);
  mockSoftDeleteElement.mockResolvedValue(undefined);

  const user = userEvent.setup();
  render(
    <DreamBreakdownPage
      db={DB}
      uid={UID}
      dreamId={DREAM_ID}
      onContinue={onContinue}
    />
  );
  return { user, onContinue };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DreamBreakdownPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    idSeq = 0;
  });

  // ── Loading & error states ─────────────────────────────────────────────

  it("does not show dream content while loading", () => {
    // Never resolve to stay in loading
    mockGetDream.mockReturnValue(new Promise(() => {}));
    mockListElements.mockReturnValue(new Promise(() => {}));
    mockHasLlmApiKey.mockReturnValue(true);
    render(<DreamBreakdownPage db={DB} uid={UID} dreamId={DREAM_ID} />);

    // The dream text preview and extract section should not yet be visible
    expect(screen.queryByText(/Extract elements/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dream text/i)).not.toBeInTheDocument();
  });

  it("shows the page heading after loading", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Dream Breakdown/i })).toBeInTheDocument();
    });
  });

  it("shows an error alert when dream cannot be loaded", async () => {
    renderPage({ dreamLoads: false });
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  // ── Dream text preview ────────────────────────────────────────────────

  it("shows the dream text in the preview section", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/flying over a dark forest/i)).toBeInTheDocument();
    });
  });

  // ── No elements: extract section ──────────────────────────────────────

  it("shows the Extract elements section when no elements are loaded", async () => {
    renderPage({ elements: [] });
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /extract elements/i })).toBeInTheDocument();
    });
  });

  it("shows Extract button when API key is set and no elements exist", async () => {
    renderPage({ elements: [], hasKey: true });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /extract elements/i })).toBeInTheDocument();
    });
  });

  it("shows ByokGate (no-key prompt) when API key is absent and no elements exist", async () => {
    renderPage({ elements: [], hasKey: false });
    await waitFor(() => {
      expect(screen.getByTestId("byok-gate")).toBeInTheDocument();
    });
  });

  // ── Extraction flow ───────────────────────────────────────────────────

  it("calls extractElements and shows elements after successful extraction", async () => {
    mockExtractElements.mockResolvedValue({ elements: ELEMENTS });
    const { user } = renderPage({ elements: [], hasKey: true });

    await waitFor(() => screen.getByRole("button", { name: /extract elements/i }));
    await user.click(screen.getByRole("button", { name: /extract elements/i }));

    await waitFor(() => {
      expect(screen.getByText("white owl")).toBeInTheDocument();
    });
    expect(mockExtractElements).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when extraction fails", async () => {
    mockExtractElements.mockRejectedValue(new Error("API failure"));
    const { user } = renderPage({ elements: [], hasKey: true });

    await waitFor(() => screen.getByRole("button", { name: /extract elements/i }));
    await user.click(screen.getByRole("button", { name: /extract elements/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  // ── Element display ───────────────────────────────────────────────────

  it("renders loaded elements with their labels", async () => {
    renderPage({ elements: ELEMENTS });

    await waitFor(() => {
      expect(screen.getByText("white owl")).toBeInTheDocument();
      expect(screen.getByText("dark forest")).toBeInTheDocument();
      expect(screen.getByText("wonder")).toBeInTheDocument();
    });
  });

  it("shows element count when elements are present", async () => {
    renderPage({ elements: ELEMENTS });

    await waitFor(() => {
      expect(screen.getByText(/3 elements/i)).toBeInTheDocument();
    });
  });

  // ── Delete element ────────────────────────────────────────────────────

  it("removes an element from the list when Delete is clicked", async () => {
    const { user } = renderPage({ elements: ELEMENTS });

    await waitFor(() => screen.getByText("white owl"));

    const deleteButtons = screen.getAllByRole("button", { name: /remove element/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("white owl")).not.toBeInTheDocument();
    });
    expect(mockSoftDeleteElement).toHaveBeenCalledWith(DB, UID, DREAM_ID, "el-1");
  });

  // ── Edit element label ────────────────────────────────────────────────

  it("allows editing an element label inline", async () => {
    const { user } = renderPage({ elements: [makeElement("el-edit", "symbol", "old label")] });

    await waitFor(() => screen.getByText("old label"));

    await user.click(screen.getByRole("button", { name: /edit element label/i }));
    const input = screen.getByDisplayValue("old label");
    await user.clear(input);
    await user.type(input, "new label");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("new label")).toBeInTheDocument();
    });
    expect(mockUpsertElement).toHaveBeenCalledWith(
      DB, UID, DREAM_ID, "el-edit",
      expect.objectContaining({ label: "new label", source: "user" })
    );
  });

  // ── Add element row ───────────────────────────────────────────────────

  it("renders Add buttons for each kind group when elements are present", async () => {
    renderPage({ elements: ELEMENTS });

    await waitFor(() => screen.getByText("white owl"));

    // At minimum there should be "Add symbol" and "Add character" buttons visible
    const addButtons = screen.getAllByRole("button", { name: /add /i });
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it("adds a new element when using the Add row", async () => {
    const { user } = renderPage({ elements: ELEMENTS });

    await waitFor(() => screen.getByText("white owl"));

    // Click the first "Add …" button (symbol group)
    const addButtons = screen.getAllByRole("button", { name: /add symbol/i });
    await user.click(addButtons[0]);

    const textField = await screen.findByPlaceholderText(/new symbol/i);
    await user.type(textField, "golden key");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("golden key")).toBeInTheDocument();
    });
    expect(mockUpsertElement).toHaveBeenCalled();
  });

  // ── Continue button ───────────────────────────────────────────────────

  it("shows Continue button when elements are present", async () => {
    renderPage({ elements: ELEMENTS });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue to associations/i })).toBeInTheDocument();
    });
  });

  it("does not show Continue button when no elements are present", async () => {
    renderPage({ elements: [] });

    await waitFor(() => screen.getByRole("heading", { name: /Dream Breakdown/i }));

    expect(screen.queryByRole("button", { name: /continue to associations/i })).not.toBeInTheDocument();
  });

  it("calls onContinue with dreamId when Continue is clicked", async () => {
    const onContinue = jest.fn();
    const { user } = renderPage({ elements: ELEMENTS, onContinue });

    await waitFor(() => screen.getByRole("button", { name: /continue to associations/i }));
    await user.click(screen.getByRole("button", { name: /continue to associations/i }));

    expect(onContinue).toHaveBeenCalledWith(DREAM_ID);
  });

  // ── Re-extract ────────────────────────────────────────────────────────

  it("shows Re-extract button when elements already exist and API key is set", async () => {
    renderPage({ elements: ELEMENTS, hasKey: true });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /re-extract/i })).toBeInTheDocument();
    });
  });
});
