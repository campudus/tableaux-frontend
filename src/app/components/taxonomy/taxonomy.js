import * as t from "../../helpers/transduce";
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
export const getPathToNode = nodes => node => {
  const nodeRecord = f.keyBy("id", nodes);

  const go = (curNode, path) => {
    const parent = curNode && curNode.parent && nodeRecord[curNode.parent];
    if (parent) path.unshift(parent);
    return parent ? go(parent, path) : path;
  };
  return go(node, []);
};

// (String -> Boolean) -> Tree -> List {displayValue: MultilangValue, id: number}
export const findInTree = (searchFn, tree) => {};

// isLeaf : TreeNode -> Boolean
export const isLeaf = node => node && f.isEmpty(node.children);
