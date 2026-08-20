import Moment from "moment";
import { describe, expect, it } from "vitest";
import {
  buildAttributesPayload,
  formatAttributeValue,
  formatLinkLabel,
  getLinkAttributeDefinitions,
  hasLinkAttributes,
  LinkAttributeDefinition,
  parseAttributeInput,
  readLinkAttributes,
  setLinkAttributes,
  toAttributeInputValue,
  usesLinkAttributeFormat
} from "./linkAttributes";

const percentageDef: LinkAttributeDefinition = {
  name: "percentage",
  kind: "integer",
  displayName: { "de-DE": "Prozentanteil", "en-GB": "Percentage" }
};

const activeDef: LinkAttributeDefinition = {
  name: "active",
  kind: "boolean",
  displayName: { "de-DE": "Aktiv" }
};

const noteDef: LinkAttributeDefinition = {
  name: "note",
  kind: "text",
  displayName: { "de-DE": "Notiz" }
};

const dateDef: LinkAttributeDefinition = {
  name: "validFrom",
  kind: "date",
  displayName: { "de-DE": "Gültig ab" }
};

const datetimeDef: LinkAttributeDefinition = {
  name: "signedAt",
  kind: "datetime",
  displayName: { "de-DE": "Unterschrieben am" }
};

const columnWithFormat = (
  linkAttributes: LinkAttributeDefinition[],
  formatPattern: string
) => ({
  linkAttributes,
  formatPattern
});

describe("getLinkAttributeDefinitions / hasLinkAttributes / usesLinkAttributeFormat", () => {
  it("returns [] when the column has no linkAttributes", () => {
    expect(getLinkAttributeDefinitions({})).toEqual([]);
    expect(getLinkAttributeDefinitions(undefined)).toEqual([]);
    expect(hasLinkAttributes({})).toBe(false);
  });

  it("prefers originColumn when set (union tables)", () => {
    const column = {
      linkAttributes: [],
      originColumn: { linkAttributes: [percentageDef] }
    };
    expect(getLinkAttributeDefinitions(column)).toEqual([percentageDef]);
  });

  it("requires both linkAttributes and formatPattern to format", () => {
    expect(usesLinkAttributeFormat(columnWithFormat([percentageDef], ""))).toBe(
      false
    );
    expect(usesLinkAttributeFormat(columnWithFormat([], "{{value}}"))).toBe(
      false
    );
    expect(
      usesLinkAttributeFormat(columnWithFormat([percentageDef], "{{value}}"))
    ).toBe(true);
  });
});

describe("formatAttributeValue", () => {
  it("renders boolean true as the definition's displayName", () => {
    expect(
      formatAttributeValue({
        definition: activeDef,
        value: true,
        langtag: "de-DE"
      })
    ).toBe("Aktiv");
  });

  it("falls back to the definition's name when displayName is missing", () => {
    const def: LinkAttributeDefinition = { name: "active", kind: "boolean" };
    expect(
      formatAttributeValue({ definition: def, value: true, langtag: "de-DE" })
    ).toBe("active");
  });

  it("renders boolean false/null/missing as empty string, never a placeholder", () => {
    expect(
      formatAttributeValue({
        definition: activeDef,
        value: false,
        langtag: "de-DE"
      })
    ).toBe("");
    expect(
      formatAttributeValue({
        definition: activeDef,
        value: null,
        langtag: "de-DE"
      })
    ).toBe("");
    expect(
      formatAttributeValue({
        definition: activeDef,
        value: undefined,
        langtag: "de-DE"
      })
    ).toBe("");
  });

  it("keeps a stored 0 for numeric/integer kinds", () => {
    expect(
      formatAttributeValue({
        definition: percentageDef,
        value: 0,
        langtag: "de-DE"
      })
    ).toBe("0");
  });

  it("renders null/undefined as empty for non-boolean kinds", () => {
    expect(
      formatAttributeValue({
        definition: percentageDef,
        value: null,
        langtag: "de-DE"
      })
    ).toBe("");
    expect(
      formatAttributeValue({
        definition: noteDef,
        value: undefined,
        langtag: "de-DE"
      })
    ).toBe("");
  });

  it("formats date/datetime values to the user format", () => {
    expect(
      formatAttributeValue({
        definition: dateDef,
        value: "2020-01-01",
        langtag: "de-DE"
      })
    ).toBe("01.01.2020");
    expect(
      formatAttributeValue({
        definition: datetimeDef,
        value: "2020-01-01T12:00:00.000Z",
        langtag: "de-DE"
      })
    ).toContain("01.01.2020");
  });

  it("resolves a multilanguage attribute value without throwing", () => {
    expect(
      formatAttributeValue({
        definition: noteDef,
        value: { "de-DE": "Hallo", "en-GB": "Hello" },
        langtag: "de-DE"
      })
    ).toBe("Hallo");
  });
});

