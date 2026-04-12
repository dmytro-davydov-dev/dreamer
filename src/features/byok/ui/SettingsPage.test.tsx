import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import SettingsPage from "./SettingsPage";

// ─── Mock keyStorage ──────────────────────────────────────────────────────────

const mockSetLlmApiKey = jest.fn();
const mockClearLlmApiKey = jest.fn();
const mockGetLlmApiKey = jest.fn();
const mockHasLlmApiKey = jest.fn();

jest.mock("../service/keyStorage.service", () => ({
  setLlmApiKey: (key: string) => mockSetLlmApiKey(key),
  clearLlmApiKey: () => mockClearLlmApiKey(),
  getLlmApiKey: () => mockGetLlmApiKey(),
  hasLlmApiKey: () => mockHasLlmApiKey(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderPage = (keyPresent = false, existingKey: string | null = null) => {
  mockHasLlmApiKey.mockReturnValue(keyPresent);
  mockGetLlmApiKey.mockReturnValue(existingKey);
  const user = userEvent.setup();
  render(<SettingsPage />);
  return { user };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Settings heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders the AI API Key section", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /ai api key/i })).toBeInTheDocument();
  });

  it("renders the key input field", () => {
    renderPage();
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
  });

  it("Save key button is disabled when input is empty", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /save key/i })).toBeDisabled();
  });

  it("Save key button becomes enabled when input has a value", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    expect(screen.getByRole("button", { name: /save key/i })).toBeEnabled();
  });

  it("calls setLlmApiKey with the entered value on save", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText(/api key/i), "sk-my-key");
    await user.click(screen.getByRole("button", { name: /save key/i }));
    expect(mockSetLlmApiKey).toHaveBeenCalledWith("sk-my-key");
  });

  it("shows 'Key saved locally' confirmation after saving", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText(/api key/i), "sk-test");
    await user.click(screen.getByRole("button", { name: /save key/i }));
    expect(await screen.findByText(/key saved locally/i)).toBeInTheDocument();
  });

  it("clears the input field after saving", async () => {
    const { user } = renderPage();
    const input = screen.getByLabelText(/api key/i);
    await user.type(input, "sk-test");
    await user.click(screen.getByRole("button", { name: /save key/i }));
    expect(input).toHaveValue("");
  });

  it("also saves when Enter is pressed in the key input", async () => {
    const { user } = renderPage();
    await user.type(screen.getByLabelText(/api key/i), "sk-enter-key");
    await user.keyboard("{Enter}");
    expect(mockSetLlmApiKey).toHaveBeenCalledWith("sk-enter-key");
  });

  describe("when a key is already set", () => {
    it("shows the masked key", () => {
      renderPage(true, "sk-abcdefghij1234");
      // We don't test the exact masking algorithm, just that something is displayed
      expect(screen.getByText(/key saved:/i)).toBeInTheDocument();
    });

    it("shows a Remove key button", () => {
      renderPage(true, "sk-existing");
      expect(screen.getByRole("button", { name: /remove key/i })).toBeInTheDocument();
    });

    it("calls clearLlmApiKey when Remove is clicked", async () => {
      const { user } = renderPage(true, "sk-existing");
      await user.click(screen.getByRole("button", { name: /remove key/i }));
      expect(mockClearLlmApiKey).toHaveBeenCalled();
    });

    it("hides the masked key display after removing", async () => {
      const { user } = renderPage(true, "sk-existing");
      await user.click(screen.getByRole("button", { name: /remove key/i }));
      expect(screen.queryByText(/key saved:/i)).not.toBeInTheDocument();
    });
  });

  it("shows the privacy note about local-only storage", () => {
    renderPage();
    expect(screen.getByText(/Privacy note/i)).toBeInTheDocument();
  });

  it("toggling show/hide changes the input type", async () => {
    const { user } = renderPage();
    const input = screen.getByLabelText(/api key/i);
    expect(input).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /show key/i });
    await user.click(toggleBtn);
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide key/i }));
    expect(input).toHaveAttribute("type", "password");
  });
});
