import { vi } from "vitest";

vi.mock("../helpers/apiHelper", () => ({ makeRequest: vi.fn() }));

import columnResponse from "./__fixtures/modelColumns.json";

import { makeRequest } from "../helpers/apiHelper";
import {
  calcColumnDependencies,
  hasTransitiveDependencies,
  refreshDependentRows
} from "./updateDependentTables";

describe("Dependent state updates", () => {
  const columnCollection = { 95: { data: columnResponse.columns } };
  describe("calcColumnDependencies()", () => {
    it("does stuff", () => {
      const dependencyMap = calcColumnDependencies(columnCollection);
      expect(dependencyMap[69][95]).toEqual([60]);
      expect(dependencyMap).toMatchSnapshot();
    });

    it("yields no dependencies for a table whose columns are still loading", () => {
      const dependencyMap = calcColumnDependencies({
        3: { data: [{ id: 5, kind: "link", toTable: 1 }] },
        // what COLUMNS_LOADING_DATA puts in the store: no `data` yet
        1: { error: false, finishedLoading: false }
      });
      expect(dependencyMap).toEqual({ 1: { 3: [5] } });
    });
  });

  describe("hasTransitiveDependencies()", () => {
    // The dependency map is memoized process-wide, so each case uses fresh ids.
    it("is true once both sides' columns are loaded", () => {
      expect(
        hasTransitiveDependencies(100, {
          300: { data: [{ id: 5, kind: "link", toTable: 100 }] },
          100: { data: [{ id: 7, kind: "link", toTable: 300 }] }
        })
      ).toBe(true);
    });

    it("is not poisoned by a map computed while columns were still loading", () => {
      // Regression: the memo key ignored whether an entry had `data`, so the
      // incomplete map cached during COLUMNS_LOADING_DATA was reused after
      // COLUMNS_DATA_LOADED (same key set). refreshDependentRows then skipped
      // its refetch for the rest of the session and dependent displayValues --
      // e.g. a link label after its target row was renamed -- stayed stale.
      const source = { data: [{ id: 5, kind: "link", toTable: 101 }] };

      hasTransitiveDependencies(101, {
        301: source,
        101: { error: false, finishedLoading: false }
      });

      expect(
        hasTransitiveDependencies(101, {
          301: source,
          101: { data: [{ id: 7, kind: "link", toTable: 301 }] }
        })
      ).toBe(true);
    });
  });

  describe("refreshDependentRows()", () => {
    const SRC = 903;
    const TGT = 901;
    const srcIdent = { id: 950, kind: "shorttext", multilanguage: true };
    const tgtIdent = { id: 901, kind: "shorttext", multilanguage: true };
    const linkColumn = {
      id: 905,
      kind: "link",
      toTable: TGT,
      toColumn: tgtIdent
    };

    const mkState = tgtColumns => ({
      columns: {
        [SRC]: { data: [srcIdent, linkColumn] },
        [TGT]: { data: tgtColumns }
      },
      rows: {
        [SRC]: {
          data: [
            {
              id: 10,
              values: [
                { "de-DE": "Rezept" },
                [{ id: 1, value: { "de-DE": "Grau" } }]
              ]
            }
          ]
        },
        [TGT]: { data: [{ id: 1, values: [{ "de-DE": "Blau" }] }] }
      },
      tableView: {
        displayValues: {
          [SRC]: [
            { id: 10, values: [{ "de-DE": "Rezept" }, [{ "de-DE": "Grau" }]] }
          ],
          [TGT]: [{ id: 1, values: [{ "de-DE": "Blau" }] }]
        }
      }
    });

    // Regression: the first level used to be gated on
    // hasTransitiveDependencies(changeOrigin), which asks whether the
    // dependents have dependents of their own. With no backlink column in the
    // target table nothing linked back, so renaming a linked row never
    // refreshed the row holding the link and its displayValue stayed stale.
    it("refetches the linking row even without a backlink column", async () => {
      makeRequest.mockResolvedValue({
        id: 10,
        values: [{ "de-DE": "Rezept" }, [{ id: 1, value: { "de-DE": "Blau" } }]]
      });

      const next = await refreshDependentRows(TGT, [1], mkState([tgtIdent]));

      expect(
        makeRequest.mock.calls.some(([{ apiRoute }]) =>
          String(apiRoute).includes(`/tables/${SRC}/rows/10`)
        )
      ).toBe(true);
      // the refreshed row carries the new target label
      expect(next.tableView.displayValues[SRC][0].values[1]).toEqual([
        { "de-DE": "Blau" }
      ]);
    });

    it("does nothing when the changed table has no dependents at all", async () => {
      makeRequest.mockClear();
      const state = mkState([tgtIdent]);

      // SRC is not a link target here, so nothing depends on it
      expect(await refreshDependentRows(SRC, [10], state)).toBe(state);
      expect(makeRequest).not.toHaveBeenCalled();
    });
  });
});
