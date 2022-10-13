import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import * as t from "./taxonomy";
import TreeView from "./TreeView";
import SvgIcon from "../helperComponents/SvgIcon";
import { buildClassName } from "../../helpers/buildClassName";

const shouldShowAction = ({ node, expandedNodeId }) =>
  (!node.parent && !expandedNodeId) || node.parent === expandedNodeId;

// EditorEntryDescription :
//   { icon: String | React.Element
//   , titleKey: String
//   , onClick: { node: TreeNode } => ()
//   , isVisible: { node: TreeNode } => Boolean
//   }

// EditorEntry : { entry: EditorEntryDescription, node: TreeNode } -> React.Element
const EditorEntry = ({ entry, node }) => (
  <li
    className="tree-node__menu-popup__item"
    onClick={() => entry.onClick(node)}
  >
    <span className="item__icon">
      {typeof entry.icon === "string" ? (
        <i className={`fa ${entry.icon}`} />
      ) : (
        entry.icon || null
      )}
    </span>
    <span className="item-title">{i18n.t(entry.titleKey)}</span>
  </li>
);

// EditorEntryGroup : { entries: List EditorEntryDescription, node: TreeNode } -> React.Element
const EditorEntryGroup = ({ entries, node }) => (
  <li className="tree-node__menu-popup__item-group">
    <ul>
      {entries.map((entry, idx) => (
        <EditorEntry key={idx} entry={entry} node={node} />
      ))}
    </ul>
  </li>
);

// mkTableEditor : List (List EditorEntryDescription) -> { node: TreeNode } -> React.Element
const mkTableEditor = entryGroups => ({ node }) => {
  const groups = entryGroups
    .map(group =>
      group.filter(
        entry => !f.isFunction(entry.isVisible) || entry.isVisible(node)
      )
    )
    .filter(group => !f.isEmpty(group));

  const [isOpen, setIsOpen] = useState(false);
  const handleTogglePopup = useCallback(
    event => {
      event.stopPropagation();
      setIsOpen(!isOpen);
    },
    [isOpen]
  );
  const handleClosePopup = useCallback(() => setIsOpen(false), []);
  const containerRef = useRef(null);

  useEffect(
    outsideClickEffect({
      shouldListen: isOpen,
      onOutsideClick: handleClosePopup,
      containerRef
    }),
    [isOpen, containerRef.current]
  );

  const buttonClass = buildClassName("tree-node__menu-button", {
    open: isOpen
  });

  return (
    <button
      className={buttonClass}
      onClick={handleTogglePopup}
      ref={containerRef}
    >
      <SvgIcon
        containerClasses="tree-node__menu-button-icon"
        icon="vdots"
        center
      />
      {isOpen ? (
        <div className="tree-node__menu-popup">
          <ul className="tree--node__menu-popup__items-list">
            {groups.map((entries, idx) => (
              <EditorEntryGroup key={idx} entries={entries} node={node} />
            ))}
          </ul>
        </div>
      ) : null}
    </button>
  );
};

const TableEditor = mkTableEditor([
  [
    {
      icon: "fa-level-down flip-lr",
      titleKey: "table:taxonomy.add-sibling-below"
    },
    {
      icon: <SvgIcon icon="addSubItem" />,
      titleKey: "table:taxonomy.add-child"
    }
  ],
  [
    { icon: "fa-pencil", titleKey: "table:taxonomy.edit" },
    {
      icon: "fa-trash",
      titleKey: "table:taxonomy.delete",
      isVisible: t.isLeaf
    }
  ]
]);

const TaxonomyTable = ({ langtag, tableId }) => {
  const rows = useSelector(f.propOr([], ["rows", tableId, "data"]));
  const nodes = t.tableToTreeNodes({ rows });

  return (
    <TreeView
      nodes={nodes}
      langtag={langtag}
      shouldShowAction={shouldShowAction}
      NodeActionItem={TableEditor}
    />
  );
};

TaxonomyTable.displayName = "TaxonomyTable";

export default TaxonomyTable;
