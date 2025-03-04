import { describe, expect, it } from "vitest";
import { buildClassName } from "./buildClassName";

describe("buildClassName()", () => {
  it("should return simple base names", () => {
    expect(buildClassName("base")).toBe("base");
  });

  it("should append proper modifiers", () => {
    expect(
      buildClassName("base", {
        "state-a": true,
        "state-b": false,
        "state-c": true
      })
    ).toBe("base base--state-a base--state-c");
  });

  it("should append additional names", () => {
    expect(buildClassName("base", null, "foo")).toBe("base foo");
    expect(buildClassName("base", null, "foo bar")).toBe("base foo bar");
    expect(buildClassName("base", null, ["foo", "bar"])).toBe("base foo bar");
  });

  it("should append modifiers and additional classes", () => {
    expect(buildClassName("base", { a: true, b: false }, "foo")).toBe(
      "base base--a foo"
    );
  });
});
