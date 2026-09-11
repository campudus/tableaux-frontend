import { describe, expect, it, vi } from "vitest";

vi.mock("./authenticate", () => ({ shouldCheckPermissions: true }));

const { canUserChangeCell } = await import("./accessManagementHelper");

const member = (id, editCellValue) => ({
  id,
  kind: "shorttext",
  permission: { editCellValue }
});
const groupCell = (...groups) => ({
  table: { id: 1 },
  row: { id: 1 },
  kind: "group",
  column: { id: 10, kind: "group", groups }
});

describe("group cell permission", () => {
  it("is false when no member is editable", () => {
    const cell = groupCell(member(1, false), member(2, false));
    expect(canUserChangeCell(cell, "de-DE")).toBe(false);
  });

  it("is true when one member is editable", () => {
    const cell = groupCell(member(1, false), member(2, true));
    expect(canUserChangeCell(cell, "de-DE")).toBe(true);
  });

  it("respects per-language member permissions", () => {
    const cell = groupCell(member(1, false), {
      ...member(2, { "de-DE": true, "en-GB": false }),
      multilanguage: true
    });
    expect(canUserChangeCell(cell, "de-DE")).toBe(true);
    expect(canUserChangeCell(cell, "en-GB")).toBe(false);
  });

  it("is false for a group without members", () => {
    expect(canUserChangeCell(groupCell(), "de-DE")).toBe(false);
  });

  it("is false for a group column without a groups prop", () => {
    const cell = { table: { id: 1 }, row: { id: 1 }, column: { kind: "group" } };
    expect(canUserChangeCell(cell, "de-DE")).toBe(false);
  });

  it("works for a context that carries only the column", () => {
    const { column } = groupCell(member(1, true));
    expect(canUserChangeCell({ column, tableId: 1 }, "de-DE")).toBe(true);
  });
});
