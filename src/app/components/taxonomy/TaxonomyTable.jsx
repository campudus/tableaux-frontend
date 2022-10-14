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
import { openEntityView } from "../overlay/EntityViewOverlay";
import { rowValuesToCells } from "../../redux/reducers/rows";

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

const onCreateNode = ({ dispatch, table, columns }) => async ({
  tableId,
  parentNodeId
}) => {
  const transformRows = rowValuesToCells(table, columns);
  const rows = await action
    .createAndLoadRow(dispatch, tableId, {
      columns: [{ id: 4 }],
      rows: [{ values: [parentNodeId || null] }]
    })
    .then(transformRows);

  const node = f.compose(
    f.assoc("parent", parentNodeId),
    f.assoc("children", []),
    f.first,
    t.tableToTreeNodes
  )({ rows });

  console.log({ node });

  // Timing issue: we need to pass the new row to the next function, as it might
  // not yet be dispatched to the redux store
  return { node, rows };
};

const TaxonomyTable = ({ langtag, tableId }) => {
  const table = useSelector(f.prop(["tables", "data", tableId]));
  const rows = useSelector(f.propOr([], ["rows", tableId, "data"]));
  const columns = useSelector(f.propOr([], ["columns", tableId, "data"]));
  const nodes = t.tableToTreeNodes({ rows, columns });
  const dispatch = useDispatch();
  const createNewNode = onCreateNode({ dispatch, table, columns });
  const editNode = (node, currentRows = rows) => {
    // currentRows must be passed if the node is freshly created
    const row = currentRows.find(row => row.id === node.id);
    openEntityView({ langtag, row, table });
  };
  const addSiblingBelow = node => {
    createNewNode({ tableId, parentNodeId: node.parent }).then(result =>
      editNode(result.node, result.rows)
    );
  };
  const addChild = node => {
    createNewNode({ tableId, parentNodeId: node.id }).then(result =>
      editNode(result.node, result.rows)
    );
  };
  const deleteNode = node => {
    dispatch(action.deleteRow({ tableId, rowId: node.id }));
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
    [tableId]
  );

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
