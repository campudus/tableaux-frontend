import React, { useState } from "react";
import { buildClassName } from "../../helpers/buildClassName";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { buildTree, isLeaf } from "./taxonomy";

const ItemButton = ({ children, className, langtag, node, onClick }) => {
  const handleClick = () => {
    onClick && onClick(node);
  };

  return (
    <div
      className={`tree-node__item-button ${className || ""}`}
      onClick={handleClick}
    >
      <span className="tree-node__name">
        {retrieveTranslation(langtag, node.displayValue)}
      </span>
      {children}
    </div>
  );
};

const Node = props => {
  const { onToggleExpand, node, langtag } = props;
  const childNodes = node.expanded || node.onPath ? node.children : null;
  const childCount = `(${node.children.length})`;
  const toggleIcon =
    node.expanded || node.onPath ? "fa fa-angle-up" : "fa fa-angle-down";

  return (
    <>
      <ItemButton langtag={langtag} node={node} onClick={onToggleExpand}>
        <span className="tree-node__child-count">{childCount}</span>
        <span className="hfill" />
        <i className={"tree-node__toggle-indicator " + toggleIcon} />
      </ItemButton>
      {childNodes ? (
        <ul className="subtree">
          {childNodes.map(child => (
            <TreeItem key={child.id} {...props} node={child} />
          ))}
        </ul>
      ) : null}
    </>
  );
};

const Leaf = props => {
  const { onSelectLeaf, node, langtag } = props;
  return <ItemButton onClick={onSelectLeaf} langtag={langtag} node={node} />;
};

const TreeItem = props => {
  const {
    node,
    NodeActionItem = () => null,
    shouldShowAction = () => false
  } = props;
  const Component = isLeaf(node) ? Leaf : Node;
  const cssClass = buildClassName("tree-node", {
    leaf: isLeaf(node),
    "on-path": node.onPath,
    expanded: node.expanded
  });
  return (
    <li className={cssClass}>
      {shouldShowAction(props) ? <NodeActionItem {...props} /> : null}
      <Component {...props} />
    </li>
  );
};

const TreeView = ({
  langtag, // String
  nodes, // List TreeNode
  onSelectLeaf, // TreeNode -> Effect
  NodeActionItem, // { node : TreeNode, langtag : String } -> React.Element
  shouldShowAction // { node : TreeNode, expandedNodeId : RowId } -> Boolean
}) => {
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const tree = buildTree({ expandedNodeId })(nodes);
  const handleToggleExpand = node => {
    const shouldContract = node.expanded || node.onPath;
    setExpandedNodeId(shouldContract ? node.parent : node.id);
  };

  return (
    <section className="tree-view">
      <ul className="tree">
        {tree.map(node => (
          <TreeItem
            key={node.id}
            langtag={langtag}
            node={node}
            onSelectLeaf={onSelectLeaf}
            onToggleExpand={handleToggleExpand}
            expandedNodeId={expandedNodeId}
            NodeActionItem={NodeActionItem}
            shouldShowAction={shouldShowAction}
          />
        ))}
      </ul>
    </section>
  );
};
TreeView.displayName = "TreeView";

export default TreeView;
