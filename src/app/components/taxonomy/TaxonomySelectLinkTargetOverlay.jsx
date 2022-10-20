import f from "lodash/fp";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import * as t from "./taxonomy";
import TLO from "./TaxonomyLinkOverlay";
import TreeView from "./TreeView";
import Header from "../overlay/Header";
import { buildClassName } from "../../helpers/buildClassName";
import i18n from "i18next";

const FOCUSED_NODE_KEY = "focused_node";
const ButtonMode = {
  add: "add",
  delete: "delete"
};

const SelectLinkTargetOverlayHeader = props => {
  const { cell, langtag, sharedData, updateSharedData } = props;
  return <Header {...props} />;
};

const mkActionButton = ({ onSubmit, selectedRowId, buttonMode, oldRowId }) => ({
  node
}) => {
  const isAddButton = buttonMode === ButtonMode.add;
  const disabled =
    isAddButton && (node.id === selectedRowId || node.id === oldRowId);
  const buttonClass = buildClassName("set-link-button", { disabled });
  const iconClass = `fa fa-${buttonMode === ButtonMode.add ? "plus" : "minus"}`;
  const handleClick = onSubmit(isAddButton ? node : { id: null });

  return (
    <button className={buttonClass} onClick={handleClick} disabled={disabled}>
      <i className={iconClass} />
    </button>
  );
};

const SelectLinkTargetOverlayBody = ({
  actions,
  tableId,
  updateSharedData,
  sharedData,
  oldRowId,
  onSubmit,
  langtag,
  initialTargetRowId
}) => {
  const [focusedNode, focusNodeFX] = useState(undefined);
  const rows = useSelector(f.prop(["rows", tableId, "data"]));
  const nodes = useMemo(() => t.tableToTreeNodes({ rows }), [rows]);
  const [selectedRowId, setSelectedRowId] = useState(initialTargetRowId);
  const handleSelectNode = node => () => {
    setSelectedRowId(node.id);
    onSubmit(node.id);
  };

  useEffect(() => {
    const nodeToFocus = f.get(FOCUSED_NODE_KEY, sharedData);
    if (focusedNode) focusNodeFX(nodeToFocus);
  }, [
    f.prop(FOCUSED_NODE_KEY, sharedData),
    f.prop([FOCUSED_NODE_KEY, "id"], sharedData)
  ]);

  const shouldShowAction = useCallback(
    ({ node, expandedNodeId }) =>
      t.isLeaf(node) &&
      (f.every(f.isNil, [node.parent, expandedNodeId]) ||
        node.parent === expandedNodeId),
    []
  );

  const selectedNode = selectedRowId && nodes.find(n => n.id === selectedRowId);

  return (
    <>
      <section className="overlay-subheader">
        <div className="overlay-subheader__title"></div>
        <div className="overlay-subheader__description">
          {f.isNil(selectedRowId) ? (
            <span>{i18n.t("table:link-overlay-empty")}</span>
          ) : (
            <TLO.LinkedItem
              node={selectedNode}
              langtag={langtag}
              ActionButton={mkActionButton({
                selectedRowId,
                buttonMode: ButtonMode.delete,
                onSubmit: handleSelectNode
              })}
            />
          )}
        </div>
      </section>
      <section className="overlay-main-content">
        <TreeView
          langtag={langtag}
          nodes={nodes}
          focusNode={focusedNode}
          NodeActionItem={mkActionButton({
            selectedRowId,
            buttonMode: ButtonMode.add,
            onSubmit: handleSelectNode,
            oldRowId
          })}
          shouldShowAction={shouldShowAction}
        />
      </section>
    </>
  );
};

export default {
  Head: SelectLinkTargetOverlayHeader,
  Body: SelectLinkTargetOverlayBody
};
