import {
  canUserCreateRow,
  canUserDeleteRow,
  getUserLanguageAccess
} from "./accessManagementHelper";
import {
  confirmDeleteRow,
  openShowDependency
} from "../components/overlay/ConfirmDependentOverlay.jsx";
import { duplicateRow } from "../components/table/tableRowsWorker";
import { noPermissionAlertWithLanguage } from "../components/overlay/ConfirmationOverlay.jsx";
import { openEntityView } from "../components/overlay/EntityViewOverlay";

// ({ table, row, langtag}) -> (string) -> void
export function initiateDeleteRow(rowSpecs, overlayToCloseId) {
  if (canUserDeleteRow(rowSpecs)) {
    confirmDeleteRow(rowSpecs, overlayToCloseId);
  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }
}

// ({ tableId, rowId, langtag }) -> void
export function initiateDuplicateRow(payload) {
  if (canUserCreateRow(payload)) {
    duplicateRow(payload);
  } else {
    noPermissionAlertWithLanguage([]); // TODO: find a way around this
  }
}

export function initiateRowDependency({ row, table, langtag }) {
  openShowDependency({ row, table, langtag });
}

export function initiateEntityView({ row, langtag, columnId, rows, table }) {
  openEntityView({ row, langtag, columnId, rows, table });
}
