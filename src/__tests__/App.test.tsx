import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../app/App";
import { ensureAnonymousAuth } from "../app/config/firebase";

jest.mock("../app/config/firebase", () => ({
  ensureAnonymousAuth: jest.fn(() => Promise.resolve({ uid: "test-uid" })),
  getDb: jest.fn(() => ({})),
}));

jest.mock("../screens/DashboardPage", () => ({
  __esModule: true,
  default: ({ onDreamSelect }: { onDreamSelect: (id: string) => void }) => (
    <button type="button" onClick={() => onDreamSelect("dream-from-dashboard")}>Dashboard mock</button>
  ),
}));

jest.mock("../features/dreamCapture/ui/DreamEntryPage", () => ({
  __esModule: true,
  default: ({ onContinue }: { onContinue: (id: string) => void }) => (
    <button type="button" onClick={() => onContinue("dream-new")}>DreamEntry continue</button>
  ),
}));

jest.mock("../features/dreamStructuring/ui/DreamBreakdownPage", () => ({
  __esModule: true,
  default: ({ dreamId, onContinue }: { dreamId: string; onContinue?: (id: string) => void }) => (
    <div>
      <div>{`Breakdown ${dreamId}`}</div>
      <button type="button" onClick={() => onContinue?.(dreamId)}>Breakdown continue</button>
    </div>
  ),
}));

jest.mock("../features/dreamAssociations/ui/AssociationsPage", () => ({
  __esModule: true,
  default: ({ dreamId, onContinue }: { dreamId: string; onContinue?: (id: string) => void }) => (
    <div>
      <div>{`Associations ${dreamId}`}</div>
      <button type="button" onClick={() => onContinue?.(dreamId)}>Associations continue</button>
    </div>
  ),
}));

jest.mock("../features/dreamInterpretation/ui/InterpretationPage", () => ({
  __esModule: true,
  default: ({ dreamId, onContinue }: { dreamId: string; onContinue?: (id: string) => void }) => (
    <div>
      <div>{`Interpretation ${dreamId}`}</div>
      <button type="button" onClick={() => onContinue?.(dreamId)}>Interpretation continue</button>
    </div>
  ),
}));

jest.mock("../features/dreamIntegration/ui/DreamIntegrationPage", () => ({
  __esModule: true,
  default: ({ dreamId }: { dreamId?: string }) => <div>{`Integration ${dreamId ?? "none"}`}</div>,
}));

jest.mock("../features/byok/ui/SettingsPage", () => ({
  __esModule: true,
  default: () => <div>Settings mock</div>,
}));

const OPEN_MENU_NAME = /open menu/i;
const NAV_LABEL = /primary navigation/i;
const NAV_ITEMS = [
  "Dashboard",
  "Record a Dream",
  "Dream Breakdown",
  "Associations",
  "Interpretation",
  "Integration",
  "Settings"
];

describe("Navigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
    (ensureAnonymousAuth as jest.Mock).mockResolvedValue({ uid: "test-uid" });
  });

  it("shows the app title and menu toggle", () => {
    render(<App />);

    expect(screen.getByText("Dreamer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPEN_MENU_NAME })).toBeInTheDocument();
  });

  it("opens the navigation panel with required destinations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: OPEN_MENU_NAME }));

    const navigation = await screen.findByRole("navigation", { name: NAV_LABEL });

    NAV_ITEMS.forEach((item) => {
      expect(within(navigation).getByRole("link", { name: item })).toBeInTheDocument();
    });
  });

  it("omits the dream session view when no dream is active", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: OPEN_MENU_NAME }));

    const navigation = await screen.findByRole("navigation", { name: NAV_LABEL });
    expect(
      within(navigation).queryByRole("link", { name: /dream session view/i })
    ).not.toBeInTheDocument();
  });

  it("renders dream entry route and continues to breakdown route", async () => {
    window.history.pushState({}, "", "/dreams/new");
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("button", { name: /dreamentry continue/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /dreamentry continue/i }));

    expect(await screen.findByText("Breakdown dream-new")).toBeInTheDocument();
  });

  it("shows placeholders for routes requiring an active dream", async () => {
    window.history.pushState({}, "", "/dreams/breakdown");
    render(<App />);

    expect(await screen.findByText(/record a dream first, then come back here to structure it/i)).toBeInTheDocument();
  });

  it("shows associations placeholder when no active dream", async () => {
    window.history.pushState({}, "", "/dreams/associations");
    render(<App />);

    expect(await screen.findByText(/record a dream first, then come back here to add associations/i)).toBeInTheDocument();
  });

  it("shows interpretation placeholder when no active dream", async () => {
    window.history.pushState({}, "", "/dreams/interpretation");
    render(<App />);

    expect(await screen.findByText(/record a dream first, then come back here to review hypotheses/i)).toBeInTheDocument();
  });

  it("uses active dream from localStorage for direct routes", async () => {
    window.localStorage.setItem("dreamer.activeDreamId", "dream-local");
    window.history.pushState({}, "", "/dreams/breakdown");
    render(<App />);

    expect(await screen.findByText("Breakdown dream-local")).toBeInTheDocument();
  });

  it("renders parameterized breakdown route", async () => {
    window.history.pushState({}, "", "/dreams/dream-param/breakdown");
    render(<App />);
    expect(await screen.findByText("Breakdown dream-param")).toBeInTheDocument();
  });

  it("renders parameterized associations route", async () => {
    window.history.pushState({}, "", "/dreams/dream-param/associations");
    render(<App />);
    expect(await screen.findByText("Associations dream-param")).toBeInTheDocument();
  });

  it("renders parameterized interpretation route", async () => {
    window.history.pushState({}, "", "/dreams/dream-param/interpretation");
    render(<App />);
    expect(await screen.findByText("Interpretation dream-param")).toBeInTheDocument();
  });

  it("renders parameterized integration route", async () => {
    window.history.pushState({}, "", "/dreams/dream-param/integration");
    render(<App />);
    expect(await screen.findByText("Integration dream-param")).toBeInTheDocument();
  });

  it("renders settings route", async () => {
    window.history.pushState({}, "", "/settings");
    render(<App />);

    expect(await screen.findByText("Settings mock")).toBeInTheDocument();
  });

  it("shows loader fallback route placeholders when auth init fails", async () => {
    (ensureAnonymousAuth as jest.Mock).mockRejectedValue(new Error("init failed"));
    window.history.pushState({}, "", "/dreams/new");
    render(<App />);

    expect(await screen.findByText(/we could not start dream entry yet/i)).toBeInTheDocument();
  });

  it("shows breakdown loader fallback when auth init fails", async () => {
    (ensureAnonymousAuth as jest.Mock).mockRejectedValue(new Error("init failed"));
    window.history.pushState({}, "", "/dreams/dream-param/breakdown");
    render(<App />);
    expect(await screen.findByText(/could not load this dream/i)).toBeInTheDocument();
  });

  it("drives continue actions across associations and interpretation routes", async () => {
    window.history.pushState({}, "", "/dreams/dream-flow/associations");
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    expect(await screen.findByText("Associations dream-flow")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /associations continue/i }));
    expect(await screen.findByText("Interpretation dream-flow")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /interpretation continue/i }));
    expect(await screen.findByText("Integration dream-flow")).toBeInTheDocument();

    unmount();
    window.history.pushState({}, "", "/dreams/dream-session");
    render(<App />);
    expect(await screen.findByText("Breakdown dream-session")).toBeInTheDocument();
  });
});
