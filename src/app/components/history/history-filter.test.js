import f from "lodash/fp";
import moment from "moment";

import {
  filterAnnotations,
  filterComments,
  filterHasValidDateProp,
  getCreationDay,
  getSearchableValues,
  isCurrentEnough,
  isOldEnough,
  matchesLangtag,
  matchesUser,
  reduceRevisionHistory,
  valueMatchesFilter
} from "./history-helpers";
import { mapIndexed } from "../../helpers/functools";
import rawLinkRevision from "./__fixtures__/linkhistory.json";
import rawRevisions from "./__fixtures__/multilanghistory.json";

describe("Revision history filters", () => {
  const column = {
    kind: "shorttext",
    multilang: true
  };
  const linkColumn = {
    kind: "link"
  };

  const revisions = reduceRevisionHistory(column)(rawRevisions);
  const linkRevisions = reduceRevisionHistory(linkColumn)(rawLinkRevision);

  describe("reduceRevisionHistory()", () => {
    it("accumulates total value from all prior changes", () => {
      expect(revisions[0].fullValue).not.toBeDefined();
      f.tail(revisions).forEach(rev => expect(rev.fullValue).toBeDefined());
    });

    it("flags changes which can not be reverted to", () => {
      f.tail(revisions).forEach(rev =>
        expect(rev.revertable).toBe(rev.event === "cell_changed")
      );
      for (let i = 0; i < 10; ++i) {
        const columnChanged =
          (((Math.random() * revisions.length) / 2) | 0) + revisions.length / 4;

        // Only change column type in cell changes before `columnChanged`
        const shouldKeepRevision = (idx, rev) =>
          idx > columnChanged && rev.event === "cell_changed";

        const changedRevisions = f.compose(
          reduceRevisionHistory(column),
          mapIndexed((rev, idx) =>
            shouldKeepRevision(idx, rev)
              ? rev
              : f.assoc("valueType", "DIFFERENT_COLUMN_TYPE", rev)
          )
        )(rawRevisions);

        // All value changes after column was changed to current value should be revertable
        // as should be all annotation changes. [0] === rowCreation, so always false
        changedRevisions.forEach((rev, idx) =>
          expect(rev.revertable).toBe(idx > 0 && shouldKeepRevision(idx, rev))
        );
      }
    });
  });

  describe("getCreationDay()", () => {
    it("gets valid date strings from timestamps", () => {
      revisions
        .map(getCreationDay)
        .forEach(day => expect(day).toMatch(/\d{4}-\d{2}-\d{2}/));
      expect(f.keys(f.groupBy(getCreationDay, revisions)).length).toBe(2);
    });

    it("is nil safe", () => {
      expect(getCreationDay(null)).toEqual("");
    });
  });

  describe("matchesLangtag()", () => {
    it("destinguishes multilang entries", () => {
      expect(revisions.filter(matchesLangtag("en-GB")).length).toBe(23);
      expect(revisions.filter(matchesLangtag("de-DE")).length).toBe(21);
    });
    it("lets all non-language entries pass", () => {
      expect(revisions.filter(matchesLangtag("no-such-langtag")).length).toBe(
        6
      );
    });
    it("is nil safe", () => {
      expect(revisions.filter(matchesLangtag("")).length).toBe(6);
      expect(revisions.filter(matchesLangtag(null)).length).toBe(6);
    });
  });

  describe("matchesUser()", () => {
    // All were initialised by "dev"; manually replaced 1 with "devil" and 2 with "test"

    it("filters exact user", () => {
      expect(revisions.filter(matchesUser({ author: "dev" })).length).toBe(
        revisions.length - 2
      );
      expect(revisions.filter(matchesUser({ author: "devil" })).length).toBe(1);
      expect(revisions.filter(matchesUser({ author: "test" })).length).toBe(2);
    });

    it("filters partial user", () => {
      expect(revisions.filter(matchesUser({ author: "de" })).length).toBe(
        revisions.length - 2
      );
      expect(revisions.filter(matchesUser({ author: "ev" })).length).toBe(
        revisions.length - 2
      );
      expect(revisions.filter(matchesUser({ author: "evil" })).length).toBe(1);
      expect(revisions.filter(matchesUser({ author: "e" })).length).toBe(
        revisions.length
      );
    });

    it("is nil safe", () => {
      expect(revisions.filter(matchesUser(null)).length).toBe(revisions.length);
      expect(revisions.filter(matchesUser({ author: null })).length).toBe(
        revisions.length
      );
    });
  });

  describe("filterHasValidDateProp()", () => {
    // momentjs throws warnings during our nil tests
    const originalWarn = console.warn;
    beforeAll(() => {
      console.warn = () => null;
    });
    afterAll(() => {
      console.warn = originalWarn;
    });

    it("recognizes valid dates", () => {
      expect(
        filterHasValidDateProp("fromDate", { fromDate: new moment() })
      ).toBe(true);
      expect(
        filterHasValidDateProp("fromDate", {
          fromDate: new moment("foobarbaz")
        })
      ).toBe(false);
      expect(filterHasValidDateProp("toDate", { toDate: new moment() })).toBe(
        true
      );
      expect(
        filterHasValidDateProp("toDate", {
          toDate: new moment("foobarbaz")
        })
      ).toBe(false);
    });

    it("is nil safe", () => {
      expect(filterHasValidDateProp("fromDate", null)).toBe(false);
      expect(filterHasValidDateProp("fromDate", { fromDate: null })).toBe(
        false
      );
      expect(filterHasValidDateProp("toDate", null)).toBe(false);
      expect(filterHasValidDateProp("toDate", { toDate: null })).toBe(false);
    });
  });

  describe("isCurrentEnough()", () => {
    it("lets newer values pass", () => {
      const revisionsNewerThan = fromDate =>
        revisions.filter(isCurrentEnough({ fromDate: moment(fromDate) }));
      expect(revisionsNewerThan("2019-04-06").length).toBe(revisions.length);
      expect(revisionsNewerThan("2019-04-16").length).toBe(revisions.length);
      expect(revisionsNewerThan("2019-04-17").length).toBe(25);
      // it makes more sense to use full days as we only have a date picker
      // expect(revisionsNewerThan("2019-04-17T08:06:07").length).toBe(2);
    });

    it("is nil safe", () => {
      expect(isCurrentEnough(null)(null)).toBe(true);
      expect(isCurrentEnough(null)({ fromDate: null })).toBe(true);
    });
  });

  describe("isOldEnough()", () => {
    it("lets no-newer-than values pass", () => {
      const revisionsOlderThan = (
        toDate // including the `toDate`
      ) => revisions.filter(isOldEnough({ toDate: moment(toDate) }));
      expect(revisionsOlderThan("2019-04-16").length).toBe(13);
      expect(revisionsOlderThan("2019-04-17").length).toBe(revisions.length);
      expect(revisionsOlderThan("2019-05-01").length).toBe(revisions.length);
    });

    it("is nil safe", () => {
      expect(isOldEnough(null)(null)).toBe(true);
      expect(isOldEnough(null)({ toDate: null })).toBe(true);
    });
  });

  describe("getSearchableValues", () => {
    it("gets text values", () => {
      expect(getSearchableValues("de-DE")(revisions[5])).toContain(
        "München, Weltstadt"
      );
    });
    it("gets link values", () => {
      f.tail(linkRevisions)
        .map(getSearchableValues("de-DE"))
        .forEach(values => {
          expect(f.isEmpty(values)).toBe(false);
          values.forEach(value => {
            expect(f.isString(value)).toBe(true);
          });
        });
    });
  });

  describe("valueMatchesFilter()", () => {
    it("filters values language specific", () => {
      // Test contains 5 row events, which don't get eliminated by the filter
      expect(
        revisions.filter(valueMatchesFilter({ value: "München" }, "de-DE"))
          .length
      ).toBe(34);
      expect(
        revisions.filter(valueMatchesFilter({ value: "München" }, "en-GB"))
          .length
      ).toBe(5);

      expect(
        revisions.filter(valueMatchesFilter({ value: "Munich" }, "de-DE"))
          .length
      ).toBe(5);
      expect(
        revisions.filter(valueMatchesFilter({ value: "Munich" }, "en-GB"))
          .length
      ).toBe(35);

      expect(
        revisions.filter(valueMatchesFilter({ value: "erz" }, "de-DE")).length
      ).toBe(10);

      // `foo` matches only comments so it must appear in all langtags
      expect(
        revisions.filter(valueMatchesFilter({ value: "foo" }, "de-DE")).length
      ).toBe(
        revisions.filter(valueMatchesFilter({ value: "foo" }, "en-GB")).length
      );
      expect(
        revisions.filter(
          valueMatchesFilter({ value: "foo" }, "no-such-langtag")
        ).length
      ).toBeGreaterThan(0);
    });

    it("Extracts link values correctly", () => {
      expect(
        valueMatchesFilter({ value: "franken" }, "de-DE")(linkRevisions[2])
      ).toBe(false);
      expect(
        linkRevisions.filter(valueMatchesFilter({ value: "bayern" }, "de-DE"))
          .length
      ).toBe(linkRevisions.length);
      expect(
        linkRevisions.filter(valueMatchesFilter({ value: "franken" }, "de-DE"))
          .length
      ).toBe(linkRevisions.length - 2);
    });

    it("is nil safe", () => {
      expect(valueMatchesFilter()()).toBe(true);
      expect(valueMatchesFilter({ value: null })()).toBe(true);
      expect(valueMatchesFilter({}, null)()).toBe(true);
      expect(valueMatchesFilter({ value: "something" }, null)()).toBe(true);
      expect(valueMatchesFilter({ value: "something" }, "de")()).toBe(true);
    });
  });

  describe("filterComments()", () => {
    it("lets comments pass if truthy", () => {
      expect(
        revisions.filter(filterComments({ showComments: true })).length
      ).toBe(revisions.length);
    });

    it("removes comments if falsy", () => {
      expect(
        revisions.filter(filterComments({ showComents: false })).length
      ).toBe(35);
    });

    it("is nil safe", () => {
      expect(revisions.filter(filterComments()).length).toBe(35);
      expect(
        revisions.filter(filterComments({ showComents: null })).length
      ).toBe(35);
    });
  });

  describe("filterAnnotations()", () => {
    it("lets annotations pass if truthy", () => {
      expect(
        revisions.filter(filterAnnotations({ showAnnotations: true })).length
      ).toBe(revisions.length);
    });

    it("removes annotations if falsy", () => {
      expect(
        revisions.filter(filterAnnotations({ showComents: false })).length
      ).toBe(34);
    });

    it("is nil safe", () => {
      expect(revisions.filter(filterAnnotations()).length).toBe(34);
      expect(
        revisions.filter(filterAnnotations({ showComents: null })).length
      ).toBe(34);
    });
  });
});
