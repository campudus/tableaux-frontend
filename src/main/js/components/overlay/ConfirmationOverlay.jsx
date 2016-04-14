import React from 'react';
import {translate} from 'react-i18next';
import {openOverlay} from '../../actions/ActionCreator';
import i18n from 'i18next';

let ConfirmationOverlay = (props) => {
  const {onYes, onCancel, content} = props;
  return (
    <div className="ask confirmation-overlay">
      {content}
      <button autoFocus onClick={onYes} className="button yes">{i18n.t('common:yes')}</button>
      <button onClick={onCancel} className="button cancel">{i18n.t('common:no')}</button>
    </div>
  )
};

ConfirmationOverlay.propTypes = {
  onYes : React.PropTypes.func.isRequired,
  onCancel : React.PropTypes.func.isRequired,
  content : React.PropTypes.element.isRequired
};

export function confirmDelete(onYes, onNo) {
  var question = <p>{i18n.t('table:confirm_delete_row')}</p>;
  var confirmationOverlay = <ConfirmationOverlay content={question} onYes={onYes}
                                                 onCancel={onNo}/>;
  openOverlay({
    head : <span>{i18n.t('table:delete_row')}</span>,
    body : confirmationOverlay,
    type : "flexible"
  });

}