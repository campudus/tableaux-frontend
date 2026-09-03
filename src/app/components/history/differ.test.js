import { ColumnKinds } from "../../constants/TableauxConstants";
import { calcRevisionDiff } from "./differ";

const langtag = "de-DE";
const cell = {
  column: {
    kind: ColumnKinds.link,
    linkAttributes: [{ name: "percentage", kind: "integer" }],
    formatPattern: "{{value}} ({{attributes.percentage}}%)"
  }
};
const currentDisplayValues = { 1: "Grau", 2: "Blau" };
const diffOf = revision =>
  calcRevisionDiff(cell, langtag, { currentDisplayValues, ...revision });

describe("calcRevisionDiff() - link attributes", () => {
  it("reports an attribute-only change as a deletion plus an addition", () => {
    // Both revisions link the same row, so diffing by id alone files this as
    // unchanged.
    const diff = diffOf({
      prevContent: [{ id: 1, value: "Grau", attributes: [50] }],
      fullValue: [{ id: 1, value: "Grau", attributes: [12] }]
    });

    expect(diff).toEqual([
      {
        del: true,
        value: { id: 1, value: "Grau", attributes: [50] },
        currentDisplayValues
      },
      {
        add: true,
        value: { id: 1, value: "Grau", attributes: [12] },
        currentDisplayValues
      }
    ]);
  });

  it("treats a newly set attribute as a change", () => {
    const diff = diffOf({
      prevContent: [{ id: 1, value: "Grau" }],
      fullValue: [{ id: 1, value: "Grau", attributes: [12] }]
    });

    expect(diff.map(d => [d.del, d.add])).toEqual([
      [true, undefined],
      [undefined, true]
    ]);
  });

  it("leaves a link with untouched attributes unchanged", () => {
    const diff = diffOf({
      prevContent: [{ id: 1, value: "Grau", attributes: [50] }],
      fullValue: [{ id: 1, value: "Grau", attributes: [50] }]
    });

    expect(diff).toEqual([
      {
        value: { id: 1, value: "Grau", attributes: [50] },
        currentDisplayValues
      }
    ]);
  });

  it("adds no noise for links that never had attributes", () => {
    const diff = diffOf({
      prevContent: [{ id: 1, value: "Grau" }],
      fullValue: [{ id: 1, value: "Grau" }]
    });

    expect(diff).toEqual([
      { value: { id: 1, value: "Grau" }, currentDisplayValues }
    ]);
  });

  it("still reports added and removed links", () => {
    const diff = diffOf({
      prevContent: [{ id: 1, value: "Grau", attributes: [50] }],
      fullValue: [{ id: 2, value: "Blau", attributes: [12] }]
    });

    expect(diff).toEqual([
      {
        del: true,
        value: { id: 1, value: "Grau", attributes: [50] },
        currentDisplayValues
      },
      {
        add: true,
        value: { id: 2, value: "Blau", attributes: [12] },
        currentDisplayValues
      }
    ]);
  });

  it("combines a removed link with an attribute change on the remaining one", () => {
    const diff = diffOf({
      prevContent: [
        { id: 1, value: "Grau", attributes: [50] },
        { id: 2, value: "Blau", attributes: [10] }
      ],
      fullValue: [{ id: 2, value: "Blau", attributes: [99] }]
    });

    expect(diff).toEqual([
      {
        del: true,
        value: { id: 1, value: "Grau", attributes: [50] },
        currentDisplayValues
      },
      {
        del: true,
        value: { id: 2, value: "Blau", attributes: [10] },
        currentDisplayValues
      },
      {
        add: true,
        value: { id: 2, value: "Blau", attributes: [99] },
        currentDisplayValues
      }
    ]);
  });

  it("handles a first revision without a predecessor", () => {
    const diff = diffOf({
      fullValue: [{ id: 1, value: "Grau", attributes: [12] }]
    });

    expect(diff).toEqual([
      {
        add: true,
        value: { id: 1, value: "Grau", attributes: [12] },
        currentDisplayValues
      }
    ]);
  });
});
