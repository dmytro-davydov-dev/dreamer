import {
  clearLlmApiKey,
  getLlmApiKey,
  hasLlmApiKey,
  setLlmApiKey,
} from "./keyStorage.service";

describe("keyStorage.service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("setLlmApiKey", () => {
    it("stores the key in localStorage", () => {
      setLlmApiKey("sk-test-key");
      expect(localStorage.getItem("dreamer.byok.llmApiKey")).toBe("sk-test-key");
    });

    it("trims whitespace from the key before storing", () => {
      setLlmApiKey("  sk-padded  ");
      expect(localStorage.getItem("dreamer.byok.llmApiKey")).toBe("sk-padded");
    });
  });

  describe("getLlmApiKey", () => {
    it("returns null when no key has been stored", () => {
      expect(getLlmApiKey()).toBeNull();
    });

    it("returns the stored key", () => {
      setLlmApiKey("sk-my-key");
      expect(getLlmApiKey()).toBe("sk-my-key");
    });

    it("returns null when the stored value is only whitespace", () => {
      localStorage.setItem("dreamer.byok.llmApiKey", "   ");
      expect(getLlmApiKey()).toBeNull();
    });
  });

  describe("clearLlmApiKey", () => {
    it("removes the stored key", () => {
      setLlmApiKey("sk-to-remove");
      clearLlmApiKey();
      expect(getLlmApiKey()).toBeNull();
    });

    it("does not throw when no key was set", () => {
      expect(() => clearLlmApiKey()).not.toThrow();
    });
  });

  describe("hasLlmApiKey", () => {
    it("returns false when no key is stored", () => {
      expect(hasLlmApiKey()).toBe(false);
    });

    it("returns true when a key is stored", () => {
      setLlmApiKey("sk-present");
      expect(hasLlmApiKey()).toBe(true);
    });

    it("returns false after the key is cleared", () => {
      setLlmApiKey("sk-present");
      clearLlmApiKey();
      expect(hasLlmApiKey()).toBe(false);
    });
  });
});
