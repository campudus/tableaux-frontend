import React from 'react';
import {translate} from 'react-i18next';
import {openOverlay, closeOverlay, rowDependent} from '../../actions/ActionCreator';
import i18n from 'i18next';

let ConfirmationOverlay = (props) => {
  const {onYes, onOk, onCancel, content, autoFocus} = props;
  const onYesOrOk = onOk ? onOk : onYes;
  const cancelButton = onCancel ?
    <button onClick={onCancel} className="button cancel">{i18n.t('common:no')}</button> : null;

  let preventKeyDownOnce = true;

  const onKeyDownHandler = (event) => {
    console.log("onKeyDownHandler");
    if (preventKeyDownOnce) {
      preventKeyDownOnce = !preventKeyDownOnce;
      event.preventDefault();
    }
  };

  return (
    <div className="ask confirmation-overlay">
      {content}
      <button autoFocus={autoFocus === false ? false : true} onClick={onYesOrOk}
              className="button yes">{onOk ? 'Ok' : i18n.t('common:yes')}</button>
      {cancelButton}
    </div>
  )
};

ConfirmationOverlay.propTypes = {
  onYes : React.PropTypes.func,
  onOk : React.PropTypes.func,
  onCancel : React.PropTypes.func,
  content : React.PropTypes.element.isRequired,
  autoFocus : React.PropTypes.bool
};

export function confirmDelete(onYes, onNo) {
  const question = <p>{i18n.t('table:confirm_delete_row')}</p>;
  const confirmationOverlay = <ConfirmationOverlay content={question} onYes={onYes}
                                                   onCancel={onNo}/>;


  //check dependent rows

  //rowDependent


  openOverlay({
    head : <span>{i18n.t('table:delete_row')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });

}

export function confirmDeleteFile(fileName, onYes, onNo) {
  const question = <p>{i18n.t('media:confirm_delete_file', {fileName})}</p>;
  const confirmationOverlay = <ConfirmationOverlay content={question} onYes={onYes}
                                                   onCancel={onNo} autoFocus={false}/>;
  openOverlay({
    head : <span>{i18n.t('media:delete_file_headline')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });
}

export function confirmDeleteFolder(folderName, onYes, onNo) {
  const question = <p>{i18n.t('media:confirm_delete_folder_question', {folderName})}</p>;
  const confirmationOverlay = <ConfirmationOverlay content={question} onYes={onYes}
                                                   onCancel={onNo} autoFocus={false}/>;
  openOverlay({
    head : <span>{i18n.t('media:confirm_delete_folder_headline')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });
}

export function cellModelSavingError(errorFromServer) {
  console.error('Cell model saved unsuccessfully!', errorFromServer, "error text:", errorFromServer.body);

  let totalError,
    confirmationOverlay,
    techError = "Unspecified error",
    userError = i18n.t('table:error_saving_cell'),
    onYes = ()=> {
      location.reload(true);
    };

  if (errorFromServer && errorFromServer.body) {
    techError = errorFromServer.body;
  }

  totalError = <div><p>{userError}</p><p><strong>Server error:</strong> {techError}</p></div>;
  confirmationOverlay = <ConfirmationOverlay content={totalError} onYes={onYes}/>;

  openOverlay({
    head : <span>{i18n.t('table:error_occured_hl')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });

}

export function noPermissionAlertWithLanguage(allowedLangtags) {
  let totalError,
    confirmationOverlay,
    onOk = () => {
      closeOverlay();
    },
    userError = `${i18n.t('common:access_management.no_permission_saving_language_description')}:`;

  let allowedLangtagsMarkup;

  if (allowedLangtags && allowedLangtags.length > 0) {
    allowedLangtagsMarkup = allowedLangtags.map((langtag, idx)=> <span key={idx}>{langtag}</span>);
  } else {
    allowedLangtagsMarkup = i18n.t('common:access_management.language_array_empty');
  }

  totalError =
    <div><p>{userError}</p><p><strong className="allowed-languages">{allowedLangtagsMarkup}</strong></p></div>;
  confirmationOverlay = <ConfirmationOverlay content={totalError} onOk={onOk} autoFocus={false}/>;

  openOverlay({
    head : <span>{i18n.t('common:access_management.permission_denied_headline')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });

  console.warn("Access denied. User can not edit this language.");
}


export function simpleError(errorMsg, errorHead) {
  const completeErrorMsg = <p>{errorMsg}</p>;
  const confirmationOverlay = <ConfirmationOverlay content={completeErrorMsg} onOk={()=> closeOverlay()}/>;

  openOverlay({
    head : <span>{errorHead ? errorHead : i18n.t('common:error')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });
}