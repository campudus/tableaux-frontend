import {noPermissionAlertWithLanguage} from '../components/overlay/ConfirmationOverlay.jsx';
import {confirmDeleteRow, openShowDependency} from '../components/overlay/ConfirmDependentOverlay.jsx';
import {getUserLanguageAccess, isUserAdmin} from './accessManagementHelper';
import {openEntityView} from '../components/overlay/EnityViewOverlay';

export function initiateDeleteRow(row, langtag) {
  console.log("inside helper initiateDeleteRow");
  if (isUserAdmin()) {
    confirmDeleteRow(row, langtag);
  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }
}

export function initiateRowDependency(row, langtag) {
  openShowDependency(row, langtag);
}

export function initiateEntityView(row, langtag) {
  openEntityView(row, langtag);
}
