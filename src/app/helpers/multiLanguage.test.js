import moment from "moment";

import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
  readLocalizedNumber,
  toPlainDate
} from "./multiLanguage";

describe("multiLanguage.js", () => {
  const validDateString = "2018-11-01T13:33:31";
  const dateFormatDeDE = /\d{1,2}\.\d{1,2}\.\d{4}/;
  const dateFormatEnUS = /\d{1,2}\/\d{1,2}\/\d{4}/;
  const dateFormatEnGB = /\d{2}\/\d{2}\/\d{4}/;
  const timeFormat24h = /([0-1]\d)|(2[0-3]):[0-5]\d:[0-5]\d/;
  const timeFormatAMPM = /([0-1]?\d)|(2[0-3]):[0-5]\d:[0-5]\d (AM|PM)/;
  const dateTimeFormatDeDE = new RegExp(
    dateFormatDeDE.source + ", " + timeFormat24h.source
  );
  const dateTimeFormatEnUS = new RegExp(
    dateFormatEnUS.source + ", " + timeFormatAMPM.source
  );
  const dateTimeFormatEnGB = new RegExp(
    dateFormatEnGB.source + ", " + timeFormat24h.source
  );

  const oldWarn = console.warn;

  beforeAll(() => {
    console.warn = () => null;
  });

  afterAll(() => {
    console.warn = oldWarn;
  });

  describe("toPlainDate()", () => {
    it("parses different date formats", () => {
      expect(toPlainDate(validDateString)).toBeInstanceOf(Date);
      expect(toPlainDate(new Date(validDateString))).toBeInstanceOf(Date);
      expect(toPlainDate(moment(validDateString))).toBeInstanceOf(Date);
      expect(toPlainDate(new Date())).toBeInstanceOf(Date);
      expect(toPlainDate(moment())).toBeInstanceOf(Date);
    });

    it("throws on bad inputs", () => {
      expect(() => toPlainDate("bad date format")).toThrow();
      expect(() => toPlainDate(12345)).toThrow();
      expect(() => toPlainDate({})).toThrow();
      expect(() => toPlainDate([])).toThrow();
      expect(() => toPlainDate("123 456 789")).toThrow();
    });
  });

  describe("formatDate()", () => {
    it("formats dates properly", () => {
      expect(formatDate(validDateString, "de-DE")).toMatch(dateFormatDeDE);
      expect(formatDate(validDateString, "de-DE")).toEqual("1.11.2018");
      expect(formatDate(validDateString, "en-US")).toMatch(dateFormatEnUS);
      expect(formatDate(validDateString, "en-US")).toEqual("11/1/2018");
      expect(formatDate(validDateString, "en-GB")).toMatch(dateFormatEnGB);
      expect(formatDate(validDateString, "en-GB")).toEqual("01/11/2018");

      [new Date(), moment()].forEach(timestamp => {
        expect(formatDate(timestamp, "de-DE")).toMatch(dateFormatDeDE);
        expect(formatDate(timestamp, "en-US")).toMatch(dateFormatEnUS);
        expect(formatDate(timestamp, "en-GB")).toMatch(dateFormatEnGB);
      });
    });

    it("handles bad input gracefully", () => {
      expect(formatDate("bad input", "de-DE")).toEqual("");
      expect(formatDate(null, null)).toEqual("");
    });
  });

  describe("formatTime()", () => {
    it("formats times properly", () => {
      expect(formatTime(validDateString, "de-DE")).toMatch(timeFormat24h);
      expect(formatTime(validDateString, "de-DE")).toEqual("13:33:31");
      expect(formatTime(validDateString, "en-US")).toMatch(timeFormatAMPM);
      expect(formatTime(validDateString, "en-US")).toEqual("1:33:31 PM");
      expect(formatTime(validDateString, "en-GB")).toMatch(timeFormat24h);
      expect(formatTime(validDateString, "en-GB")).toEqual("13:33:31");

      [new Date(), moment()].forEach(timestamp => {
        expect(formatTime(timestamp, "de-DE")).toMatch(timeFormat24h);
        expect(formatTime(timestamp, "en-US")).toMatch(timeFormatAMPM);
        expect(formatTime(timestamp, "en-GB")).toMatch(timeFormat24h);
      });
    });

    it("handles bad input gracefully", () => {
      expect(formatTime("bad input", "de-DE")).toEqual("");
      expect(formatTime(null, null)).toEqual("");
    });
  });

  describe("formatDateTime()", () => {
    it("formats dateTimes properly", () => {
      expect(formatDateTime(validDateString, "de-DE")).toMatch(
        dateTimeFormatDeDE
      );
      expect(formatDateTime(validDateString, "de-DE")).toEqual(
        "1.11.2018, 13:33:31"
      );
      expect(formatDateTime(validDateString, "en-US")).toMatch(
        dateTimeFormatEnUS
      );
      expect(formatDateTime(validDateString, "en-US")).toEqual(
        "11/1/2018, 1:33:31 PM"
      );
      expect(formatDateTime(validDateString, "en-GB")).toMatch(
        dateTimeFormatEnGB
      );
      expect(formatDateTime(validDateString, "en-GB")).toEqual(
        "01/11/2018, 13:33:31"
      );

      [new Date(), moment()].forEach(dateTimestamp => {
        expect(formatDateTime(dateTimestamp, "de-DE")).toMatch(
          dateTimeFormatDeDE
        );
        expect(formatDateTime(dateTimestamp, "en-US")).toMatch(
          dateTimeFormatEnUS
        );
        expect(formatDateTime(dateTimestamp, "en-GB")).toMatch(
          dateTimeFormatEnGB
        );
      });
    });

    it("handles bad input gracefully", () => {
      expect(formatDateTime("bad input", "de-DE")).toEqual("");
      expect(formatDateTime(null, null)).toEqual("");
    });
  });

  describe("formatNumber()", () => {
    it("converts to numbers", () => {
      expect(formatNumber(2)).toEqual("2");
      expect(formatNumber("2")).toEqual("2");
    });

    it("handles non-numbers gracefully", () => {
      expect(formatNumber(null)).toEqual("");
      expect(formatNumber({})).toEqual("");
      expect(formatNumber(undefined)).toEqual("");
    });

    it("formats numbers correctly", () => {
      const decimalComma = /^-?\d+(\.\d{3})*(,\d+)?$/;
      const decimalPoint = /^-?\d+(,\d{3})*(\.\d+)?$/;

      // No separators for [-999, 999]
      expect(formatNumber(123, 3, "de-DE")).toMatch(decimalComma);
      expect(formatNumber(123, 3, "de-DE")).toMatch(decimalPoint);

      expect(formatNumber(1.01, 3, "de-DE")).toMatch(decimalComma);
      expect(formatNumber(1.01, 3, "en-US")).toMatch(decimalPoint);
      expect(formatNumber(1000.01, 3, "de-DE")).toMatch(decimalComma);
      expect(formatNumber(1000.01, 3, "en-US")).toMatch(decimalPoint);

      expect(formatNumber(1000.01, 3, "de")).toMatch(decimalComma);
      expect(formatNumber(1000.01, 3, "en")).toMatch(decimalPoint);
    });
  });

  describe("readLocalizedNumber()", () => {
    it("keeps dot-separated numbers", () => {
      expect(readLocalizedNumber("1.000", "en-US")).toBe(1);
      expect(readLocalizedNumber("-1.000", "en-US")).toBe(-1);
      expect(readLocalizedNumber("1,000", "en-US")).toBe(1000);
      expect(readLocalizedNumber("1,000.000", "en-US")).toBe(1000);
      expect(readLocalizedNumber("1,000.000", "en")).toBe(1000);
    });

    it("transforms comma-separated numbers", () => {
      expect(readLocalizedNumber("-1,000", "de-DE")).toBe(-1);
      expect(readLocalizedNumber("1,000", "de-DE")).toBe(1);
      expect(readLocalizedNumber("1.000", "de-DE")).toBe(1000);
      expect(readLocalizedNumber("1.000,000", "de-DE")).toBe(1000);
      expect(readLocalizedNumber("1.000,000", "de")).toBe(1000);
    });

    it("handles bad input gracefully", () => {
      expect(readLocalizedNumber(null, "de-DE")).toEqual(NaN);
      expect(
        readLocalizedNumber("Hey stupid! What you're gonna do?", "en-US")
      ).toEqual(NaN);
      expect(readLocalizedNumber("123.45.67.890", "en-US")).toEqual(123.45);
    });
  });
});
