import { describe, expect, it } from "vitest";
import { opensSubmenuToLeft } from "./submenuPlacement";

const base = { menuWidth: 230, submenuWidth: 250, viewportWidth: 1000 };

describe("opensSubmenuToLeft", () => {
  it("opens to the right when the submenu fits", () => {
    expect(opensSubmenuToLeft({ ...base, x: 500 })).toBe(false);
  });

  it("opens to the right when the submenu exactly fits", () => {
    expect(opensSubmenuToLeft({ ...base, x: 520 })).toBe(false);
  });

  it("opens to the left when the submenu would overflow the viewport", () => {
    expect(opensSubmenuToLeft({ ...base, x: 521 })).toBe(true);
  });
});
