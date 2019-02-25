import {
  confirmDeleteRow,
  openShowDependency
} from "../components/overlay/ConfirmDependentOverlay.jsx";
import { duplicateRow } from "../components/table/tableRowsWorker";
import { getUserLanguageAccess, isUserAdmin } from "./accessManagementHelper";
import { noPermissionAlertWithLanguage } from "../components/overlay/ConfirmationOverlay.jsx";
import { openEntityView } from "../components/overlay/EntityViewOverlay";

// ({ table, row, langtag}) -> (string) -> void
export function initiateDeleteRow(rowSpecs, overlayToCloseId) {
  console.log("initiateDeleteRow", rowSpecs, isUserAdmin());
  if (isUserAdmin()) {
    confirmDeleteRow(rowSpecs, overlayToCloseId);
  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }
}

// ({ tableId, rowId, langtag }) -> void
export function initiateDuplicateRow(payload) {
  if (isUserAdmin()) {
    duplicateRow(payload);
  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }
}

export function initiateRowDependency({ row, table, langtag }) {
  openShowDependency({ row, table, langtag });
}

export function initiateEntityView({ row, langtag, columnId, rows, table }) {
  openEntityView({ row, langtag, columnId, rows, table });
}
