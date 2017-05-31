import React from "react";
import {openOverlay} from "../../actions/ActionCreator";
import EntityViewHeader from "./EntityView/EntityViewHeader";
import EntityViewBody from "./EntityView/EntityViewBody";
import {LoadingEntityViewBodyWrapper, LoadingEntityViewHeaderWrapper} from "./EntityView/LoadingEntityView";

export function openEntityView(row, langtag, focusElementId, rows, filterColumn) {
  openOverlay({
    head: <EntityViewHeader row={row} rows={rows} langtag={langtag} canSwitchRows={true} />,
    body: <EntityViewBody row={row} langtag={langtag} focusElementId={focusElementId} filterColumn={filterColumn} />,
    type: "full-height",
    preferRight: true
  });
}

// target: {(tables: Tables, tableId: int > 0, | table: Table) rowId: int > 0}
export function loadAndOpenEntityView(target, langtag) {
  const temporaryFakeId = 0; // replaced by GenericOverlay.render() <- Tableaux.renderActiveOverlays()
  openOverlay({
    head: <LoadingEntityViewHeaderWrapper langtag={langtag} id={temporaryFakeId} />,
    body: <LoadingEntityViewBodyWrapper langtag={langtag} toLoad={target} id={temporaryFakeId} />,
    type: "full-height",
    preferRight: true
  });
}
