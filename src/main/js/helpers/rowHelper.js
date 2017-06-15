import {noPermissionAlertWithLanguage} from "../components/overlay/ConfirmationOverlay.jsx";
import {confirmDeleteRow, openShowDependency} from "../components/overlay/ConfirmDependentOverlay.jsx";
import {getUserLanguageAccess, isUserAdmin} from "./accessManagementHelper";
import {openEntityView} from "../components/overlay/EntityViewOverlay";
import ActionCreator from "../actions/ActionCreator";

export function initiateDeleteRow(row, langtag) {
  if (isUserAdmin()) {
    confirmDeleteRow(row, langtag);
  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }
}

export function initiateDuplicateRow(row, langtag) {
  if (isUserAdmin()) {
    ActionCreator.duplicateRow(row.tableId, row.id);
  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }
}

export function initiateRowDependency(row, langtag) {
  openShowDependency(row, langtag);
}

export function initiateEntityView(row, langtag, cellId, rows) {
  openEntityView(row, langtag, cellId, rows);
}
