import * as t from "../../helpers/transduce";
// use memoize from wrong lodash, as it supports passing a cache key resolver
// eslint-disable-next-line lodash-fp/use-fp
import { memoize } from "lodash";
import f from "lodash/fp";

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
//
// type alias ExpandTreeCmd =
//   { id: RowId,
//   , level: Int
//   }

// {rows, displayValues} => List BuildTreeNode
export const tableToTreeNodes = ({ rows, displayValues }) => {};

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
