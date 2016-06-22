import apiUrl from './apiUrl';
import request from 'superagent';
import { noPermissionAlertWithLanguage,confirmDelete } from '../components/overlay/ConfirmationOverlay.jsx';
import { getUserLanguageAccess, canUserChangeCell, reduceValuesToAllowedLanguages, isUserAdmin } from './accessManagementHelper';
import ActionCreator from '../actions/ActionCreator';


export function initiateDeleteRow(row, onYes, onCancel) {
  console.log("inside helper initiateDeleteRow");

  if (isUserAdmin()) {

    confirmDelete(
      //onYes
      ()=> {
        typeof onYes == 'function' ? onYes() : null;
        ActionCreator.removeRow(row.tableId, row.id);
        ActionCreator.closeOverlay();
      },
      //onCancel
      () => {
        typeof onCancel == 'function' ? onCancel() : null;
        ActionCreator.closeOverlay();
      });

  } else {
    noPermissionAlertWithLanguage(getUserLanguageAccess());
  }

}

