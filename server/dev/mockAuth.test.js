import * as A from "./mockAuth";

describe("auth mocking", () => {
  describe("lookup building", () => {
    it("should parse a config", () => {
      const permission = A.parsePermissionObject({
        table: { ".*": { createColumn: true } }
      }).getValue();

      const lookup = A.toSearchable(permission);
      expect(lookup).toHaveLength(1);
      expect(lookup[0]).toBeInstanceOf(Function);
    });
    it("should reject bad permission names", () => {
      const parsed = A.parsePermissionObject({
        table: { ".*": { createColumn: true, createHouse: true } }
      });
      expect(parsed.isLeft()).toBe(true);
      expect(JSON.parse(parsed.getReason().message)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "unrecognized_keys" })
        ])
      );
    });
  });

  describe("findInSearchable()", () => {
    const canDeleteColumn = { delete: true };
    const canEdit = { editCellValue: true };
    const permissions = A.parsePermissionObject({
      columns: { "columns/11/?$": canEdit, ".*": canDeleteColumn }
    }).getValue();

    const asSearchable = A.toSearchable(permissions);
    const findPermission = path => A.findInSearchable(asSearchable, path);
    describe("columns", () => {
      it("should match any columns", () => {
        const result = findPermission("/tables/321/columns/1723");
        expect(result).toEqual(canDeleteColumn);
      });
      it("should match specific columns", () => {
        const result = findPermission("/tables/321/columns/11");
        expect(result).toEqual(canEdit);
      });
    });
  });
});
