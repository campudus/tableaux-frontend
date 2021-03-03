import React, { useState } from "react";
import f from "lodash/fp";
import i18n from "i18next";

import PropTypes from "prop-types";

import DependentRowsList from "../../components/rows/DependentRowsList";
import Footer from "./Footer";
import Header from "./Header";
import InfoBox from "./InfoBox";
import RowConcat, { rowConcatString } from "../../helpers/RowConcatHelper";
import actions from "../../redux/actionCreators";
import store from "../../redux/store";

const RowsOverlay = props => {
  const [depMessage, setDepMessage] = useState(
    <p>{i18n.t("table:fetching_dependent_rows")}</p>
  );

  const { table, row, langtag, deleteInfo, grudData, cell } = props;

  const hasDependencies = () =>
    setDepMessage(<p>{i18n.t("table:delete_row_dependent_text")}</p>);

  const hasNoDependencies = () =>
    setDepMessage(
      <p>{i18n.t(`table:${deleteInfo && "delete_"}no_dependent_text`)}</p>
    );

  const idColumn = f.prop(["columns", table.id, "data", 0], grudData);

  const rowDisplayLabel = rowConcatString(idColumn, row, langtag);

  return (
    <div className="delete-row-confirmation">
      {deleteInfo ? (
        <InfoBox
          className="item"
          type="warning"
          heading={i18n.t("table:confirm_delete_row", {
            rowName: rowDisplayLabel
          })}
          message={depMessage}
        />
      ) : null}
      <DependentRowsList
        className="item"
        table={table}
        row={row}
        langtag={langtag}
        hasDependency={hasDependencies}
        hasNoDependency={hasNoDependencies}
        cell={cell}
      />
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

export function confirmDeleteRow({ row, table, langtag }, overlayToCloseId) {
  const onYesRowDelete = () => {
    const { id: tableId } = table;
    const { id: rowId } = row;

    const rows = store.getState() |> f.get(["rows", tableId, "data"]);
    const rowIdx = f.findIndex(f.propEq("id", rowId))(rows);
    const neighborRowId =
      rows |> f.nth(rowIdx > 0 ? rowIdx - 1 : rowIdx + 1) |> f.prop("id");

    const {
      selectedCell: {
        selectedCell: { columnId }
      }
    } = store.getState();

    store.dispatch(actions.deleteRow({ row, table }));
    if (overlayToCloseId) {
      store.dispatch(actions.closeOverlay(overlayToCloseId));
    }
    store.dispatch(
      actions.toggleCellSelection({
        rowId: neighborRowId,
        tableId,
        columnId,
        langtag
      })
    );
  };

  const buttons = {
    negative: [i18n.t("common:delete_yes_explicit"), onYesRowDelete],
    neutral: [i18n.t("common:cancel"), null]
  };

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
      footer: <Footer buttonActions={buttons} />,
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
