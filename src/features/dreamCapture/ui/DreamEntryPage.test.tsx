import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Firestore } from "firebase/firestore";
import type { ComponentProps } from "react";

import DreamEntryPage from "./DreamEntryPage";
import type { DreamId } from "../../../shared/types/domain";

// ---------------------------------------------------------------------------
// MediaRecorder stub
// ---------------------------------------------------------------------------
class MockMediaRecorder {
  static instances: MockMediaRecorder[] = [];

  mimeType = "audio/webm";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  state: "inactive" | "recording" = "inactive";

  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {
    MockMediaRecorder.instances.push(this);
  }

  start() {
    this.state = "recording";
  }

  /** Simulate user finishing recording: emit a chunk then fire onstop. */
  simulateStop(chunk = new Blob(["audio"], { type: "audio/webm" })) {
    if (this.ondataavailable) this.ondataavailable({ data: chunk });
    this.state = "inactive";
    if (this.onstop) this.onstop();
  }

  stop() {
    this.simulateStop();
  }

  static isTypeSupported(_mime: string) {
    return true;
  }
}

// ---------------------------------------------------------------------------
// getUserMedia stub
// ---------------------------------------------------------------------------
const mockStream = {
  getTracks: () => [{ stop: jest.fn() }],
} as unknown as MediaStream;

const setup = (overrides?: Partial<ComponentProps<typeof DreamEntryPage>>) => {
  const createDream = jest.fn(async () => ({ dreamId: "dream-1" as DreamId }));
  const updateDream = jest.fn(async () => undefined);
  const transcribe = jest.fn(async () => "Потім я побачив яскраві двері.");
  const getApiKey = jest.fn(() => "sk-test-key");
  const db = {} as Firestore;
  const uid = "user-1";

  const user = userEvent.setup();

  render(
    <DreamEntryPage
      db={db}
      uid={uid}
      autosaveDelayMs={400}
      deps={{ createDream, updateDream, transcribe, getApiKey }}
      {...overrides}
    />
  );

  const dreamText = screen.getByLabelText(/^dream$/i) as HTMLTextAreaElement;
  const moodInput = screen.getByLabelText(/waking mood/i) as HTMLInputElement;
  const lifeContextInput = screen.getByLabelText(/life context/i) as HTMLTextAreaElement;
  const continueButton = screen.getByRole("button", { name: /continue/i });

  return {
    createDream,
    updateDream,
    transcribe,
    getApiKey,
    db,
    uid,
    user,
    dreamText,
    moodInput,
    lifeContextInput,
    continueButton,
  };
};

const waitForAutosave = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 450));
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("DreamEntryPage", () => {
  beforeEach(() => {
    MockMediaRecorder.instances = [];
    // @ts-expect-error – stub global
    global.MediaRecorder = MockMediaRecorder;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: jest.fn(async () => mockStream) },
    });
  });

  it("disables Continue until dream text is non-empty", async () => {
    const { user, dreamText, continueButton } = setup();

    expect(continueButton).toBeDisabled();

    await user.type(dreamText, "A vivid dream about a mountain.");

    expect(continueButton).toBeEnabled();
  });

  it("creates a draft on debounce when dream text is entered", async () => {
    const { user, dreamText, createDream, db, uid } = setup();

    await user.type(dreamText, "A vivid dream about a mountain.");

    await waitForAutosave();

    expect(createDream).toHaveBeenCalledWith(
      db,
      uid,
      expect.objectContaining({ rawText: "A vivid dream about a mountain." })
    );
  });

  it("updates the draft after creation when fields change", async () => {
    const { user, dreamText, moodInput, updateDream } = setup();

    await user.type(dreamText, "A vivid dream about a mountain.");

    await waitForAutosave();

    await user.clear(moodInput);
    await user.type(moodInput, "Curious");

    await waitForAutosave();

    expect(updateDream).toHaveBeenCalledWith(
      expect.any(Object),
      "user-1",
      "dream-1",
      expect.objectContaining({ mood: "Curious" })
    );
  });

  it("saves immediately on blur", async () => {
    const { user, dreamText, createDream } = setup();

    await user.type(dreamText, "A vivid dream about a mountain.");
    await user.tab();

    await waitForAutosave();

    expect(createDream).toHaveBeenCalled();
  });

  it("shows an error if no API key is configured", async () => {
    const getApiKey = jest.fn(() => null);
    const { user } = setup({
      deps: {
        createDream: jest.fn(async () => ({ dreamId: "d" as DreamId })),
        updateDream: jest.fn(async () => undefined),
        transcribe: jest.fn(async () => ""),
        getApiKey,
      },
    });

    await user.click(screen.getByRole("button", { name: /start voice recording/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/no api key/i);
  });

  it("records audio and appends Whisper transcript to dream text", async () => {
    const { user, dreamText, transcribe } = setup();

    await user.type(dreamText, "Я йшов через ліс.");

    // Start recording
    await user.click(screen.getByRole("button", { name: /start voice recording/i }));

    expect(MockMediaRecorder.instances).toHaveLength(1);
    expect(screen.getByRole("button", { name: /stop recording/i })).toBeInTheDocument();

    // Stop recording — triggers onstop → transcribe → appends text
    MockMediaRecorder.instances[0].simulateStop();

    await waitFor(() => {
      expect(transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: "sk-test-key", language: "uk" })
      );
    });

    await waitFor(() => {
      expect(dreamText.value).toMatch(/Я йшов через ліс\. Потім я побачив яскраві двері\./);
    });
  });

  it("shows an error alert when transcription fails", async () => {
    const transcribe = jest.fn(async () => {
      throw new Error("Whisper API error 500");
    });
    const { user } = setup({
      deps: {
        createDream: jest.fn(async () => ({ dreamId: "d" as DreamId })),
        updateDream: jest.fn(async () => undefined),
        transcribe,
        getApiKey: jest.fn(() => "sk-test-key"),
      },
    });

    await user.click(screen.getByRole("button", { name: /start voice recording/i }));

    MockMediaRecorder.instances[0].simulateStop();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/whisper api error 500/i);
    });
  });
});
