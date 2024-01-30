import P from "./promise";

const sleep = t =>
  new Promise(resolve => setTimeout(resolve, Math.random() * t));

describe("promise helpers", () => {
  describe("chunk()", () => {
    it("should run a collection of promises in n-sized chunks", async () => {
      const stats = { curr: 0, max: 0 };

      const countConcurrentPromises = async t => {
        stats.curr++;
        await sleep(50);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
        return t;
      };
      const n = 10;
      const chunkSize = 3;
      const input = new Array(n).fill(1);
      const result = await P.chunk(chunkSize, countConcurrentPromises, input);

      expect(result).toEqual(input);
      expect(stats.max).toBe(chunkSize);
    });

    it("should work gracefully with underflow", async () => {
      const stats = { curr: 0, max: 0 };
      const countConcurrentPromises = async t => {
        stats.curr++;
        await sleep(t);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
      };
      const n = 2;
      const chunkSize = 5;

      await P.chunk(
        chunkSize,
        () => countConcurrentPromises(50),
        Array(n).fill(null)
      );

      expect(stats.max).toBe(n);
    });

    it("should work gracefully with empty arrays", async () => {
      const stats = { curr: 0, max: 0 };
      const countConcurrentPromises = async t => {
        stats.curr++;
        await sleep(t);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
      };

      const chunkSize = 3;

      await P.chunk(chunkSize, () => countConcurrentPromises(50), []);

      expect(stats.max).toBe(0);
    });

    it("should work gracefully with nullish values instead of arrays", async () => {
      const stats = { curr: 0, max: 0 };
      const countConcurrentPromises = async t => {
        stats.curr++;
        await sleep(t);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
      };

      const chunkSize = 3;

      await P.chunk(chunkSize, () => countConcurrentPromises(50), null);
      expect(stats.max).toBe(0);

      await P.chunk(chunkSize, () => countConcurrentPromises(50), undefined);
      expect(stats.max).toBe(0);
    });
  });

  describe("chunkWeighted()", () => {
    it("should run chunks of promises, based on a weighting function", async () => {
      const stats = { curr: 0, max: 0 };
      const countConcurrentPromises = async () => {
        stats.curr++;
        await sleep(50);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
      };
      const toWeight = x => x;
      const chunkSize = 3;

      await P.chunkWeighted(chunkSize, toWeight, countConcurrentPromises, [
        1,
        2,
        3,
        2,
        3,
        2,
        1
      ]);
      expect(stats.max).toBe(2);
    });
  });

  describe("sequentialize()", () => {
    it("should run a collection of promises sequentially", async () => {
      const stats = { curr: 0, max: 0 };
      const countConcurrentPromises = async t => {
        stats.curr++;
        await sleep(50);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
        return t;
      };
      const n = 10;

      const input = Array(n).map((_, idx) => idx);
      const resolved = await P.sequentialize(countConcurrentPromises, input);

      expect(resolved).toEqual(input);
      expect(stats.max).toBe(1);
    });

    it("should work gracefully with empty arrays", async () => {
      const stats = { curr: 0, max: 0 };
      const countConcurrentPromises = async t => {
        stats.curr++;
        await sleep(t);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
      };

      await P.sequentialize(() => countConcurrentPromises(50), []);
      expect(stats.max).toBe(0);
    });

    it("should work gracefully with nullish values instead of arrays", async () => {
      const stats = { curr: 0, max: 0 };
      const countConcurrentPromises = async t => {
        stats.curr++;
        await sleep(t);
        stats.max = Math.max(stats.curr, stats.max);
        stats.curr--;
      };

      await P.sequentialize(() => countConcurrentPromises(50), null);
      expect(stats.max).toBe(0);

      await P.sequentialize(() => countConcurrentPromises(50), undefined);
      expect(stats.max).toBe(0);
    });
  });
});
