import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  canUserCreateRow,
  canUserDeleteRow
} from "../../helpers/accessManagementHelper";
import { buildClassName } from "../../helpers/buildClassName";
import { outsideClickEffect } from "../../helpers/useOutsideClick";
import action from "../../redux/actionCreators";
import SvgIcon from "../helperComponents/SvgIcon";
import * as t from "./taxonomy";
import TreeView from "./TreeView";
import { loadAndOpenEntityView } from "../overlay/EntityViewOverlay";
import { rowValuesToCells } from "../../redux/reducers/rows";
import { confirmDeleteRow } from "../overlay/ConfirmDependentOverlay";
import { getTableDisplayName } from "../../helpers/multiLanguage";
import TaxonomySearch from "./TaxonomySearch";

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

const mustInvertPopup = event => {
  const mouseY = event.screenY;
  const height = window.innerHeight;

  return mouseY > height * 0.75;
};

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
  const [invert, setInvert] = useState(false); // open popup inverted
  const handleTogglePopup = useCallback(
    event => {
      event.stopPropagation();
      setIsOpen(!isOpen);
      if (!isOpen) setInvert(!!mustInvertPopup(event));
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

  const popupClass = buildClassName("tree-node__menu-popup", { invert });

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
        <div className={popupClass}>
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

const onCreateNode = ({
  dispatch,
  table,
  columns,
  langtag,
  onFocusNode
}) => async ({ tableId, parentNodeId }) => {
  const transformRows = rowValuesToCells(table, columns);
  const rows = await action
    .createAndLoadRow(dispatch, tableId, {
      columns: [{ id: 1 }, { id: 4 }],
      rows: [{ values: [{ [langtag]: "" }, f.compact([parentNodeId])] }]
    })
    .then(transformRows);

  const node = f.compose(
    f.assoc("parent", parentNodeId),
    f.assoc("children", []),
    f.first,
    t.tableToTreeNodes
  )({ rows });

  // Timing issue: we need to pass the new row to the next function, as it might
  // not yet be dispatched to the redux store
  if (f.isFunction(onFocusNode)) onFocusNode({ id: node.parent });
  return node;
};

const EmptyTable = ({ createFirstNode }) => (
  <section className="tree empty-taxonony-table">
    <div className="skeleton__rows">
      {Array(4)
        .fill(null)
        .map(() => (
          <>
            <div className="skeleton__button"></div>
            <div className="skeleton__row"></div>{" "}
          </>
        ))}
    </div>
    <button className="create-row-button" onClick={createFirstNode}>
      <i className="fa fa-plus"></i>
      <span className="create-row-button__text">
        {i18n.t("table:taxonomy.create-new-category")}
      </span>
    </button>
  </section>
);

const TaxonomyTable = ({ langtag, tableId }) => {
  const table = useSelector(f.prop(["tables", "data", tableId]));
  const rows = useSelector(f.propOr([], ["rows", tableId, "data"]));
  const columns = useSelector(f.propOr([], ["columns", tableId, "data"]));
  const nodes = t.tableToTreeNodes({ rows, columns });
  const dispatch = useDispatch();
  const [nodeToFocus, focusNodeOnce] = useState(undefined);
  const createNewNode = onCreateNode({
    dispatch,
    table,
    columns,
    langtag,
    onFocusNode: focusNodeOnce
  });
  const findRowById = rowId => rows.find(row => row.id === rowId);
  const editNode = node => {
    loadAndOpenEntityView({ langtag, tableId, rowId: node.id });
  };
  const addSiblingBelow = node => {
    createNewNode({ tableId, parentNodeId: node.parent }).then(editNode);
  };
  const addChild = node => {
    createNewNode({ tableId, parentNodeId: node.id }).then(editNode);
  };
  const deleteNode = node => {
    const row = findRowById(node.id);
    confirmDeleteRow({ row, table, langtag });
  };

  const TableEditor = useCallback(
    mkTableEditor([
      [
        {
          icon: "fa-level-down flip-lr",
          titleKey: "table:taxonomy.add-sibling-below",
          onClick: addSiblingBelow,
          isVisible: () => canUserCreateRow({ table })
        },
        {
          icon: <SvgIcon icon="addSubItem" />,
          titleKey: "table:taxonomy.add-child",
          isVisible: () => canUserCreateRow({ table }),
          onClick: addChild
        }
      ],
      [
        {
          icon: "fa-pencil",
          titleKey: "table:taxonomy.edit",
          onClick: editNode
        },
        {
          icon: "fa-trash",
          titleKey: "table:taxonomy.delete",
          onClick: deleteNode,
          isVisible: node => canUserDeleteRow({ table }) && t.isLeaf(node)
        }
      ]
    ]),
    [tableId, rows]
  );

  const handleFocusSearchResult = node => {
    console.log("handleFocusSearchResult", { node });
    focusNodeOnce(node);
  };

  return (
    <>
      <section className="table__subheader">
        <h1 className="table__subheader-title">
          {getTableDisplayName(table, langtag)}
        </h1>
        <div className="taxonomy-table__search">
          <TaxonomySearch
            nodes={nodes}
            langtag={langtag}
            onSelect={handleFocusSearchResult}
          />
        </div>
      </section>
      {nodes.length > 0 ? (
        <section className="taxonomy-table__tree">
          <TreeView
            nodes={nodes}
            langtag={langtag}
            shouldShowAction={shouldShowAction}
            NodeActionItem={TableEditor}
            focusNode={nodeToFocus}
          />
        </section>
      ) : (
        <EmptyTable
          createFirstNode={() =>
            addSiblingBelow({ tableId, parentNodeId: undefined })
          }
        />
      )}
    </>
  );
};

TaxonomyTable.displayName = "TaxonomyTable";

export default TaxonomyTable;
