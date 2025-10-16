import * as t from "../../helpers/transduce";
// use memoize from wrong lodash, as it supports passing a cache key resolver
// eslint-disable-next-line lodash-fp/use-fp
import { memoize } from "lodash";
import f from "lodash/fp";
import { TableType } from "../../constants/TableauxConstants";
import getDisplayValue from "../../helpers/getDisplayValue";
import { retrieveTranslation } from "../../helpers/multiLanguage";

// type alias BuildTreeNode =
//    { id: RowId
//    , displayValue: Record String
//    , parent: Maybe RowId
//    }
//
// type alias TreeNode = BuildTreeNode &
//   { children: List TreeNode
//   , onPath: Boolean
//   , expanded: Boolean }
//
// type alias TreeState =
//   { expandedNodeId: RowId
//   }

// tableToTreeNodes : { rows : List Row } -> List BuildTreeNode
export const tableToTreeNodes = ({ rows }) =>
  f.sortBy(
    "ordering",
    (rows || []).map(({ id, cells, values }) => {
      const displayValue = getDisplayValue(cells[0].column, values[0]);
      const parentId = f.prop([3, 0, "id"], values); // id of first (and only) link value in column 4
      const ordering = f.get(
        f.findIndex(f.propEq(["column", "name"], "ordering"), cells),
        values
      );

      return {
        id,
        displayValue,
        parent: parentId,
        ordering
      };
    })
  );

// buildTree : TreeState -> List TreeNode -> TreeNode
export const buildTree = ({ expandedNodeId }) => nodes => {
  const expandedNode = nodes.find(node => node.id === expandedNodeId);
  const nodesOnPathToExpanded = getPathToNode(nodes)(expandedNode).reduce(
    (ids, node) => {
      ids.add(node.id);
      return ids;
    },
    new Set()
  );
  const getSubtree = node => {
    const children = nodes.filter(n => n.parent === node.id);
    const expanded = node.id === expandedNodeId;
    const onPath = nodesOnPathToExpanded.has(node.id) && !expanded;
    return { ...node, children: children.map(getSubtree), expanded, onPath };
  };
  const rootNodes = nodes.filter(node => f.isNil(node.parent));
  return rootNodes.map(getSubtree);
};

// getPathToNode : List TreeNode -> List TreeNode
export const getPathToNode = nodes => {
  const nodeRecord = f.keyBy("id", nodes);
  return node => {
    let curNode = node;
    let path = [];
    while (curNode) {
      const parent = curNode.parent && nodeRecord[curNode.parent];
      if (parent) path.unshift(parent);
      curNode = parent;
    }

    return path;
  };
};

// findInTree : Langtag -> (String -> Boolean) -> List TreeNode -> List (TreeNode & { path: List (Record String) })
export const findTreeNodes = langtag => searchFn => nodes => {
  // eslint-disable-next-line lodash-fp/no-extraneous-args
  const findPath = memoize(getPathToNode(nodes), f.prop("id"));
  return t.transduceList(
    t.filter(node => searchFn(retrieveTranslation(langtag, node.displayValue))),
    t.map(node => ({ ...node, path: findPath(node) }))
  )(nodes);
};

// isLeaf : TreeNode -> Boolean
export const isLeaf = node => node && f.isEmpty(node.children);

// isTaxonomyTable : Table -> Boolean
export const isTaxonomyTable = table =>
  table && table.type === TableType.taxonomy;

// countVisibleChildren : TreeNode -> Int
export const countVisibleChildren = node =>
  node.expanded || node.onPath
    ? node.children.length +
      node.children
        .map(child => countVisibleChildren(child))
        .reduce((a, b) => a + b, 0)
    : 0;
