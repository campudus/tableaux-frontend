import React from 'react';
import {translate} from 'react-i18next';
import ActionCreator from './../../actions/ActionCreator';
import ConfirmationOverlay from '../overlay/ConfirmationOverlay';

//Distance between clicked coordinate and the left upper corner of the context menu
const CLICK_OFFSET = 3;

let RowContextMenu = (props) => {
  const {x,y,t,rowId,tableId,offsetY} = props;
  console.log("RowContextMenu:", props);

  const cssStyle = {
    left : x + CLICK_OFFSET,
    top : y - offsetY + CLICK_OFFSET
  };

  const closeRowContextMenu = () => {
    ActionCreator.closeRowContextMenu();
  };

  const onYesOverlay = (event) => {
    //TODO: Table gets rendered 3 times
    ActionCreator.removeRow(tableId, rowId);
    onCancelOverlay(event);
    closeRowContextMenu();
  };

  const onCancelOverlay = (event) => {
    ActionCreator.closeOverlay();
  };

  const deleteRow = (event) => {

    //ActionCreator.disableShouldCellFocus();
    var question = <p>Do you really want to delete that row?</p>;
    var confirmationOverlay = <ConfirmationOverlay content={question} onYes={onYesOverlay}
                                                   onCancel={onCancelOverlay}/>;
    ActionCreator.openOverlay({
      head : <span>Delete?</span>,
      body : confirmationOverlay,
      type : "flexible"
    });
  };

  const showTranslations = (event) => {
    ActionCreator.toggleRowExpand(rowId);
    closeRowContextMenu();
  };

  const duplicateRow = (event) => {
    console.log("duplicate the row!");
  };

  return (
    <div className="context-menu row-context-menu" style={cssStyle}>
      <a href="#" onClick={duplicateRow}>Zeile duplizieren</a>
      <a href="#" onClick={showTranslations}>Übersetzungen zeigen</a>
      <a href="#" onClick={deleteRow}>Zeile löschen</a>
    </div>
  );
};

RowContextMenu.propTypes = {
  x : React.PropTypes.number.isRequired,
  y : React.PropTypes.number.isRequired,
  rowId : React.PropTypes.number.isRequired,
  tableId : React.PropTypes.number.isRequired,
  offsetY : React.PropTypes.number.isRequired
};

export default translate(['table'])(RowContextMenu);