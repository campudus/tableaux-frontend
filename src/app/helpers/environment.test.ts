import { describe, expect, it } from "vitest";
import {
  getBannerColor,
  getContrastTextColor,
  getEnvironment,
  parseRgb,
  prefixTitle
} from "./environment";

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

describe("getBannerColor", () => {
  const isValid = () => true;
  const isInvalid = () => false;

  it("uses the environment's default without a configured color", () => {
    expect(getBannerColor("test", undefined, isValid)).toBe("#c6e31e");
    expect(getBannerColor("staging", "", isValid)).toBe("#f97316");
  });

  it("prefers a valid configured color", () => {
    expect(getBannerColor("test", "rebeccapurple", isValid)).toBe(
      "rebeccapurple"
    );
  });

  it("ignores an invalid configured color", () => {
    expect(getBannerColor("test", "not-a-color", isInvalid)).toBe("#c6e31e");
  });
});

describe("getContrastTextColor", () => {
  it.each([
    [[255, 255, 255], "black"],
    [[198, 227, 30], "black"], // test default
    [[249, 115, 22], "black"], // staging default
    [[18, 52, 86], "white"],
    [[0, 0, 0], "white"]
  ] as const)("picks %j -> %s", (rgb, expected) => {
    expect(getContrastTextColor([...rgb])).toBe(expected);
  });
});

describe("parseRgb", () => {
  it("parses computed rgb and rgba values", () => {
    expect(parseRgb("rgb(18, 52, 86)")).toEqual([18, 52, 86]);
    expect(parseRgb("rgba(18, 52, 86, 0.5)")).toEqual([18, 52, 86]);
    expect(parseRgb("#123456")).toEqual([18, 52, 86]);
  });

  it("returns null for anything else", () => {
    expect(parseRgb("")).toBeNull();
    expect(parseRgb("transparent")).toBeNull();
  });
});
