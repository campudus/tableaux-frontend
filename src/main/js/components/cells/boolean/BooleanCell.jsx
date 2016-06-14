var React = require('react');
var BooleanEditCell = require('./BooleanEditCell.jsx');
var ActionCreator = require('../../../actions/ActionCreator');
var Directions = require('../../../constants/TableauxConstants').Directions;


var BooleanCell = React.createClass({

  propTypes : {
    cell : React.PropTypes.object.isRequired,
    langtag : React.PropTypes.string.isRequired,
    selected : React.PropTypes.bool.isRequired,
    setCellKeyboardShortcuts : React.PropTypes.func
  },

  handleEditDone : function (newValue) {
    var cell = this.props.cell;
    var valueToSave;

    if (cell.isMultiLanguage) {
      valueToSave = {};
      valueToSave[this.props.langtag] = newValue;
    } else {
      valueToSave = newValue;
    }

    ActionCreator.changeCell(cell, valueToSave);
  },

  getCheckboxValue : function () {
    var cell = this.props.cell;
    var booleanValue;

    if (cell.isMultiLanguage) {
      booleanValue = cell.value[this.props.langtag];
    } else {
      booleanValue = cell.value;
    }

    return !!booleanValue;
  },

  /**
   * Toggle value only when selected, changes it visually and saves it to database
   */
  toggleCheckboxValue : function () {
    var newVal = !this.getCheckboxValue();
    this.handleEditDone(newVal);
  },

  render : function () {

    var booleanCellNode;
    //We split this simple boolean into two components to get the keydown listener just once when selected!
    if (!this.props.selected) {
      booleanCellNode =
        <input className="checkbox" type="checkbox" readOnly="readonly" checked={this.getCheckboxValue()}/>;
    } else {
      booleanCellNode = <BooleanEditCell checked={this.getCheckboxValue()}
                                         langtag={this.props.langtag}
                                         onSave={this.toggleCheckboxValue}
                                         setCellKeyboardShortcuts={this.props.setCellKeyboardShortcuts}/>;
    }

    return (
      <div className={'cell-content'}>
        {booleanCellNode}
      </div>
    );

  }
});

module.exports = BooleanCell;
