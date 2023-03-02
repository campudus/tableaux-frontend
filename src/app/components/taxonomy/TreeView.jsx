import React, { useEffect, useRef, useState } from "react";
import { buildClassName } from "../../helpers/buildClassName";
import { retrieveTranslation } from "../../helpers/multiLanguage";
import { buildTree, countVisibleChildren, isLeaf } from "./taxonomy";
import { last, omit } from "lodash/fp";
import { getCssVarNumeric } from "../../helpers/getCssVar";
import Empty from "../helperComponents/emptyEntry";

const ItemButton = props => {
  const {
    children,
    className,
    langtag,
    node,
    onClick,
    shouldShowAction = () => false,
    NodeActionItem = () => null
  } = props;
  const handleClick = () => {
    onClick && onClick(node);
  };
  const hasActionButton = shouldShowAction(props);
  const cssClass = buildClassName(
    "tree-node__item-button",
    { "with-action-button": hasActionButton },
    className
  );

  return (
    <div className={cssClass} onClick={handleClick}>
      {node.parent ? (
        <>
          <div className="tree-node__border-left" />
          <div className="tree-node__border-right" />
        </>
      ) : null}
      {shouldShowAction(props) ? (
        <span className="tree-node__item-action-button">
          <NodeActionItem {...props} />
        </span>
      ) : null}
      <div className="tree-node__title">
        <span className="tree-node__name">
          {retrieveTranslation(langtag, node.displayValue) || (
            <Empty langtag={langtag} />
          )}
        </span>
        {children}
      </div>
    </div>
  );
};

const AnimateChildNodes = props => {
  const { node, show } = props;
  const duration = getCssVarNumeric("--tree-animation-duration");

  const itemHeight =
    1 +
    getCssVarNumeric("--tree-item-height") +
    getCssVarNumeric("--tree-item-margin-y");

  const mustFillTreeLine =
    node.onPath &&
    node.children.find(child => child.onPath || child.expanded) !==
      last(node.children);

  const [isInitial, setIsInitial] = useState(true);
  const [entering, setEntering] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const style = show ? { height: countVisibleChildren(node) * itemHeight } : {};

  const cssClass = buildClassName("subtree", {
    entering,
    leaving,
    show: !entering && !leaving && show,
    "fill-line": mustFillTreeLine
  });
  const animationTimer = useRef(null);
  const announceAnimationEnd = () => {
    setEntering(false);
    setLeaving(false);
  };

  useEffect(() => {
    if (isInitial) {
      setIsInitial(false);
    } else {
      setEntering(show);
      setLeaving(!show);
    }
    animationTimer.current = setTimeout(announceAnimationEnd, duration);

    return () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, [!!show]);

  return (
    <div className={cssClass} style={style}>
      <div className="subtree__border-left" />
      <div className="subtree__border-right" />
      <ul className="subtree__items">
        {show || leaving
          ? node.children.map(child => (
              <TreeItem key={child.id} {...omit("show", props)} node={child} />
            ))
          : null}
      </ul>
    </div>
  );
};

const Node = props => {
  const { onToggleExpand, node, langtag } = props;
  const showChildren = node.expanded || node.onPath;
  const childCount = `(${node.children.length})`;
  const toggleIcon =
    node.expanded || node.onPath ? "fa fa-angle-up" : "fa fa-angle-down";

  return (
    <>
      <ItemButton
        {...props}
        langtag={langtag}
        node={node}
        onClick={onToggleExpand}
      >
        <span className="tree-node__child-count">{childCount}</span>
        <span className="hfill" />
        <i className={"tree-node__toggle-indicator " + toggleIcon} />
      </ItemButton>
      <AnimateChildNodes key={undefined} {...props} show={showChildren} />
    </>
  );
};

const Leaf = props => {
  const { onSelectLeaf } = props;
  return <ItemButton {...props} onClick={onSelectLeaf} />;
};

const TreeItem = props => {
  const { node } = props;
  useEffect(() => {
    if (node.expanded && nodeRef.current) {
      setTimeout(
        () => nodeRef.current.scrollIntoView({ behavior: "smooth" }),
        getCssVarNumeric("--tree-animation-duration")
      );
    }
  }, [node.id, node.expanded]);
  const nodeRef = useRef();
  const Component = isLeaf(node) ? Leaf : Node;
  const cssClass = buildClassName("tree-node", {
    leaf: isLeaf(node),
    "on-path": node.onPath,
    expanded: node.expanded && !isLeaf(node),
    default: (!node.onPath && !node.expanded) || isLeaf(node),
    root: !node.parent
  });
  return (
    <li ref={nodeRef} className={cssClass}>
      <Component {...props} />
    </li>
  );
};

const TreeView = ({
  langtag, // String
  nodes, // List TreeNode
  onSelectLeaf, // TreeNode -> Effect
  NodeActionItem, // { node : TreeNode, langtag : String } -> React.Element
  shouldShowAction, // { node : TreeNode, expandedNodeId : RowId } -> Boolean
  focusNode // TreeNode | undefined
}) => {
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const tree = buildTree({ expandedNodeId })(nodes);
  const handleToggleExpand = node => {
    const shouldContract = node.expanded || node.onPath;
    setExpandedNodeId(shouldContract ? node.parent : node.id);
  };

  useEffect(() => {
    if (focusNode) setExpandedNodeId(focusNode.id);
  }, [focusNode && focusNode.id, focusNode && focusNode.focused]);

  return (
    <section className="tree-view">
      <ul className="tree">
        {tree.map(node => (
          <TreeItem
            show
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
