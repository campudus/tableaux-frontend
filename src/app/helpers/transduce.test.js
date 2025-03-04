import { describe, expect, it } from "vitest";
import * as t from "./transduce";
import * as fp from "lodash/fp";

describe("transducers", () => {
  it("should correctly map over a list", () => {
    const input = fp.range(0, 20);
    const f = x => x + 1;
    expect(t.transduceList(t.map(f))(input)).toEqual(input.map(f));
  });
  it("should correctly filter a list", () => {
    const input = fp.range(0, 20);
    const p = x => x % 2 === 0;
    expect(t.transduceList(t.filter(p))(input)).toEqual(input.filter(p));
  });
  it("should correctly reject list elements", () => {
    const input = fp.range(0, 20);
    const p = x => x % 2 === 0;
    expect(t.transduceList(t.reject(p))(input)).toEqual(
      input.filter(fp.complement(p))
    );
  });
  it("should correctly get uniques", () => {
    const n = 10;
    const base = fp.range(0, n);
    const input = [...base, ...base, ...base];
    const expected = fp.uniqBy(fp.identity)(input);
    const result = t.transduceList(t.uniqBy(fp.identity))(input);
    expect(result).toHaveLength(n);
    expect(result).toEqual(expected);
  });
  it("should combine different actions", () => {
    const input = fp.range(0, 20);
    const f1 = x => x * 3;
    const f2 = x => x - 1;
    const p1 = x => x % 2 === 0;
    const toKey = x => x % 10;

    const expected = fp.flow(
      fp.map(f1),
      fp.filter(p1),
      fp.map(f2),
      fp.uniqBy(toKey)
    )(input);

    const result = t.transduceList(
      t.map(f1),
      t.filter(p1),
      t.map(f2),
      t.uniqBy(toKey)
    )(input);

    expect(result).toEqual(expected);
  });
});
