import { describe, expect, it } from "vitest";
import * as t from "./taxonomy";
import { performance } from "perf_hooks";
import { range } from "lodash/fp";

const time = fn => (...args) => {
  const start = performance.now();
  // Randomly generated trees might contains stack-blowingly deep parent nestings.
  // We prefer that way over uglymising the code for artificial tests.
  try {
    fn(...args);
  } catch {
    // pass
  }
  return performance.now() - start;
};

const srand = seed => {
  let val = seed;
  return () => {
    const x = Math.sin(val++) * 10000;
    return x - Math.floor(x);
  };
};

describe("taxonomy helpers", () => {
  const nodes = [
    { id: 1, parent: null },
    { id: 2, parent: 1 },
    { id: 3, parent: 1 },
    { id: 4, parent: null },
    { id: 5, parent: 4 },
    { id: 6, parent: 5 },
    { id: 7, parent: 6 }
  ];

  describe("getPathToNode", () => {
    it("should find the correct path to specific nodes", () => {
      const startNode = nodes.find(node => node.id === 7);
      const path = t.getPathToNode(nodes)(startNode);
      expect(path.map(node => node.id)).toEqual([4, 5, 6]);
    });
    it("should return an empty path if root node is selected", () => {
      const startNode = nodes[0];
      expect(t.getPathToNode(nodes)(startNode)).toEqual([]);
    });
    it("should return an empty path if no node is given", () => {
      expect(t.getPathToNode(nodes)(null)).toEqual([]);
    });
    it("should return an empty path if node list is corrupt", () => {
      expect(t.getPathToNode(null)(nodes[0])).toEqual([]);
    });
  });

  describe("buildTree", () => {
    it("should create a tree from nodes", () => {
      const tree = t.buildTree({})(nodes);
      expect(tree).toEqual([
        {
          children: [
            { children: [], expanded: false, id: 2, onPath: false, parent: 1 },
            { children: [], expanded: false, id: 3, onPath: false, parent: 1 }
          ],
          expanded: false,
          id: 1,
          onPath: false,
          parent: null
        },
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: [],
                      expanded: false,
                      id: 7,
                      onPath: false,
                      parent: 6
                    }
                  ],
                  expanded: false,
                  id: 6,
                  onPath: false,
                  parent: 5
                }
              ],
              expanded: false,
              id: 5,
              onPath: false,
              parent: 4
            }
          ],
          expanded: false,
          id: 4,
          onPath: false,
          parent: null
        }
      ]);
    });
    it("should mark nodes correctly as expanded", () => {
      const tree = t.buildTree({ expandedNodeId: 6 })(nodes);
      expect(tree).toEqual([
        {
          children: [
            { children: [], expanded: false, id: 2, onPath: false, parent: 1 },
            { children: [], expanded: false, id: 3, onPath: false, parent: 1 }
          ],
          expanded: false,
          id: 1,
          onPath: false,
          parent: null
        },
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: [],
                      expanded: false,
                      id: 7,
                      onPath: false,
                      parent: 6
                    }
                  ],
                  expanded: true,
                  id: 6,
                  onPath: false,
                  parent: 5
                }
              ],
              expanded: false,
              id: 5,
              onPath: true,
              parent: 4
            }
          ],
          expanded: false,
          id: 4,
          onPath: true,
          parent: null
        }
      ]);
    });
    it("should build large trees performantly", () => {
      const random = srand(0xdeadbeef);
      const size = 2000;
      const threshold = 250;
      const manyNodes = range(0, size).map((_, idx) => {
        const isRootNode = random() < 0.05;
        return {
          id: idx,
          parent: isRootNode ? null : Math.round(random() * size)
        };
      });
      const buildUnexpanded = t.buildTree({});
      const buildExpanded = t.buildTree({
        expandedNodeId: Math.round(random() * size)
      });
      expect(time(buildUnexpanded)(manyNodes)).toBeLessThan(threshold);
      expect(time(buildExpanded)(manyNodes)).toBeLessThan(threshold);
    });
  });

  describe("findTreeNodes", () => {
    it("should find tree nodes by search function and add paths", () => {
      const labelledTreeNodes = [
        { id: 1, parent: null, displayValue: { en: "Not me" } },
        { id: 2, parent: 1, displayValue: { en: "I am worthy" } },
        { id: 3, parent: null, displayValue: { en: "Nope" } },
        { id: 4, parent: 3, displayValue: { en: "Yes! Me!" } },
        { id: 5, parent: 4, displayValue: { en: "I am none of the results" } },
        { id: 6, parent: 5, displayValue: { en: "I'm like a deep result" } }
      ];
      const search = str => !/no/i.test(str);

      const results = t.findTreeNodes("en")(search)(labelledTreeNodes);
      expect(results.length).toBe(3);
      expect(results[0].id).toBe(2);
      expect(results[0].path).toHaveLength(1);

      expect(results[1].id).toBe(4);
      expect(results[1].path).toHaveLength(1);

      expect(results[2].id).toBe(6);
      expect(results[2].path).toHaveLength(3);
    });

    it("should use multilang fallback search", () => {
      const labelledTreeNodes = [
        { id: 1, parent: null, displayValue: { de: "Des find ma" } },
        {
          id: 2,
          parent: 1,
          displayValue: { de: "Der Suche Erfolg trifft auch mich" }
        },
        {
          id: 3,
          parent: null,
          displayValue: { en: "Nope", de: "Ich will nicht." }
        },
        { id: 4, parent: 3, displayValue: { de: "Der Knoten ist gut." } },
        { id: 5, parent: 4, displayValue: { en: "I am none of the results" } },
        { id: 6, parent: 5, displayValue: { en: "I'm like a deep result" } }
      ];

      const search = str => /de/i.test(str);
      const results = t.findTreeNodes("en")(search)(labelledTreeNodes);

      expect(results).toEqual([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ id: 4 }),
        expect.objectContaining({ id: 6 })
      ]);
    });
  });
});
