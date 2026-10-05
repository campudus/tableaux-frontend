import i18n from "i18next";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { initConfig } from "../constants/TableauxConstants";
import resources from "../../locales/index";
import EnvironmentBanner from "./EnvironmentBanner";

const render = (config: Record<string, unknown>) => {
  initConfig({ webhookUrl: "", ...config });
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(<EnvironmentBanner />, container);
  });
  return container;
};

describe("EnvironmentBanner", () => {
  beforeAll(() => {
    i18n.init({ resources, lng: "de", fallbackLng: "en", ns: ["common"] });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each([{}, { grudEnvironment: "production" }, { grudEnvironment: "qa" }])(
    "renders nothing for %j",
    config => {
      expect(render(config).querySelector(".environment-banner")).toBeNull();
    }
  );

  it("names the environment", () => {
    const banner = render({ grudEnvironment: "staging" }).querySelector(
      ".environment-banner"
    );
    expect(banner?.textContent).toBe(
      "Staging-System·Änderungen hier wirken sich nicht auf das Produktivsystem aus."
    );
  });

  it("uses the configured color", () => {
    const banner = render({
      grudEnvironment: "test",
      grudEnvironmentColor: "#123456"
    }).querySelector<HTMLElement>(".environment-banner");
    expect(banner?.style.backgroundColor).toMatch(/#123456|rgb\(18, 52, 86\)/);
    expect(banner?.style.color).toBe("white");
  });
});
