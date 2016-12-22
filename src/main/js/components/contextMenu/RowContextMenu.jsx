import React from 'react';
import ReactDOM from 'react-dom';
import {translate} from 'react-i18next';
import ActionCreator from './../../actions/ActionCreator';
import {noPermissionAlertWithLanguage} from '../overlay/ConfirmationOverlay';
import {getUserLanguageAccess, isUserAdmin} from '../../helpers/accessManagementHelper';
import {initiateDeleteRow, initiateRowDependency, initiateEntityView} from '../../helpers/rowHelper';

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

  deleteRow = (event) => {
    const {row, langtag} = this.props;
    this.closeRowContextMenu();
    initiateDeleteRow(row, langtag);
  };

  showTranslations = (event) => {
    const {props:{row}, closeRowContextMenu} = this;
    ActionCreator.toggleRowExpand(row.getId());
    closeRowContextMenu();
  };

  duplicateRow = (event) => {
    const {row} = this.props;
    if (isUserAdmin()) {
      ActionCreator.duplicateRow(row.tableId, row.getId());
    } else {
      noPermissionAlertWithLanguage(getUserLanguageAccess());
    }
  };

  showDependency = (event) => {
    const {row, langtag} = this.props;
    initiateRowDependency(row, langtag);
    this.closeRowContextMenu();
  };

  showEntityView = () => {
    const {row, langtag} = this.props;
    initiateEntityView(row, langtag);
    this.closeRowContextMenu();
  };

  render = () => {
    const {duplicateRow, showTranslations, deleteRow, showDependency, showEntityView, props:{t}} = this;
    const cssStyle = {
      left : this.state.xOffset,
      top : this.state.yOffset
    };

    return (
      <div className="context-menu row-context-menu" style={cssStyle}>
        {this.props.table.type === 'settings' ? '' : <a href="#" onClick={duplicateRow}>{t('duplicate_row')}</a>}
        <a href="#" onClick={showTranslations}>{t('show_translation')}</a>
        <a href="#" onClick={showDependency}>{t('show_dependency')}</a>
        {this.props.table.type === 'settings' ? '' : <a href="#" onClick={deleteRow}>{t('delete_row')}</a>}
        {this.props.table.type === 'settings' ? '' : <a href="#" onClick={showEntityView}>{t('show_entity_view')}</a>}
      </div>
    );
  }

}

RowContextMenu.propTypes = {
  x : React.PropTypes.number.isRequired,
  y : React.PropTypes.number.isRequired,
  row : React.PropTypes.object.isRequired,
  offsetY : React.PropTypes.number.isRequired,
  langtag : React.PropTypes.string.isRequired,
  table : React.PropTypes.object.isRequired
};

export default translate(['table'])(RowContextMenu);