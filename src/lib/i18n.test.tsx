import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { I18nProvider, useI18n, SUPPORTED_LOCALES } from "./i18n";

function Probe() {
  const { t, setLocale, locale } = useI18n();
  return (
    <div>
      <span data-testid="loc">{locale}</span>
      <span data-testid="word">{t("nav.home")}</span>
      <button onClick={() => setLocale("es")}>es</button>
    </div>
  );
}

describe("i18n", () => {
  it("translates and switches locale", () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId("word").textContent).toBe("Home");
    act(() => { screen.getByText("es").click(); });
    expect(screen.getByTestId("loc").textContent).toBe("es");
    expect(screen.getByTestId("word").textContent).toBe("Inicio");
  });

  it("exports supported locales", () => {
    expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(2);
  });
});