import { describe, expect, it } from "vitest";
import {
  getGroupDisplayParts,
  GroupDisplayColumn,
  GroupMemberColumn,
  showsOnlyPlaceholders
} from "./groupDisplayValue";

const langtag = "de-DE";

const shortText: GroupMemberColumn = {
  id: 1,
  name: "name",
  kind: "shorttext",
  multilanguage: true
};

const webshop: GroupMemberColumn = {
  id: 2,
  name: "webshop",
  kind: "boolean",
  displayName: { "de-DE": "Webshop" },
  multilanguage: false
};

const sale: GroupMemberColumn = {
  id: 3,
  name: "sale", // no displayName -> falls back to the column name
  kind: "boolean",
  multilanguage: false
};

const groupColumn = (
  groups: GroupMemberColumn[],
  formatPattern?: string
): GroupDisplayColumn => ({
  kind: "group",
  groups,
  ...(formatPattern ? { formatPattern } : {})
});

describe("getGroupDisplayParts", () => {
  it("keeps the format pattern's separators as text and booleans as slots", () => {
    const column = groupColumn(
      [shortText, webshop, sale],
      "{{1}} | {{2}} / {{3}}"
    );
    const value = [{ "de-DE": "Fahrrad" }, true, false];

    expect(getGroupDisplayParts(column, value, langtag)).toEqual([
      "Fahrrad",
      " | ",
      { value: true, label: "Webshop" },
      " / ",
      { value: false, label: "sale" }
    ]);
  });

  // How much space the pattern puts around a separator is part of the pattern;
  // the cell renders it verbatim (see groupDisplayValue.scss).
  it("keeps every space of the format pattern", () => {
    const column = groupColumn([shortText, webshop], "{{1}}    |    {{2}}");

    expect(
      getGroupDisplayParts(column, [{ "de-DE": "Fahrrad" }, true], langtag)
    ).toEqual(["Fahrrad", "    |    ", { value: true, label: "Webshop" }]);
  });

  // The pattern addresses members by column id, so neither the order of the
  // tokens nor the order of the members may be assumed to match.
  it("resolves a token by column id, not by position", () => {
    const column = groupColumn([shortText, webshop], "{{2}} {{1}}");
    const value = [{ "de-DE": "Fahrrad" }, true];

    expect(getGroupDisplayParts(column, value, langtag)).toEqual([
      { value: true, label: "Webshop" },
      " ",
      "Fahrrad"
    ]);
  });

  it("renders a placeholder for a token that names no member", () => {
    const column = groupColumn([shortText], "{{1}} / {{99}}");

    expect(
      getGroupDisplayParts(column, [{ "de-DE": "Fahrrad" }], langtag)
    ).toEqual(["Fahrrad", " / ", "_"]);
  });

  it("renders a false boolean instead of dropping it", () => {
    const column = groupColumn([webshop, sale], "{{2}} {{3}}");

    expect(getGroupDisplayParts(column, [false, false], langtag)).toEqual([
      { value: false, label: "Webshop" },
      " ",
      { value: false, label: "sale" }
    ]);
  });

  it("treats a missing boolean value as false", () => {
    const column = groupColumn([webshop], "{{2}}");

    expect(getGroupDisplayParts(column, [null], langtag)).toEqual([
      { value: false, label: "Webshop" }
    ]);
  });

  it("reads a multilanguage boolean member per langtag", () => {
    const column = groupColumn([{ ...webshop, multilanguage: true }], "{{2}}");

    expect(getGroupDisplayParts(column, [{ "de-DE": true }], langtag)).toEqual([
      { value: true, label: "Webshop" }
    ]);
  });

  it("leaves out a boolean member the format pattern does not reference", () => {
    const column = groupColumn([shortText, webshop], "{{1}}");

    expect(
      getGroupDisplayParts(column, [{ "de-DE": "Fahrrad" }, true], langtag)
    ).toEqual(["Fahrrad"]);
  });

  it("keeps the placeholder of an empty non-boolean member", () => {
    const column = groupColumn([shortText, webshop], "{{1}} {{2}}");

    expect(getGroupDisplayParts(column, [{}, true], langtag)).toEqual([
      "_",
      " ",
      { value: true, label: "Webshop" }
    ]);
  });

  it("joins members with a space when there is no format pattern", () => {
    const column = groupColumn([shortText, webshop]);

    expect(
      getGroupDisplayParts(column, [{ "de-DE": "Fahrrad" }, true], langtag)
    ).toEqual(["Fahrrad", " ", { value: true, label: "Webshop" }]);
  });

  it("reads members and pattern from a union table's origin column", () => {
    const originColumn = groupColumn([webshop, sale], "{{2}} + {{3}}");
    const column = { ...groupColumn([]), originColumn };

    expect(getGroupDisplayParts(column, [true, false], langtag)).toEqual([
      { value: true, label: "Webshop" },
      " + ",
      { value: false, label: "sale" }
    ]);
  });

  it("strips emphasis markup a link member's format pattern contributes", () => {
    // A link member carries its own linkAttributes and formatPattern; those
    // are not part of what this module reads, hence the wider literal.
    const linkColumn = {
      id: 4,
      name: "material",
      kind: "link" as const,
      linkAttributes: [{ name: "percentage", kind: "integer" }],
      formatPattern: "{{value}} <em>{{attributes.percentage}}%</em>",
      toColumn: { id: 1, name: "identifier", kind: "shorttext" }
    };
    const column = groupColumn([linkColumn, webshop], "{{4}} {{2}}");
    const value = [[{ id: 10, value: "Stahl", attributes: [50] }], true];

    expect(getGroupDisplayParts(column, value, langtag)).toEqual([
      "Stahl 50%",
      " ",
      { value: true, label: "Webshop" }
    ]);
  });
});

describe("showsOnlyPlaceholders", () => {
  it("is true when every member is empty", () => {
    const column = groupColumn([shortText], "{{1}}");

    expect(showsOnlyPlaceholders(column, [{}], langtag)).toBe(true);
  });

  it("is false as soon as a member has a value", () => {
    const column = groupColumn([shortText], "{{1}}");

    expect(
      showsOnlyPlaceholders(column, [{ "de-DE": "Fahrrad" }], langtag)
    ).toBe(false);
  });

  // Such a group always shows the icon of its boolean member.
  it("is false for a group with a boolean member", () => {
    const column = groupColumn([shortText, webshop], "{{1}} {{2}}");

    expect(showsOnlyPlaceholders(column, [{}, false], langtag)).toBe(false);
  });
});
