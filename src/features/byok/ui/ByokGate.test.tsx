import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";

import ByokGate from "./ByokGate";

// ─── Mock keyStorage ──────────────────────────────────────────────────────────

const mockHasLlmApiKey = jest.fn();
jest.mock("../service/keyStorage.service", () => ({
  hasLlmApiKey: () => mockHasLlmApiKey(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderGate = (keyPresent: boolean, children: React.ReactNode = <span>AI Feature</span>) => {
  mockHasLlmApiKey.mockReturnValue(keyPresent);
  return render(
    <MemoryRouter>
      <ByokGate>{children}</ByokGate>
    </MemoryRouter>
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ByokGate", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("when API key IS present", () => {
    it("renders children", () => {
      renderGate(true);
      expect(screen.getByText("AI Feature")).toBeInTheDocument();
    });

    it("does not render the warning", () => {
      renderGate(true);
      expect(screen.queryByText(/AI key required/i)).not.toBeInTheDocument();
    });
  });

  describe("when API key is NOT present", () => {
    it("renders the 'AI key required' warning", () => {
      renderGate(false);
      expect(screen.getByText(/AI key required/i)).toBeInTheDocument();
    });

    it("does not render children", () => {
      renderGate(false);
      expect(screen.queryByText("AI Feature")).not.toBeInTheDocument();
    });

    it("shows a link to Settings", () => {
      renderGate(false);
      expect(screen.getByRole("link", { name: /go to settings/i })).toBeInTheDocument();
    });

    it("shows the refresh button", () => {
      renderGate(false);
      expect(screen.getByRole("button", { name: /i've added my key/i })).toBeInTheDocument();
    });

    it("renders children after clicking refresh when key is now present", async () => {
      const user = userEvent.setup();
      // Initially no key
      mockHasLlmApiKey.mockReturnValue(false);
      renderGate(false);

      // Key is now set — re-check on click
      mockHasLlmApiKey.mockReturnValue(true);
      await user.click(screen.getByRole("button", { name: /i've added my key/i }));

      expect(screen.getByText("AI Feature")).toBeInTheDocument();
      expect(screen.queryByText(/AI key required/i)).not.toBeInTheDocument();
    });

    it("remains in warning state if key is still absent after refresh click", async () => {
      const user = userEvent.setup();
      mockHasLlmApiKey.mockReturnValue(false);
      renderGate(false);

      await user.click(screen.getByRole("button", { name: /i've added my key/i }));

      expect(screen.getByText(/AI key required/i)).toBeInTheDocument();
    });
  });
});
