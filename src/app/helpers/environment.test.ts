import { describe, expect, it } from "vitest";
import { getBannerColors, getEnvironment, prefixTitle } from "./environment";

describe("getEnvironment", () => {
  it("recognises staging and test", () => {
    expect(getEnvironment("staging")).toBe("staging");
    expect(getEnvironment("test")).toBe("test");
  });

  it.each([undefined, null, "", "production", "tset", "TEST", "qa", 1])(
    "falls back to production for %j",
    value => {
      expect(getEnvironment(value)).toBe("production");
    }
  );
});

describe("prefixTitle", () => {
  it("leaves production titles alone", () => {
    expect(prefixTitle("Bikes | GRUD", "production")).toBe("Bikes | GRUD");
  });

  it("prefixes marked environments", () => {
    expect(prefixTitle("GRUD", "test")).toBe("[TEST] GRUD");
    expect(prefixTitle("GRUD", "staging")).toBe("[STAGING] GRUD");
  });
});

describe("getBannerColors", () => {
  const isValid = () => true;
  const isInvalid = () => false;

  it("uses the environment's defaults without configured colors", () => {
    expect(getBannerColors("test", {}, isValid)).toEqual({
      background: "#c6e31e",
      text: "#000000"
    });
    expect(
      getBannerColors("staging", { background: "", text: "" }, isValid)
    ).toEqual({
      background: "#f97316",
      text: "#000000"
    });
  });

  it("prefers valid configured colors", () => {
    expect(
      getBannerColors("test", { background: "#123456", text: "white" }, isValid)
    ).toEqual({ background: "#123456", text: "white" });
  });

  it("falls back for each color on its own", () => {
    expect(getBannerColors("test", { background: "#123456" }, isValid)).toEqual(
      {
        background: "#123456",
        text: "#000000"
      }
    );
  });

  it("ignores invalid configured colors", () => {
    expect(
      getBannerColors("test", { background: "grün", text: "weiß" }, isInvalid)
    ).toEqual({ background: "#c6e31e", text: "#000000" });
  });
});
