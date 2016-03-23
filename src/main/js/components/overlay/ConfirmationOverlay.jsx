import React from 'react';
import {translate} from 'react-i18next';

let ConfirmationOverlay = (props) => {
  const {onYes, onCancel, content, t} = props;
  return (
    <div className="ask confirmation-overlay">
      {content}
      <button autoFocus onClick={onYes} className="button yes">Yes</button>
      <button onClick={onCancel} className="button cancel">Cancel</button>
    </div>
  )
};

ConfirmationOverlay.propTypes = {
  onYes : React.PropTypes.func.isRequired,
  onCancel : React.PropTypes.func.isRequired,
  content : React.PropTypes.element.isRequired
};

export default translate(['table'])(ConfirmationOverlay);