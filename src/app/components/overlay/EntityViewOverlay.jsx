import React from "react";
import EntityViewHeader from "./EntityView/EntityViewHeader";
import EntityViewBody from "./EntityView/EntityViewBody";
import {
  LoadingEntityViewBodyWrapper,
  LoadingEntityViewHeaderWrapper
} from "./EntityView/LoadingEntityView";
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
  store.dispatch(
    ReduxActions.openOverlay({
      head: (
        <EntityViewHeader
          rows={rows}
          langtag={langtag}
          canSwitchRows={true}
          hasMeaningfulLinks={!filterColumn}
          idColumn={idColumn}
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
      title: {
        row,
        column: idColumn,
        table
      },
      preferRight: true
    })
  );
}

// target: {(tables: Tables, tableId: int > 0, | table: Table) rowId: int > 0}
export function loadAndOpenEntityView(target, langtag) {
  const temporaryFakeId = 0; // replaced by GenericOverlay.render() <- Tableaux.renderActiveOverlays()
  // openOverlay({
  //   head: <LoadingEntityViewHeaderWrapper langtag={langtag} id={temporaryFakeId} />,
  //   body: <LoadingEntityViewBodyWrapper langtag={langtag} toLoad={target} id={temporaryFakeId} />,
  //   type: "full-height",
  //   preferRight: true
  // });
}
