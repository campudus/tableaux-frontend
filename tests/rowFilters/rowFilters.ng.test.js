import RowFilters, {
  Boolean,
  Date,
  DateTime,
  Number,
  Text
} from "../../src/app/RowFilters";
import store from "./fixtures/store.json";

const tableId = 3;
const langtag = "de-DE";

const rows = store.rows[3].data;
describe("buildContext()", () => {
  const ctx = RowFilters.buildContext(tableId, langtag, store);
  describe("getValues()", () => {
    it("boolean", () => {
      expect(ctx.getValue("boolean")(rows[0])).toEqual(true);
      expect(ctx.getValue("boolean")(rows[1])).toEqual(false);
    });
    it("date", () => {
      expect(ctx.getValue("date")(rows[0])).toEqual("2024-08-05");
      expect(ctx.getValue("date")(rows[1])).toEqual("2024-08-23");
    });
    it("datetime", () => {
      expect(ctx.getValue("datetime")(rows[0])).toEqual(
        "2024-08-04T00:00:00.000Z"
      );
      expect(ctx.getValue("datetime")(rows[1])).toEqual(
        "2024-08-23T00:00:00.000Z"
      );
    });
    it("integer", () => {
      expect(ctx.getValue("integer")(rows[0])).toEqual(123);
      expect(ctx.getValue("integer")(rows[1])).toEqual(456);
    });
    it("link", () => {
      expect(ctx.getValue("link")(rows[0])).toEqual("Bayern München");
      expect(ctx.getValue("link")(rows[1])).toEqual(
        "Berlin Berlin Hamburg Hamburg"
      );
    });
    it("numeric", () => {
      expect(ctx.getValue("numeric")(rows[0])).toEqual(1.123);
      expect(ctx.getValue("numeric")(rows[1])).toEqual(2.123);
    });
    it("richtext", () => {
      expect(ctx.getValue("richtext")(rows[0])).toEqual("Ritchie der Textie");
      expect(ctx.getValue("richtext")(rows[1])).toEqual(
        "Lorem ipsum dolor sit amet"
      );
    });
    it("shorrtext", () => {
      expect(ctx.getValue("shorttext")(rows[0])).toEqual("Schnappt Shortie");
      expect(ctx.getValue("shorttext")(rows[1])).toEqual("ad libidum");
    });
    it("text", () => {
      expect(ctx.getValue("text")(rows[0])).toEqual("Laber den Rhabarber");
      expect(ctx.getValue("text")(rows[1])).toEqual(
        "Lorem ipsum dolor sit amet"
      );
    });
  });
  describe("getValueFilter()", () => {
    describe("Boolean", () => {
      const valueOf = ctx.getValue("boolean");
      it("isSet", () => {
        const matches = ctx.getValueFilter("boolean", Boolean.isSet, "");
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("isUnset", () => {
        const matches = ctx.getValueFilter("boolean", Boolean.isUnset, "");
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
    });
    describe("Text", () => {
      const valueOf = ctx.getValue("text");
      it("contains", () => {
        const matches = ctx.getValueFilter(
          "text",
          Text.contains,
          " ipsum dolor    "
        );
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("ends-with", () => {
        const matches = ctx.getValueFilter("text", Text.endsWith, "sit amet");
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("equals", () => {
        const matches = ctx.getValueFilter(
          "text",
          Text.equals,
          "lorem ipsum dolor sit amet"
        );
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("is-empty", () => {
        const matches = ctx.getValueFilter("text", Text.isEmpty);
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(false);
        expect(matches(valueOf(rows[2]))).toBe(true);
      });
      it("is-not-empty", () => {
        const matches = ctx.getValueFilter("text", Text.isNotEmpty);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(true);
        expect(matches(valueOf(rows[2]))).toBe(false);
      });
      it.skip("like", () => {
        // not implemented yet
        const matches = ctx.getValueFilter("text", Text.like, "lorem ipsum");
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("starts-with", () => {
        const matches = ctx.getValueFilter(
          "text",
          Text.startsWith,
          "lorem ipsum"
        );
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
    });
    describe("Date", () => {
      const valueOf = ctx.getValue("date");
      it("equals", () => {
        const matches = ctx.getValueFilter("date", Date.equals, "2024-08-05");
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("lt", () => {
        const matches = ctx.getValueFilter("date", Date.lt, "2024-08-06");
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("lte", () => {
        const matches = ctx.getValueFilter("date", Date.lte, "2024-08-05");
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("is-empty", () => {
        const matches = ctx.getValueFilter("date", Date.isEmpty);
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(false);
        expect(matches(valueOf(rows[2]))).toBe(true);
      });
      it("is-not-empty", () => {
        const matches = ctx.getValueFilter("date", Date.isNotEmpty);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(true);
        expect(matches(valueOf(rows[2]))).toBe(false);
      });
      it("gt", () => {
        const matches = ctx.getValueFilter("date", Date.gt, "2024-08-06");
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("gte", () => {
        const matches = ctx.getValueFilter("date", Date.gte, "2024-08-23");
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
    });
    describe("DateTime", () => {
      const valueOf = ctx.getValue("datetime");
      it("equals", () => {
        const matches = ctx.getValueFilter(
          "datetime",
          DateTime.equals,
          "2024-08-04T00:00:00.000Z"
        );
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("lt", () => {
        const matches = ctx.getValueFilter(
          "datetime",
          DateTime.lt,
          "2024-08-04T00:00:01.000Z"
        );
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("lte", () => {
        const matches = ctx.getValueFilter(
          "datetime",
          DateTime.lte,
          "2024-08-04T00:00:00.000Z"
        );
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("is-empty", () => {
        const matches = ctx.getValueFilter("datetime", DateTime.isEmpty);
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(false);
        expect(matches(valueOf(rows[2]))).toBe(true);
      });
      it("is-not-empty", () => {
        const matches = ctx.getValueFilter("datetime", DateTime.isNotEmpty);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(true);
        expect(matches(valueOf(rows[2]))).toBe(false);
      });
      it("gt", () => {
        const matches = ctx.getValueFilter(
          "datetime",
          DateTime.gt,
          "2024-08-04T00:00:00.000Z"
        );
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("gte", () => {
        const matches = ctx.getValueFilter(
          "datetime",
          DateTime.gte,
          "2024-08-23T00:00:00.000Z"
        );
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
    });
    describe("Number", () => {
      const valueOf = ctx.getValue("integer");
      it("equals", () => {
        const matches = ctx.getValueFilter("integer", Number.equals, 123);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("gt", () => {
        const matches = ctx.getValueFilter("integer", Number.gt, 123);
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("gte", () => {
        const matches = ctx.getValueFilter("integer", Number.gte, 123);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(true);
      });
      it("is-empty", () => {
        const matches = ctx.getValueFilter("integer", Number.isEmpty);
        expect(matches(valueOf(rows[0]))).toBe(false);
        expect(matches(valueOf(rows[1]))).toBe(false);
        expect(matches(valueOf(rows[2]))).toBe(true);
      });
      it("is-not-empty", () => {
        const matches = ctx.getValueFilter("integer", Number.isNotEmpty);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(true);
        expect(matches(valueOf(rows[2]))).toBe(false);
      });
      it("lt", () => {
        const matches = ctx.getValueFilter("integer", Number.lt, 456);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
      it("lte", () => {
        const matches = ctx.getValueFilter("integer", Number.lte, 123);
        expect(matches(valueOf(rows[0]))).toBe(true);
        expect(matches(valueOf(rows[1]))).toBe(false);
      });
    });
  });
  describe("parse and compose", () => {
    const parse = RowFilters.parse(ctx);
    it("VALUE", () => {
      const filter = parse(["value", "text", Text.startsWith, "lorem"]);
      expect(filter(rows[0])).toBe(false);
      expect(filter(rows[1])).toBe(true);
    });
    it("and, same column", () => {
      const isBetween0and200 = parse([
        "and",
        ["value", "integer", Number.gte, 0],
        ["value", "integer", Number.lte, 200]
      ]);
      expect(isBetween0and200(rows[0])).toBe(true);
      expect(isBetween0and200(rows[1])).toBe(false);
    });
    it("and, mixed column", () => {
      const filter = parse([
        "and",
        ["value", "integer", Number.gte, 200],
        ["value", "shorttext", Text.isNotEmpty]
      ]);
      expect(filter(rows[0])).toBe(false);
      expect(filter(rows[1])).toBe(true);
    });
    it("or, same column", () => {
      const filter = parse([
        "or",
        ["value", "integer", Number.gt, 200],
        ["value", "integer", Number.equals, 123]
      ]);
      expect(filter(rows[0])).toBe(true);
      expect(filter(rows[1])).toBe(true);
      expect(filter(rows[2])).toBe(false);
    });
    it("or, mixed column", () => {
      const filter = parse([
        "or",
        ["value", "integer", Number.gt, 200],
        ["value", "richtext", Text.contains, "ritchie"]
      ]);
      expect(filter(rows[0])).toBe(true);
      expect(filter(rows[1])).toBe(true);
      expect(filter(rows[2])).toBe(false);
    });
    it("nesting", () => {
      const filter = parse([
        "or",
        ["value", "richtext", Text.contains, "ritchie"],
        [
          "and",
          ["value", "integer", Number.gte, 200],
          ["value", "integer", Number.lte, 500]
        ],
        ["value", "datetime", DateTime.isEmpty]
      ]);
      expect(filter(rows[0])).toBe(true);
      expect(filter(rows[1])).toBe(true);
      expect(filter(rows[2])).toBe(true);
    });
  });
});