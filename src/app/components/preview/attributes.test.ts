/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  getDefaultSelectedColumnId,
  sortColumnsAndRows,
  attributeKeys
} from "./attributes";
import { ColumnAndRow, ColumnAndRows } from "./helper";
import { Column, ColumnAttributeMap, ColumnKind } from "../../types/grud";

// Helper function for valid Row objects
function createRow(id: number): any {
  return { id, values: {} };
}

function createColumn(
  id: number,
  kind: ColumnKind,
  attributes: ColumnAttributeMap = {}
): any {
  return { id, kind, attributes };
}

function createColumnAndRow(column: Column): ColumnAndRow {
  // Use the column ID for the row ID to match types
  return { column, row: { id: column.id, values: {} } };
}

describe("getDefaultSelectedColumnId", () => {
  it("returns id of column set as default selected", () => {
    const columnsAndRows = [
      createColumnAndRow(createColumn(1, "link")),
      createColumnAndRow(
        createColumn(2, "richtext", {
          [attributeKeys.PREVIEW_DEFAULT_SELECTED]: {
            value: true,
            type: "boolean"
          }
        })
      ),
      createColumnAndRow(createColumn(3, "link"))
    ];
    expect(getDefaultSelectedColumnId(columnsAndRows)).toBe(2);
  });

  it("returns id of first valid preview column if no default selected", () => {
    const columnsAndRows = [
      createColumnAndRow(createColumn(1, "boolean")),
      createColumnAndRow(createColumn(2, "richtext")),
      createColumnAndRow(createColumn(3, "link"))
    ];
    expect(getDefaultSelectedColumnId(columnsAndRows)).toBe(2);
  });

  it("returns undefined if no valid preview column exists", () => {
    const columnsAndRows = [
      createColumnAndRow(createColumn(1, "boolean")),
      createColumnAndRow(createColumn(2, "currency"))
    ];
    expect(getDefaultSelectedColumnId(columnsAndRows)).toBeUndefined();
  });

  it("returns undefined for empty array", () => {
    expect(getDefaultSelectedColumnId([])).toBeUndefined();
  });

  it("returns id of first default selected column if multiple present", () => {
    const columnsAndRows = [
      createColumnAndRow(
        createColumn(1, "link", {
          [attributeKeys.PREVIEW_DEFAULT_SELECTED]: {
            value: true,
            type: "boolean"
          }
        })
      ),
      createColumnAndRow(
        createColumn(2, "richtext", {
          [attributeKeys.PREVIEW_DEFAULT_SELECTED]: {
            value: true,
            type: "boolean"
          }
        })
      )
    ];
    expect(getDefaultSelectedColumnId(columnsAndRows)).toBe(1);
  });

  it("skips previewTitle columns when searching for valid preview column", () => {
    const columnsAndRows = [
      createColumnAndRow(
        createColumn(1, "link", {
          [attributeKeys.PREVIEW_TITLE]: {
            value: true,
            type: "boolean"
          }
        })
      ),
      createColumnAndRow(createColumn(2, "link"))
    ];
    expect(getDefaultSelectedColumnId(columnsAndRows)).toBe(2);
  });
});

describe("sortColumnsAndRows", () => {
  it("sorts columns by sticky value ascending", () => {
    const columnsAndRows: ColumnAndRows[] = [
      {
        column: createColumn(1, "link", {
          [attributeKeys.PREVIEW_DETAIL_VIEW_STICKY_COLUMN]: {
            value: 2,
            type: "number"
          }
        }),
        rows: [createRow(1)]
      },
      {
        column: createColumn(2, "link", {
          [attributeKeys.PREVIEW_DETAIL_VIEW_STICKY_COLUMN]: {
            value: 1,
            type: "number"
          }
        }),
        rows: [createRow(2)]
      },
      {
        column: createColumn(3, "link"),
        rows: [createRow(3)]
      }
    ];
    const sorted = sortColumnsAndRows(columnsAndRows);
    expect(sorted.map(c => c.column.id)).toEqual([2, 1, 3]);
  });

  it("handles columns without sticky attribute", () => {
    const columnsAndRows: ColumnAndRows[] = [
      {
        column: createColumn(1, "link"),
        rows: [createRow(1)]
      },
      {
        column: createColumn(2, "link", {
          [attributeKeys.PREVIEW_DETAIL_VIEW_STICKY_COLUMN]: {
            value: 1,
            type: "number"
          }
        }),
        rows: [createRow(2)]
      }
    ];
    const sorted = sortColumnsAndRows(columnsAndRows);
    expect(sorted.map(c => c.column.id)).toEqual([2, 1]);
  });

  it("returns same order if all sticky values are undefined", () => {
    const columnsAndRows: ColumnAndRows[] = [
      {
        column: createColumn(1, "link"),
        rows: [createRow(1)]
      },
      {
        column: createColumn(2, "link"),
        rows: [createRow(2)]
      }
    ];
    const sorted = sortColumnsAndRows(columnsAndRows);
    expect(sorted.map(c => c.column.id)).toEqual([1, 2]);
  });

  it("returns same order for empty array", () => {
    const columnsAndRows: ColumnAndRows[] = [];
    expect(sortColumnsAndRows(columnsAndRows)).toEqual([]);
  });
});
