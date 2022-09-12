import i18n from "i18next";
import f from "lodash/fp";
import PropTypes from "prop-types";
import React, { useState } from "react";
import DependentRowsList from "../../components/rows/DependentRowsList";
import RowConcat from "../../helpers/RowConcatHelper";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";
import Button from "../Button/Button";
import Header from "./Header";
import { openSelectLinkTargetOverlay } from "./SelectLinkTargetOverlay";

const JustDelete = rowToDeleteId => ({
  action: "delete-row/just-delete",
  rowToDeleteId
});
const MergeRows = (rowToDeleteId, mergedLinkTargetId) => ({
  action: "delete-row/merge",
  rowToDeleteId,
  mergedLinkTargetId
});
const isMergeAction = ({ action }) => action === "delete-row/merge";

const getHeadline = (deletion, count) => {
  const trnKey = f.isNil(count)
    ? "table:dependent-rows.fetching-dependent-rows"
    : count === 0
    ? "table:dependent-rows.no-dependent-rows-header"
    : "table:dependent-rows.dependent-rows-header";
  return i18n.t(trnKey, { count });
};

const DeletionInfoBox = ({ table, row, nLinks, onSubmit, langtag }) => {
  const headline = getHeadline(true, nLinks);
  const textKey = `table:dependent-rows.delete-${
    nLinks === 0 ? "no-" : ""
  }dependent-rows`;

  const handleSetMergeRowAction = mergeRowId =>
    onSubmit(MergeRows(row.id, mergeRowId));
  const handleSetJustDeleteAction = () => onSubmit(JustDelete(row.id));
  const handleSelectMergeRowId = () => {
    openSelectLinkTargetOverlay({
      row,
      table,
      langtag,
      onSubmit: handleSetMergeRowAction
    });
  };

  return (
    <>
      <div className="deletion-info__header overlay-subheader__title">
        {headline}
      </div>
      <div className="deletion-info__message overlay-subheader__description">
        {i18n.t(textKey)}
      </div>
      {nLinks > 0 ? (
        <div className="deletion-info__action-select overlay-subheader__buttons overlay-subheader__buttons--left">
          <Button classNames="negative" onClick={handleSetJustDeleteAction}>
            {i18n.t("table:dependent-rows.btn-select-delete-row")}
          </Button>
          <Button onClick={handleSelectMergeRowId}>
            {i18n.t("table:dependent-rows.btn-select-merge-rows")}
          </Button>
        </div>
      ) : null}
    </>
  );
};

const DeletionFooter = ({ deletionAction, onClose, langtag, tableId }) => {
  const deleteTextKey =
    deletionAction && isMergeAction(deletionAction)
      ? "table:dependent-rows.btn-submit-merge-rows"
      : "table:dependent-rows.btn-submit-delete-row";

  const handleSubmit = () =>
    handleDeleteRow({ langtag, tableId, deletionAction });

  return (
    <footer className="button-wrapper">
      <div className="action-buttons">
        <Button
          classNames="negative"
          disabled={f.isNil(deletionAction)}
          onClick={handleSubmit}
        >
          {i18n.t(deleteTextKey)}
        </Button>
        <Button className="neutral" onClick={onClose}>
          {i18n.t("common:cancel")}
        </Button>
      </div>
    </footer>
  );
};

const handleDeleteRow = ({ tableId, langtag, deletionAction }) => {
  const rowId = deletionAction.rowToDeleteId;
  const mergeWithRowId = deletionAction.mergedLinkTargetId;
  const rows = store.getState() |> f.get(["rows", tableId, "data"]);
  const rowIdx = f.findIndex(f.propEq("id", rowId))(rows);
  const neighborRowId =
    mergeWithRowId ||
    (rows |> f.nth(rowIdx > 0 ? rowIdx - 1 : rowIdx + 1) |> f.prop("id"));

  const {
    selectedCell: {
      selectedCell: { columnId }
    }
  } = store.getState();

  store.dispatch(actions.deleteRow({ rowId, tableId, mergeWithRowId }));
  store.dispatch(actions.closeOverlay());

  store.dispatch(
    actions.toggleCellSelection({
      rowId: neighborRowId,
      tableId,
      columnId,
      langtag
    })
  );
};

const RowsOverlay = props => {
  const [deletionAction, setDeletionAction] = useState();
  const [nLinkedTables, setNLinkedTables] = useState();
  const { table, row, langtag, deleteInfo, cell } = props;
  const handleHasDependencies = setNLinkedTables;
  const handleHasNoDependencies = () => {
    setNLinkedTables(0);
    setDeletionAction(JustDelete(row.id));
  };

  return (
    <div className="delete-row-confirmation">
      <section className="overlay-subheader">
        {deleteInfo ? (
          <DeletionInfoBox
            nLinks={nLinkedTables}
            table={table}
            row={row}
            onSubmit={setDeletionAction}
            langtag={langtag}
          />
        ) : (
          <p>{getHeadline(false, nLinkedTables)}</p>
        )}
      </section>
      <DependentRowsList
        className="item"
        table={table}
        row={row}
        langtag={langtag}
        hasDependency={handleHasDependencies}
        hasNoDependency={handleHasNoDependencies}
        cell={cell}
      />
      {deleteInfo ? (
        <DeletionFooter
          langtag={langtag}
          tableId={table.id}
          deletionAction={deletionAction}
          onClose={props.actions.closeOverlay}
        />
      ) : null}
    </div>
  );
};

RowsOverlay.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object.isRequired,
  langtag: PropTypes.string.isRequired,
  deleteInfo: PropTypes.bool
};

const getRowConcat = (table, row, langtag) => {
  const idColumn = f.prop(["columns", table.id, "data", 0], store.getState());
  return <RowConcat row={row} idColumn={idColumn} langtag={langtag} />;
};

export function confirmDeleteRow({ row, table, langtag }) {
  const itemName = getRowConcat(table, row, langtag);

  store.dispatch(
    actions.openOverlay({
      head: <Header context={i18n.t("table:delete_row")} title={itemName} />,
      body: (
        <RowsOverlay
          row={row}
          table={table}
          langtag={langtag}
          deleteInfo={true}
          cell={{ row, table, langtag }}
        />
      ),
      type: "full-height"
    })
  );
}

export function openShowDependency({ table, row, langtag, cell }) {
  const itemName = getRowConcat(table, row, langtag);

  store.dispatch(
    actions.openOverlay({
      head: <Header context={i18n.t("table:dependencies")} title={itemName} />,
      body: (
        <RowsOverlay row={row} table={table} langtag={langtag} cell={cell} />
      ),
      type: "full-height"
    })
  );
}
