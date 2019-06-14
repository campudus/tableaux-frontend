import React from "react";
import EntityViewHeader from "./EntityView/EntityViewHeader";
import EntityViewBody from "./EntityView/EntityViewBody";
import {
  ForeignEntityViewBody,
  ForeignEntityViewHeader
} from "./EntityView/ForeignEntityView";
import store from "../../redux/store";
import ReduxActions from "../../redux/actionCreators";
import f from "lodash/fp";

export function openEntityView({
  columnId, // of the column/cell to scroll to
  filterColumn, // group column if used to edit groups
  langtag,
  row,
  rows, // non-nil will allow to navigate rows
  table
}) {
  const state = store.getState();
  const columns = f.prop(["columns", table.id, "data"], state);
  const idColumn = f.first(columns);
  const titleSpec = { row, column: idColumn, table };
  store.dispatch(
    ReduxActions.openOverlay({
      head: (
        <EntityViewHeader
          rows={rows}
          langtag={langtag}
          canSwitchRows={true}
          hasMeaningfulLinks={!filterColumn}
          idColumn={idColumn}
          cell={titleSpec}
        />
      ),
      body: (
        <EntityViewBody
          langtag={langtag}
          focusElementId={columnId}
          filterColumn={filterColumn}
        />
      ),
      type: "full-height",
      table,
      row,
      columns,
      title: titleSpec,
      preferRight: true
    })
  );
}

export const loadAndOpenEntityView = ({ tableId, rowId, langtag }) =>
  store.dispatch(
    ReduxActions.openOverlay({
      head: <ForeignEntityViewHeader loading={true} />,
      body: <ForeignEntityViewBody tableId={tableId} rowId={rowId} />,
      langtag,
      type: "full-height",
      preferRight: true,
      loading: true
    })
  );
