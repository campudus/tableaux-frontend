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
  const childrenToRender = node.expanded || node.onPath ? node.children : null;
  const childCount = `(${node.children.length})`;
  const cssClass = buildClassName("tree-node", {
    "on-path": node.onPath,
    expanded: node.expanded
  });
  return (
    <li className={cssClass}>
      <ItemButton langtag={langtag} node={node} onClick={onToggleExpand}>
        <span className="tree-node__child-count">{childCount}</span>
      </ItemButton>
      {childrenToRender ? (
        <ul className="subtree">
          {childrenToRender.map(child => (
            <TreeItem key={child.id} {...props} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const Leaf = props => {
  const { onSelectLeaf, node, langtag } = props;
  return (
    <li className="tree-node__leaf">
      <ItemButton
        className="tree-node__item-button--leaf"
        onClick={onSelectLeaf}
        langtag={langtag}
        node={node}
      ></ItemButton>
    </li>
  );
};

const TreeItem = props =>
  isLeaf(props.node) ? <Leaf {...props} /> : <Node {...props} />;

const TreeView = ({ langtag, nodes, onSelectLeaf }) => {
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const tree = buildTree({ expandedNodeId })(nodes);
  const handleToggleExpand = node => {
    console.log({ node, expandedNodeId });
    setExpandedNodeId(expandedNodeId === node.id ? node.parent : node.id);
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
          />
        ))}
      </ul>
    </section>
  );
};
TreeView.displayName = "TreeView";

export default TreeView;
