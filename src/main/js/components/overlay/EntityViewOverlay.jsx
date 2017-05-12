import React from "react";
import {openOverlay} from "../../actions/ActionCreator";
import Header from "./Header";
import {getDisplayLabel, getTableName} from "./EntityView/EntityViewHeader";

import EntityViewBody from "./EntityView/EntityViewBody";
import {LoadingEntityViewBodyWrapper, LoadingEntityViewHeaderWrapper} from "./EntityView/LoadingEntityView";
import mkHeaderComponents from "./EntityView/EntityViewHeader";

export function openEntityView(row, langtag, focusElementId) {
  const rowDisplayLabel = getDisplayLabel(row, langtag);
  const tableName = getTableName(row, langtag);
  const overlayId = new Date().getTime();
  openOverlay({
    head: <Header context={tableName} title={rowDisplayLabel}
                  components={mkHeaderComponents(overlayId, row, langtag)}
    />,
    body: <EntityViewBody row={row} langtag={langtag} focusElementId={focusElementId} overlayId={overlayId} />,
    type: "full-height",
    preferRight: true
  });
}

// target: {(tables: Tables, tableId: int > 0, | table: Table) rowId: int > 0}
export function loadAndOpenEntityView(target, langtag) {
  const overlayId = new Date().getTime();
  openOverlay({
    head: <LoadingEntityViewHeaderWrapper overlayId={overlayId} langtag={langtag} />,
    body: <LoadingEntityViewBodyWrapper overlayId={overlayId} langtag={langtag} toLoad={target} />,
    type: "full-height",
    preferRight: true
  })
}
