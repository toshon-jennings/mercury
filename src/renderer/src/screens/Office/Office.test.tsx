import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { I18nProvider } from "../../components/I18nProvider";
import Office from "./Office";

describe("Office", () => {
  const getLocale = vi.fn().mockResolvedValue("en");
  const setLocale = vi.fn().mockResolvedValue("en");
  const claw3dStatus = vi.fn();
  const listSessions = vi.fn();

  beforeEach(() => {
    claw3dStatus.mockResolvedValue({
      running: true,
      port: 18643,
      portInUse: false,
      adapterPort: 18642,
      adapterPortInUse: false,
      wsUrl: "ws://localhost:18642",
      error: "",
      installed: true,
    });
    listSessions.mockResolvedValue([
      {
        id: "active-cli-session",
        source: "cli",
        startedAt: Math.floor(Date.now() / 1000) - 120,
        endedAt: null,
        messageCount: 7,
        model: "openai/gpt-4.1",
        title: "Ship the release",
        preview: "",
      },
      {
        id: "finished-cli-session",
        source: "cli",
        startedAt: Math.floor(Date.now() / 1000) - 180,
        endedAt: Math.floor(Date.now() / 1000) - 60,
        messageCount: 4,
        model: "openai/gpt-4.1",
        title: "Closed session",
        preview: "",
      },
    ]);

    window.hermesAPI = {
      getLocale,
      setLocale,
      claw3dStatus,
      listSessions,
    } as unknown as Window["hermesAPI"];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows active CLI sessions in the office agent strip", async () => {
    render(
      <I18nProvider>
        <Office visible />
      </I18nProvider>,
    );

    expect(await screen.findByText("Terminal agents")).toBeInTheDocument();
    expect(await screen.findByText("Ship the release")).toBeInTheDocument();
    expect(screen.getByText("CLI agent")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tracked CLI sessions appear here, even if they are running in the background.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Tracked session")).toBeInTheDocument();
    expect(screen.queryByText("Closed session")).not.toBeInTheDocument();
  });
});
