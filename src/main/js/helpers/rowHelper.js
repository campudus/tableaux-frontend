import { noPermissionAlertWithLanguage } from '../components/overlay/ConfirmationOverlay.jsx';
import { confirmDeleteRow,openShowDependency } from '../components/overlay/ConfirmDependentOverlay.jsx';
import { getUserLanguageAccess, canUserChangeCell, reduceValuesToAllowedLanguages, isUserAdmin } from './accessManagementHelper';
import {removeRow, closeOverlay} from '../actions/ActionCreator';

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





