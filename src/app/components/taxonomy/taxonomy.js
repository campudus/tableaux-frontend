import * as t from "../../helpers/transduce";
// use memoize from wrong lodash, as it supports passing a cache key resolver
// eslint-disable-next-line lodash-fp/use-fp
import { memoize } from "lodash";
import f from "lodash/fp";
import getDisplayValue from "../../helpers/getDisplayValue";

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
  (rows || []).map(({ id, cells, values }) => {
    const displayValue = getDisplayValue(cells[0], values[0]);
    const parentId = f.prop([3, 0, "id"], values); // id of first (and only) link value in column 4

    return {
      id,
      displayValue,
      parent: parentId
    };
  });

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
    const go = (curNode, path) => {
      const parent = curNode && curNode.parent && nodeRecord[curNode.parent];
      if (parent) path.unshift(parent);
      return parent ? go(parent, path) : path;
    };
    return go(node, []);
  };
};

// findInTree : Langtag -> (String -> Boolean) -> List TreeNode -> List (TreeNode & { path: List (Record String) })
export const findTreeNodes = langtag => searchFn => nodes => {
  // eslint-disable-next-line lodash-fp/no-extraneous-args
  const findPath = memoize(getPathToNode(nodes), f.prop("id"));
  return t.transduceList(
    t.filter(node => searchFn(node.displayValue[langtag])),
    t.map(node => ({ ...node, path: findPath(node) }))
  )(nodes);
};

// isLeaf : TreeNode -> Boolean
export const isLeaf = node => node && f.isEmpty(node.children);

// isTaxonomyTable : Table -> Boolean
export const isTaxonomyTable = table => table && table.type === "taxonomy";
