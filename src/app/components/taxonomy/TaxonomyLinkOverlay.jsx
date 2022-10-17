import f from "lodash/fp";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import actionCreator from "../../redux/actionCreators";
import Spinner from "../header/Spinner";
import * as t from "./taxonomy";
import TreeView from "./TreeView";

const TaxonomyLinkOverlayBody = ({ cell, langtag, nodes }) => {
  return (
    <>
      <section className="taxonomy-link-overlay overlay-subheader">
        <h1 className="overlay-subheader__title">Select stuff</h1>
        <div className="overlay-subheader__description">I am content</div>
      </section>
      <section className="taxonomy-link-overlay overlay-main-content">
        <TreeView nodes={nodes} langtag={langtag} shouldShowAction={f.F} />;
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

const DataLoader = props => {
  const { cell } = props;
  const dispatch = useDispatch();
  const tableId = cell.column.toTable;

  const columnState = useSelector(storeToState(["columns", tableId]));
  const rowState = useSelector(storeToState(["rows", tableId]));

  useEffect(() => {
    if (!f.isNil(tableId)) dispatch(actionCreator.loadColumns(tableId));
  }, [tableId]);
  useEffect(() => {
    if (isDone(columnState) && !isDone(rowState))
      dispatch(actionCreator.loadAllRows(tableId));
  }, [tableId, columnState.tag]);

  const componentState = combineStates(columnState, rowState);

  return isLoading(componentState) ? (
    <Spinner />
  ) : isDone(componentState) ? (
    <TaxonomyLinkOverlayBody
      {...props}
      nodes={t.tableToTreeNodes({ rows: componentState.data })}
    />
  ) : (
    <div>Just. No.</div>
  );
};

const TaxonomyLinkOverlayHeader = ({ cell, langtag, title }) => (
  <div>Taxonomy link header</div>
);

export default {
  Header: TaxonomyLinkOverlayHeader,
  Body: DataLoader
};
