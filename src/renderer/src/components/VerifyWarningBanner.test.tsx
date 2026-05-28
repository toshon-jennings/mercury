import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { I18nProvider } from "./I18nProvider";
import VerifyWarningBanner from "./VerifyWarningBanner";

describe("VerifyWarningBanner", () => {
  const getLocale = vi.fn().mockResolvedValue("en");
  const setLocale = vi.fn().mockResolvedValue("en");

  beforeEach(() => {
    window.hermesAPI = {
      getLocale,
      setLocale,
    } as unknown as Window["hermesAPI"];
    getLocale.mockClear();
    setLocale.mockClear();
    try {
      window.localStorage.removeItem("hermes-locale");
    } catch {
      /* ignore */
    }
  });

  it("renders the Intlayer-backed content and triggers callbacks", async () => {
    const onReinstall = vi.fn();
    const onDismiss = vi.fn();

    render(
      <I18nProvider>
        <VerifyWarningBanner onReinstall={onReinstall} onDismiss={onDismiss} />
      </I18nProvider>,
    );

    expect(
      await screen.findByText(
        "Mercury is installed, but a health check didn't complete. The app should still work — reinstall if you run into issues.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reinstall" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onReinstall).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