describe("formatLinkLabel", () => {
  const link = { id: 1, attributes: [50] };

  it("passes the displayValue through unchanged when there is no formatPattern", () => {
    expect(
      formatLinkLabel({
        column: { linkAttributes: [percentageDef] },
        link,
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl");
  });

  it("passes through when there is a formatPattern but no linkAttributes", () => {
    expect(
      formatLinkLabel({
        column: { formatPattern: "{{value}} ({{attributes.percentage}}%)" },
        link,
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl");
  });

  it("passes through taxonomy path arrays unchanged", () => {
    const displayValue = ["Root", "Child"];
    expect(
      formatLinkLabel({
        column: columnWithFormat(
          [percentageDef],
          "{{value}} ({{attributes.percentage}}%)"
        ),
        link,
        displayValue,
        langtag: "de-DE"
      })
    ).toBe(displayValue);
  });

  it("formats the happy path", () => {
    expect(
      formatLinkLabel({
        column: columnWithFormat(
          [percentageDef],
          "{{value}} ({{attributes.percentage}}%)"
        ),
        link,
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl (50%)");
  });

  it("falls back to the placeholder when attributes is missing entirely", () => {
    expect(
      formatLinkLabel({
        column: columnWithFormat(
          [percentageDef],
          "{{value}} ({{attributes.percentage}}%)"
        ),
        link: { id: 1 },
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl (_%)");
  });

  it("falls back to the placeholder for a stored null", () => {
    expect(
      formatLinkLabel({
        column: columnWithFormat(
          [percentageDef],
          "{{value}} ({{attributes.percentage}}%)"
        ),
        link: { id: 1, attributes: [null] },
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl (_%)");
  });

  it("renders a boolean attribute's displayName when true, empty when not", () => {
    const column = columnWithFormat(
      [activeDef],
      "{{value}} {{attributes.active}}"
    );
    expect(
      formatLinkLabel({
        column,
        link: { id: 1, attributes: [true] },
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl Aktiv");
    expect(
      formatLinkLabel({
        column,
        link: { id: 1, attributes: [false] },
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl");
    expect(
      formatLinkLabel({
        column,
        link: { id: 1 },
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl");
  });

  it("renders unknown tokens as empty without throwing", () => {
    expect(
      formatLinkLabel({
        column: columnWithFormat(
          [percentageDef],
          "{{value}} [{{attributes.nope}}] {{bogus}} {{1}}"
        ),
        link,
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl []");
  });

  it("tolerates whitespace inside moustache tokens", () => {
    expect(
      formatLinkLabel({
        column: columnWithFormat([percentageDef], "{{ value }}"),
        link,
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Mehl");
  });

  it("renders empty when base and all referenced attributes are empty", () => {
    expect(
      formatLinkLabel({
        column: columnWithFormat(
          [percentageDef],
          "{{value}} ({{attributes.percentage}}%)"
        ),
        link: { id: 1 },
        displayValue: "",
        langtag: "de-DE"
      })
    ).toBe("");
  });

  it("returns empty for rows hidden by row permissions", () => {
    expect(
      formatLinkLabel({
        column: columnWithFormat(
          [percentageDef],
          "{{value}} ({{attributes.percentage}}%)"
        ),
        link: { id: 1, hiddenByRowPermissions: true },
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("");
  });

  it("resolves the second of two definitions by positional index, not pattern order", () => {
    const column = columnWithFormat(
      [percentageDef, activeDef],
      "{{attributes.active}} {{value}} ({{attributes.percentage}}%)"
    );
    expect(
      formatLinkLabel({
        column,
        link: { id: 1, attributes: [50, true] },
        displayValue: "Mehl",
        langtag: "de-DE"
      })
    ).toBe("Aktiv Mehl (50%)");
  });
});

describe("toAttributeInputValue / parseAttributeInput", () => {
  it("round-trips a text value", () => {
    const input = toAttributeInputValue({
      definition: noteDef,
      value: "hi",
      langtag: "de-DE"
    });
    expect(input).toBe("hi");
    expect(parseAttributeInput({ definition: noteDef, input })).toBe("hi");
  });

  it("turns an empty text input into null", () => {
    expect(parseAttributeInput({ definition: noteDef, input: "" })).toBeNull();
  });

  it("round-trips an integer value", () => {
    const input = toAttributeInputValue({
      definition: percentageDef,
      value: 50,
      langtag: "de-DE"
    });
    expect(input).toBe(50);
    expect(parseAttributeInput({ definition: percentageDef, input })).toBe(50);
  });

  it("parses an invalid Moment input as null", () => {
    expect(
      parseAttributeInput({ definition: dateDef, input: Moment.invalid() })
    ).toBeNull();
  });

  it("parses a null/undefined input as null (explicit clear)", () => {
    expect(
      parseAttributeInput({ definition: dateDef, input: null })
    ).toBeNull();
    expect(
      parseAttributeInput({ definition: datetimeDef, input: undefined })
    ).toBeNull();
  });

  it("round-trips a datetime value between a stored UTC string and a Moment input", () => {
    const stored = "2020-01-01T12:00:00.000Z";
    const input = toAttributeInputValue({
      definition: datetimeDef,
      value: stored,
      langtag: "de-DE"
    }) as moment.Moment;
    expect(Moment.isMoment(input)).toBe(true);
    expect(input.isValid()).toBe(true);
    // The moment must represent the same instant regardless of the local
    // time zone the test runs in.
    expect(input.isSame(Moment(stored))).toBe(true);

    const parsed = parseAttributeInput({ definition: datetimeDef, input });
    expect(Moment(parsed).isSame(Moment(stored))).toBe(true);
  });

  it("returns null for an invalid/missing toAttributeInputValue source", () => {
    expect(
      toAttributeInputValue({
        definition: datetimeDef,
        value: undefined,
        langtag: "de-DE"
      })
    ).toBeNull();
  });
});

describe("buildAttributesPayload", () => {
  it("pads missing definitions with null and drops extras", () => {
    expect(
      buildAttributesPayload([percentageDef, activeDef], { 0: 50 })
    ).toEqual([50, null]);
  });

  it("keeps false and 0 rather than treating them as empty", () => {
    expect(buildAttributesPayload([percentageDef], { 0: 0 })).toEqual([0]);
    expect(buildAttributesPayload([activeDef], { 0: false })).toEqual([false]);
  });
});

describe("setLinkAttributes / readLinkAttributes", () => {
  const cellValue = [
    { id: 1, value: "Mehl", attributes: [50] },
    { id: 2, value: "Wasser" }
  ];

  it("patches only the matching link without mutating the input", () => {
    const updated = setLinkAttributes(1, [75], cellValue);
    expect(updated).toEqual([
      { id: 1, value: "Mehl", attributes: [75] },
      { id: 2, value: "Wasser" }
    ]);
    expect(cellValue[0]?.attributes).toEqual([50]);
  });

  it("leaves the array unchanged for an unknown linkId", () => {
    expect(setLinkAttributes(999, [1], cellValue)).toEqual(cellValue);
  });

  it("reads attributes for a matching link, undefined otherwise", () => {
    expect(readLinkAttributes(1, cellValue)).toEqual([50]);
    expect(readLinkAttributes(2, cellValue)).toBeUndefined();
    expect(readLinkAttributes(999, cellValue)).toBeUndefined();
  });
});
