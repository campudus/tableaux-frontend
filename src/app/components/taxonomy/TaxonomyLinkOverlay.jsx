import i18n from "i18next";
import f from "lodash/fp";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { intersperse } from "../../helpers/functools";
import TaxonomySearch from "./TaxonomySearch";

const EXPANDED_NODE_KEY = "expandedNode";

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

export const LinkedItem = ({
  node,
  langtag,
  ActionButton,
  path,
  onFocusNode
}) => {
  const PathSeparator = (
    <span className="linked-item__path-separator">&gt;</span>
  );

  return (
    <li className="linked-item">
      <ActionButton node={node} />
      <div className="linked-item__content">
        <div className="linked-item__path">
          {intersperse(
            PathSeparator,
            f.map(n => {
              const title = retrieveTranslation(langtag, n.displayValue);
              return (
                <span
                  key={n.id}
                  className="linked-item__path-step"
                  title={title}
                  onClick={() => onFocusNode(n)}
                >
                  {title}
                </span>
              );
            }, path)
          )}
        </div>
        <span className="linked-item__content-title">
          {retrieveTranslation(langtag, node.displayValue)}
        </span>
      </div>
    </li>
  );
};

const CardinalityInfo = ({ nLinked, limit }) => {
  const parts = i18n.t("table:link-overlay-count").split("|");
  return (
    <p className="cardinality-count">
      {!limit ? null : (
        <>
          <span className="text">{parts[0]}</span>
          <span className="number">{nLinked}</span>
          <span className="text">{parts[1]}</span>
          <span className="number">{limit}</span>
          <span className="text">{parts[2]}</span>
        </>
      )}
    </p>
  );
};

const TaxonomyLinkOverlayBody = ({
  actions,
  cell,
  langtag,
  nodes,
  sharedData
}) => {
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
  const [focusFX, setFocusFX] = useState(undefined);
  useEffect(() => {
    const nodeToExpand = f.prop(EXPANDED_NODE_KEY, sharedData);
    if (nodeToExpand) {
      setFocusFX(nodeToExpand);
    }
  }, [
    !!f.prop(EXPANDED_NODE_KEY, sharedData),
    f.prop([EXPANDED_NODE_KEY, "id"], sharedData)
  ]);
  const shouldShowAction = ({ node, expandedNodeId }) =>
    t.isLeaf(node) &&
    (f.every(f.isNil, [node.parent, expandedNodeId]) ||
      node.parent === expandedNodeId);

  const linkTargetTableId = f.prop("column.toTable", cell);
  const linkTargetTable = useSelector(
    f.prop(["tables", "data", linkTargetTableId])
  );

  const headline = i18n.t("table:link-overlay-items-title", {
    name: getTableDisplayName(linkTargetTable, langtag)
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

  const handleFocusFX = useCallback(node => {
    setFocusFX({ ...node, focused: new Date() });
  }, []);

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
                  path={t.getPathToNode(nodes)(node)}
                  onFocusNode={handleFocusFX}
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
          focusNode={focusFX}
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
const storeToState = path => f.compose(toState, f.prop(path));

const selectLiveCell = ({ tableId, columnId, rowId }) => store => {
  const [rowIdx, colIdx] = idsToIndices({ tableId, columnId, rowId }, store);
  const row = f.prop(["rows", tableId, "data", rowIdx], store);
  return {
    ...f.prop(["cells", colIdx], row),
    value: f.propOr([], ["values", colIdx], row)
  };
};

const DataLoader = Component => props => {
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
    <Component
      {...props}
      nodes={t.tableToTreeNodes({ rows: componentState.data })}
      cell={liveCell}
    />
  ) : (
    <div>Just. No.</div>
  );
};

const TaxonomyLinkOverlayHeader = props => {
  const { cell, langtag, updateSharedData } = props;

  const liveCell = useSelector(
    selectLiveCell({
      columnId: cell.column.id,
      rowId: cell.row.id,
      tableId: cell.table.id
    })
  );

  const onSelectSearchResult = node =>
    updateSharedData(f.assoc(EXPANDED_NODE_KEY, node));

  const rows = useSelector(f.prop(["rows", cell.column.toTable, "data"]));
  const nodes = useMemo(() => t.tableToTreeNodes({ rows }), [rows]);

  return (
    <Header
      {...props}
      cell={liveCell}
      context={i18n.t("table:taxonomy.link-category")}
    >
      <TaxonomySearch
        langtag={langtag}
        nodes={nodes}
        onSelect={onSelectSearchResult}
        classNames="filter-bar"
      />
    </Header>
  );
};

export const openTaxonomyLinkOverlay = ({ cell, langtag, actions }) => {
  const overlayClass = buildClassName("link-overlay", { taxonomy: true });

  actions.openOverlay({
    head: (
      <TaxonomyLinkOverlayHeader langtag={langtag} cell={cell} title={cell} />
    ),
    body: <DataLoader cell={cell} langtag={langtag} />,
    type: "full-height",
    classes: overlayClass,
    title: cell
  });
};

export default {
  Header: TaxonomyLinkOverlayHeader,
  Body: DataLoader(TaxonomyLinkOverlayBody),
  DataLoader,
  LinkedItem
};
