import { noPermissionAlertWithLanguage } from '../components/overlay/ConfirmationOverlay.jsx';
import { confirmDeleteRow } from '../components/overlay/ConfirmDependentOverlay.jsx';
import { getUserLanguageAccess, canUserChangeCell, reduceValuesToAllowedLanguages, isUserAdmin } from './accessManagementHelper';
import {removeRow, closeOverlay} from '../actions/ActionCreator';

export function initiateDeleteRow(row, langtag, onYes, onCancel) {
  console.log("inside helper initiateDeleteRow");

  if (isUserAdmin()) {

    confirmDeleteRow(
      row,
      langtag,
      //onYes
      ()=> {
        typeof onYes == 'function' ? onYes() : null;
        removeRow(row.tableId, row.id);
        closeOverlay();
      },
      //onCancel
      () => {
        typeof onCancel == 'function' ? onCancel() : null;
        closeOverlay();
      });

  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }

}





