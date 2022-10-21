import f from "lodash/fp";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import * as t from "./taxonomy";
import TLO from "./TaxonomyLinkOverlay";
import TreeView from "./TreeView";
import Header from "../overlay/Header";
import { buildClassName } from "../../helpers/buildClassName";
import i18n from "i18next";
import TaxonomySearch from "./TaxonomySearch";
import { forkJoin } from "../../helpers/functools";
import getDisplayValue from "../../helpers/getDisplayValue";
import { retrieveTranslation } from "../../helpers/multiLanguage";

const NODES_KEY = "nodes";
const FOCUSED_NODE_KEY = "focused_node";
const ButtonMode = {
  add: "add",
  delete: "delete"
};

const SelectLinkTargetOverlayHeader = props => {
  const { langtag, sharedData, updateSharedData } = props;
  const nodes = f.propOr([], NODES_KEY, sharedData);

  const onSelectSearchResult = useCallback(node => {
    updateSharedData(f.assoc(FOCUSED_NODE_KEY, node));
  });

  return (
    <Header {...props}>
      <TaxonomySearch
        langtag={langtag}
        nodes={nodes}
        onSelect={onSelectSearchResult}
        classNames="filter-bar"
      />
    </Header>
  );
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
  tableId,
  updateSharedData,
  sharedData,
  oldRowId,
  onSubmit,
  langtag,
  initialTargetRowId
}) => {
  const [focusedNode, focusNodeFX] = useState({ id: oldRowId });
  const rows = useSelector(f.prop(["rows", tableId, "data"]));
  const nodes = useMemo(() => t.tableToTreeNodes({ rows }), [rows]);
  const [selectedRowId, setSelectedRowId] = useState(initialTargetRowId);
  const handleSelectNode = node => () => {
    setSelectedRowId(node.id);
    onSubmit(node.id);
  };

  const recordDisplayValue = f.compose(
    retrieveTranslation(langtag),
    forkJoin(
      getDisplayValue,
      f.prop(["cells", 0, "column"]),
      f.prop(["values", 0])
    ),
    f.find(f.propEq("id", oldRowId))
  )(rows);

  useEffect(() => {
    const nodeToFocus = f.get(FOCUSED_NODE_KEY, sharedData);
    if (nodeToFocus) focusNodeFX(nodeToFocus);
  }, [
    f.prop(FOCUSED_NODE_KEY, sharedData),
    f.prop([FOCUSED_NODE_KEY, "id"], sharedData)
  ]);
  useEffect(() => {
    updateSharedData(f.assoc(NODES_KEY, nodes));
  }, [nodes]);

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
        <div className="overlay-subheader__title">
          {i18n.t("table:select-link-target.title", {
            linkTitle: recordDisplayValue
          })}
        </div>
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
