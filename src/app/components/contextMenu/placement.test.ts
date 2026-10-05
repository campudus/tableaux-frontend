import { describe, expect, it } from "vitest";
import { placeBelowAnchorRightAligned } from "./placement";

const place = (anchorRight: number, menuWidth = 200, viewportWidth = 1000) =>
  placeBelowAnchorRightAligned({
    anchor: { right: anchorRight, bottom: 40 },
    menuWidth,
    viewportWidth,
    margin: 8
  });

describe("placeBelowAnchorRightAligned", () => {
  it("aligns the menu's right edge with the anchor's right edge", () => {
    expect(place(500)).toEqual({ left: 300, top: 40 });
  });

  it("shifts right when the menu would overflow the left viewport edge", () => {
    expect(place(100)).toEqual({ left: 8, top: 40 });
  });

  it("shifts left when the menu would overflow the right viewport edge", () => {
    expect(place(1200)).toEqual({ left: 792, top: 40 });
  });

  it("sticks to the left margin if the menu is wider than the viewport", () => {
    expect(place(500, 1200)).toEqual({ left: 8, top: 40 });
  });
});
