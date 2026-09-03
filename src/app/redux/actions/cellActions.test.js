import { ColumnKinds } from "../../constants/TableauxConstants";
import {
  calculateCellUpdate,
  getEmptyValue,
  isEmptyValue
} from "./cellActions";

describe("isEmptyValue()", () => {
  describe("date", () => {
    test.each`
      x               | expected
      ${"2024-01-26"} | ${false}
      ${null}         | ${true}
    `("isEmptyValue $x = $expected", ({ x, expected }) => {
      expect(isEmptyValue(ColumnKinds.date, x)).toBe(expected);
    });
  });
  describe("datetime", () => {
    test.each`
      x                     | expected
      ${"2024-01-26T00:00"} | ${false}
      ${null}               | ${true}
    `("isEmptyValue $x = $expected", ({ x, expected }) => {
      expect(isEmptyValue(ColumnKinds.datetime, x)).toBe(expected);
    });
  });
});

describe("getEmptyValue()", () => {
  test.each`
    kind                      | expected
    ${ColumnKinds.attachment} | ${[]}
    ${ColumnKinds.currency}   | ${null}
    ${ColumnKinds.date}       | ${null}
    ${ColumnKinds.datetime}   | ${null}
    ${ColumnKinds.integer}    | ${null}
    ${ColumnKinds.link}       | ${[]}
    ${ColumnKinds.numeric}    | ${null}
    ${ColumnKinds.richtext}   | ${null}
    ${ColumnKinds.shorttext}  | ${null}
    ${ColumnKinds.text}       | ${null}
  `(
    "Empty value for cell kind $kind should be $expected",
    ({ kind, expected }) => {
      expect(getEmptyValue(kind)).toEqual(expected);
    }
  );
});

describe("calculateCellUpdate() - link reset branch with linkAttributes", () => {
  const percentageDef = { name: "percentage", kind: "integer" };

  test("link column with linkAttributes sends {id, attributes} per entry on reset", () => {
    const column = { kind: ColumnKinds.link, linkAttributes: [percentageDef] };
    const oldValue = [{ id: 1, value: "A", attributes: [50] }];
    const newValue = [
      { id: 2, value: "B" },
      { id: 3, value: "C", attributes: [75] }
    ];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update.method).toBe("PUT");
    expect(update.value).toEqual({
      value: [{ id: 2 }, { id: 3, attributes: [75] }]
    });
  });

  test("link column without linkAttributes still sends bare ids on reset", () => {
    const column = { kind: ColumnKinds.link };
    const oldValue = [{ id: 1, value: "A" }];
    const newValue = [
      { id: 2, value: "B" },
      { id: 3, value: "C" }
    ];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update.value).toEqual({ value: [2, 3] });
  });

  test("attachment column is unaffected and still sends bare uuids on reset", () => {
    const column = { kind: ColumnKinds.attachment };
    const oldValue = [{ uuid: "a" }];
    const newValue = [{ uuid: "b" }, { uuid: "c" }];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update.value).toEqual({ value: ["b", "c"] });
  });

  test("recovers attributes stripped from an incoming entry from oldValue (read-modify-write)", () => {
    const column = { kind: ColumnKinds.link, linkAttributes: [percentageDef] };
    const oldValue = [
      { id: 5, value: "Mehl", attributes: [50] },
      { id: 7, value: "Salz" }
    ];
    const newValue = [
      { id: 5, value: "Mehl" },
      { id: 6, value: "Wasser" }
    ];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update.value).toEqual({
      value: [{ id: 5, attributes: [50] }, { id: 6 }]
    });
  });

  test("handles newValue given as bare ids without crashing", () => {
    const column = { kind: ColumnKinds.link, linkAttributes: [percentageDef] };
    const oldValue = [{ id: 1, attributes: [50] }];
    const newValue = [2, 3];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update.value).toEqual({ value: [{ id: 2 }, { id: 3 }] });
  });
});

describe("calculateCellUpdate() - unaffected link branches", () => {
  test("isSame returns null", () => {
    const column = { kind: ColumnKinds.link };
    const value = [{ id: 1 }, { id: 2 }];
    expect(
      calculateCellUpdate({ column, oldValue: value, newValue: value })
    ).toBeNull();
  });

  test("reordering two linked rows still uses the /order endpoint", () => {
    const column = { kind: ColumnKinds.link, linkAttributes: [] };
    const oldValue = [{ id: 1 }, { id: 2 }];
    const newValue = [{ id: 2 }, { id: 1 }];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update.method).toBe("PUT");
    expect(update.pathPostfix).toMatch(/\/link\/\d+\/order$/);
  });

  test("adding a single link still uses PATCH with a bare id", () => {
    const column = { kind: ColumnKinds.link };
    const oldValue = [{ id: 1 }, { id: 2 }];
    const newValue = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update).toEqual({ method: "PATCH", value: { value: 3 } });
  });

  test("removing a single link still uses DELETE", () => {
    const column = { kind: ColumnKinds.link };
    const oldValue = [{ id: 1 }, { id: 2 }];
    const newValue = [{ id: 1 }];

    const update = calculateCellUpdate({ column, oldValue, newValue });

    expect(update.method).toBe("DELETE");
    expect(update.pathPostfix).toBe("/link/2");
  });
});

// An attribute-only change leaves every id in place, so comparing ids alone
// reported "nothing to do" -- undo/redo of one was a silent no-op.
describe("calculateCellUpdate() - attribute-only link changes", () => {
  const column = {
    kind: ColumnKinds.link,
    linkAttributes: [{ name: "percentage", kind: "integer" }],
    formatPattern: "{{value}} ({{attributes.percentage}}%)"
  };

  test("sends a PUT when only an attribute changed", () => {
    const update = calculateCellUpdate({
      column,
      oldValue: [{ id: 1, attributes: [50] }],
      newValue: [{ id: 1, attributes: [12] }]
    });

    expect(update).toEqual({
      method: "PUT",
      value: { value: [{ id: 1, attributes: [12] }] }
    });
  });

  test("clears the slot instead of replaying the value being undone", () => {
    // undo of "set 12 on a link that had nothing stored": the slot must be
    // nulled, not fall back to oldValue the way the reset branch does
    const update = calculateCellUpdate({
      column,
      oldValue: [{ id: 1, attributes: [12] }],
      newValue: [{ id: 1 }]
    });

    expect(update).toEqual({
      method: "PUT",
      value: { value: [{ id: 1, attributes: [null] }] }
    });
  });

  test("does not mistake an attribute change for a reordering", () => {
    const update = calculateCellUpdate({
      column,
      oldValue: [
        { id: 1, attributes: [50] },
        { id: 2, attributes: [10] }
      ],
      newValue: [
        { id: 1, attributes: [50] },
        { id: 2, attributes: [99] }
      ]
    });

    expect(update.method).toBe("PUT");
    expect(update.pathPostfix).toBeUndefined();
    expect(update.value.value).toEqual([
      { id: 1, attributes: [50] },
      { id: 2, attributes: [99] }
    ]);
  });

  test("still reports nothing to do when attributes are equal", () => {
    expect(
      calculateCellUpdate({
        column,
        oldValue: [{ id: 1, attributes: [50] }],
        newValue: [{ id: 1, attributes: [50] }]
      })
    ).toBe(null);
  });

  test("a column without linkAttributes is unaffected", () => {
    expect(
      calculateCellUpdate({
        column: { kind: ColumnKinds.link },
        oldValue: [{ id: 1, attributes: [50] }],
        newValue: [{ id: 1, attributes: [12] }]
      })
    ).toBe(null);
  });
});
