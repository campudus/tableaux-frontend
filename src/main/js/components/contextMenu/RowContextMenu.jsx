import React from 'react';
import ReactDOM from 'react-dom';
import {translate} from 'react-i18next';
import ActionCreator from './../../actions/ActionCreator';
import {confirmDelete,noPermissionAlertWithLanguage} from '../overlay/ConfirmationOverlay';
import {getUserLanguageAccess, isUserAdmin} from '../../helpers/accessManagementHelper';

//Distance between clicked coordinate and the left upper corner of the context menu
const CLICK_OFFSET = 3;

class RowContextMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      yOffset : this.getCursorPositionY(),
      xOffset : this.getCursorPositionX()
    };
  }

  componentDidMount = () => {
    const DOMNode = ReactDOM.findDOMNode(this);
    const bottomYPosition = DOMNode.getBoundingClientRect().bottom;
    const rightXPosition = DOMNode.getBoundingClientRect().right;
    const viewportHeight = document.documentElement.clientHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const {yOffset, xOffset} = this.state;
    let newYOffset, newXOffset;

    if (bottomYPosition > viewportHeight) {
      const heightOfContextMenu = DOMNode.offsetHeight;
      newYOffset = this.getCursorPositionY() - heightOfContextMenu - CLICK_OFFSET;
    }

    if (rightXPosition > viewportWidth) {
      const widthOfContextMenu = DOMNode.offsetWidth;
      newXOffset = this.getCursorPositionX() - widthOfContextMenu - CLICK_OFFSET;
    }

    if (newYOffset || newXOffset) {
      this.setState({
        yOffset : newYOffset || yOffset,
        xOffset : newXOffset || xOffset
      });
    }

  };

  //we add a little offset, so the first list element is not selected
  getCursorPositionY = () => {
    const {y, offsetY} = this.props;
    return y - offsetY + CLICK_OFFSET;
  };

  getCursorPositionX = () => {
    const {x} = this.props;
    return x + CLICK_OFFSET;
  };

  closeRowContextMenu = () => {
    ActionCreator.closeRowContextMenu();
  };

  onYesOverlay = (event) => {
    //TODO: Table gets rendered 3 times
    const {tableId, rowId} = this.props;
    ActionCreator.removeRow(tableId, rowId);
    this.onCancelOverlay(event);
    this.closeRowContextMenu();
  };

  onCancelOverlay = (event) => {
    ActionCreator.closeOverlay();
  };

  deleteRow = (event) => {
    if (isUserAdmin()) {
      confirmDelete(this.onYesOverlay, this.onCancelOverlay);
    } else {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
    }
  };

  showTranslations = (event) => {
    const {props:{rowId}, closeRowContextMenu} = this;
    ActionCreator.toggleRowExpand(rowId);
    closeRowContextMenu();
  };

  duplicateRow = (event) => {
    const {tableId, rowId} = this.props;
    if (isUserAdmin()) {
      ActionCreator.duplicateRow(tableId, rowId);
    } else {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
    }
  };

  render = () => {
    const {duplicateRow, showTranslations, deleteRow, props:{t}} = this;
    const cssStyle = {
      left : this.state.xOffset,
      top : this.state.yOffset
    };

    return (
      <div className="context-menu row-context-menu" style={cssStyle}>
        <a href="#" onClick={duplicateRow}>{t('duplicate_row')}</a>
        <a href="#" onClick={showTranslations}>{t('show_translation')}</a>
        <a href="#" onClick={deleteRow}>{t('delete_row')}</a>
      </div>
    );
  }

}

RowContextMenu.propTypes = {
  x : React.PropTypes.number.isRequired,
  y : React.PropTypes.number.isRequired,
  rowId : React.PropTypes.number.isRequired,
  tableId : React.PropTypes.number.isRequired,
  offsetY : React.PropTypes.number.isRequired
};

export default translate(['table'])(RowContextMenu);