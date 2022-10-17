import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { buildClassName } from "../../helpers/buildClassName";
import {
  getTableDisplayName,
  retrieveTranslation
} from "../../helpers/multiLanguage";
import actionCreator from "../../redux/actionCreators";
import { idsToIndices } from "../../redux/redux-helpers";
import Spinner from "../header/Spinner";
import * as t from "./taxonomy";
import TreeView from "./TreeView";
import Header from "../overlay/Header";

// NodeActionButton :
//   { onClick : (TreeNode -> ())
//   , icon : string
//   , idsToDisable : Set Int | () }
// -> { node : TreeNode } -> React.Element
const mkNodeActionButton = ({ onClick, icon, idsToDisable }) => ({ node }) => {
  const handleClick = useCallback(() => {
    f.isFunction(onClick) && onClick(node);
  }, [node.id]);

  const disabled = idsToDisable && idsToDisable.has(node.id);
  const buttonClass = buildClassName("set-link-button", { disabled });

  return (
    <button disabled={disabled} className={buttonClass} onClick={handleClick}>
      <i className={`fa ${icon}`} />
    </button>
  );
};

const LinkedItem = ({ node, langtag, ActionButton }) => (
  <li className="linked-item">
    <ActionButton node={node} />
    <div>{retrieveTranslation(langtag, node.displayValue)}</div>
  </li>
);

const CardinalityInfo = ({ nLinked, limit }) => {
  const parts = i18n.t("table:link-overlay-count").split("|");
  return (
    /*!limit ? null : */ <p className="cardinality-count">
      <span className="text">{parts[0]}</span>
      <span className="number">{nLinked}</span>
      <span className="text">{parts[1]}</span>
      <span className="number">{limit || "∞"}</span>
      <span className="text">{parts[2]}</span>
    </p>
  );
};

const TaxonomyLinkOverlayBody = ({ actions, cell, langtag, nodes }) => {
  const setNodeIsLinked = (cell, shouldLink) => node => {
    const newValue = shouldLink
      ? [...cell.value, { id: node.id, value: node.displayValue }]
      : cell.value.filter(val => val.id !== node.id);
    actions.changeCellValue({ cell, newValue, oldValue: cell.value });
  };

  const nodeLookupTable = f.keyBy("id", nodes);
  const linkedCategories = f.map(link => nodeLookupTable[link.id], cell.value);
  const linkedIds = new Set(f.map("id", cell.value));
  const onLinkNode = setNodeIsLinked(cell, true);
  const onUnlinkNode = setNodeIsLinked(cell, false);
  const shouldShowAction = ({ node, expandedNodeId }) =>
    t.isLeaf(node) &&
    (f.every(f.isNil, [node.parent, expandedNodeId]) ||
      node.parent === expandedNodeId);

  const headline = i18n.t("table:link-overlay-items-title", {
    name: getTableDisplayName(cell.table, langtag)
  });

  const cardinalityConstraint = f.prop(
    "column.constraint.cardinality.to",
    cell
  );

  const idsToDisableAdding = f.cond([
    [max => !max, () => linkedIds],
    [max => linkedCategories.length < max, () => linkedIds],
    [() => true, () => new Set(f.map("id", nodes))]
  ])(cardinalityConstraint);

  return (
    <>
      <section className="taxonomy-link-overlay overlay-subheader">
        <div className="overlay-subheader__title">{headline}</div>
        <div className="overlay-subheader__description">
          <CardinalityInfo
            nLinked={linkedCategories.length}
            limit={cardinalityConstraint}
          />
          {f.isEmpty(linkedCategories) ? (
            i18n.t("table:link-overlay-empty")
          ) : (
            <ul className="taxonomy-link-overlay__linked-items">
              {linkedCategories.map(node => (
                <LinkedItem
                  key={node.id}
                  node={node}
                  langtag={langtag}
                  ActionButton={mkNodeActionButton({
                    onClick: onUnlinkNode,
                    icon: "fa-minus"
                  })}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className="taxonomy-link-overlay overlay-main-content">
        <TreeView
          nodes={nodes}
          langtag={langtag}
          shouldShowAction={shouldShowAction}
          NodeActionItem={mkNodeActionButton({
            onClick: onLinkNode,
            icon: "fa-plus",
            idsToDisable: idsToDisableAdding
          })}
        />
      </section>
    </>
  );
};

const StateTag = {
  loading: "loading",
  error: "error",
  done: "done"
};
const State = (tag, data) => ({ tag, data });
const toState = ({ error, finishedLoading, data } = {}) =>
  error
    ? State(StateTag.error)
    : finishedLoading
    ? State(StateTag.done, data)
    : State(StateTag.loading);
const combineStates = (...states) => {
  return f.cond([
    [f.some(isError), () => State(StateTag.error)],
    [f.every(isDone), () => State(StateTag.done, f.last(states).data)],
    [() => true, () => State(StateTag.loading)]
  ])(states);
};
const isLoading = state => state.tag === StateTag.loading;
const isDone = state => state.tag === StateTag.done;
const isError = state => state.tag === StateTag.error;
const storeToState = path =>
  f.compose(
    toState,
    f.prop(path)
  );

const selectLiveCell = ({ tableId, columnId, rowId }) => store => {
  const [rowIdx, colIdx] = idsToIndices({ tableId, columnId, rowId }, store);
  const row = f.prop(["rows", tableId, "data", rowIdx], store);
  return {
    ...f.prop(["cells", colIdx], row),
    value: f.propOr([], ["values", colIdx], row)
  };
};

const DataLoader = props => {
  const { cell } = props;
  const dispatch = useDispatch();
  const toTableId = cell.column.toTable;

  const columnState = useSelector(storeToState(["columns", toTableId]));
  const rowState = useSelector(storeToState(["rows", toTableId]));
  const liveCell = useSelector(
    selectLiveCell({
      columnId: cell.column.id,
      rowId: cell.row.id,
      tableId: cell.table.id
    })
  );

  useEffect(() => {
    if (!f.isNil(toTableId)) dispatch(actionCreator.loadColumns(toTableId));
  }, [toTableId]);
  useEffect(() => {
    if (isDone(columnState) && !isDone(rowState))
      dispatch(actionCreator.loadAllRows(toTableId));
  }, [toTableId, columnState.tag]);

  const componentState = combineStates(columnState, rowState);

  return isLoading(componentState) ? (
    <Spinner />
  ) : isDone(componentState) ? (
    <TaxonomyLinkOverlayBody
      {...props}
      nodes={t.tableToTreeNodes({ rows: componentState.data })}
      cell={liveCell}
    />
  ) : (
    <div>Just. No.</div>
  );
};

const TaxonomyLinkOverlayHeader = props => {
  const { cell } = props;

  const liveCell = useSelector(
    selectLiveCell({
      columnId: cell.column.id,
      rowId: cell.row.id,
      tableId: cell.table.id
    })
  );

  return (
    <Header
      {...props}
      cell={liveCell}
      context={i18n.t("table:taxonomy.link-category")}
    />
  );
};

export default {
  Header: TaxonomyLinkOverlayHeader,
  Body: DataLoader
};
