import React from 'react';
import {translate} from 'react-i18next';
import {openOverlay, closeOverlay} from '../../actions/ActionCreator';
import i18n from 'i18next';

let ConfirmationOverlay = (props) => {
  const {onYes, onOk, onCancel, content} = props;
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
      <button autoFocus={false} onClick={onYesOrOk}
              className="button yes">{onOk ? 'Ok' : i18n.t('common:yes')}</button>
      {cancelButton}
    </div>
  )
};

ConfirmationOverlay.propTypes = {
  onYes : React.PropTypes.func,
  onOk : React.PropTypes.func,
  onCancel : React.PropTypes.func,
  content : React.PropTypes.element.isRequired
};

export function confirmDelete(onYes, onNo) {
  const question = <p>{i18n.t('table:confirm_delete_row')}</p>;
  const confirmationOverlay = <ConfirmationOverlay content={question} onYes={onYes}
                                                   onCancel={onNo}/>;
  openOverlay({
    head : <span>{i18n.t('table:delete_row')}</span>,
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

  const allowedLangtagsMarkup = allowedLangtags.map((langtag, idx)=> <span key={idx}>{langtag}</span>);

  totalError =
    <div><p>{userError}</p><p><strong className="allowed-languages">{allowedLangtagsMarkup}</strong></p></div>;
  confirmationOverlay = <ConfirmationOverlay content={totalError} onOk={onOk}/>;

  openOverlay({
    head : <span>{i18n.t('common:access_management.permission_denied_headline')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });
}