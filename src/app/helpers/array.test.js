import { describe, expect, it } from "vitest";
import A from "./array";

describe("array helper", () => {
  describe("chunkWeighed", () => {
    const chunkWeighted = A.chunkWeighted(2, x => x);
    it("should create chunks according to weight", () => {
      expect(chunkWeighted([1, 1, 2, 1, 1])).toEqual([[1, 1], [2], [1, 1]]);
    });
    it("should treat underruns correctly", () => {
      expect(chunkWeighted([1, 1, 2, 1])).toEqual([[1, 1], [2], [1]]);
      expect(chunkWeighted([])).toEqual([]);
    });
    it("should treat nullish values for arrays gracefully", () => {
      expect(chunkWeighted(null)).toEqual([]);
      expect(chunkWeighted(undefined)).toEqual([]);
    });
  });
});
