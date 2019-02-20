import { noPermissionAlertWithLanguage } from "../components/overlay/ConfirmationOverlay.jsx";
import {
  confirmDeleteRow,
  openShowDependency
} from "../components/overlay/ConfirmDependentOverlay.jsx";
import { getUserLanguageAccess, isUserAdmin } from "./accessManagementHelper";
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

export function initiateDuplicateRow(row, langtag) {
  if (isUserAdmin()) {
    // ActionCreator.duplicateRow(row.tableId, row.id);
  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }
}

export function initiateRowDependency(row, langtag) {
  openShowDependency(row, langtag);
}

export function initiateEntityView({ row, langtag, columnId, rows, table }) {
  openEntityView({ row, langtag, columnId, rows, table });
}
