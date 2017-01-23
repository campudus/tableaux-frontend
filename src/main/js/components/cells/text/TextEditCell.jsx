var React = require('react');
var Dispatcher = require('../../../dispatcher/Dispatcher');
var TextArea = require('./TextArea.jsx');
var ExpandButton = require('./ExpandButton.jsx');
var ActionCreator = require('../../../actions/ActionCreator');
var Directions = require('../../../constants/TableauxConstants').Directions;
import listensToClickOutside from 'react-onclickoutside/decorator'

import KeyboardShortcutsHelper from '../../../helpers/KeyboardShortcutsHelper';

@listensToClickOutside
class TextEditCell extends React.Component {

  getInputName = () => {
    return this.inputName = 'cell-' + this.props.cell.tableId + '-' + this.props.cell.column.getId() + '-' + this.props.cell.rowId;
  };

  getKeyboardShortcuts = (event) => {
    var self = this;
    return {
      escape: function (event) {
        self.doneEditing(event);
        ActionCreator.toggleCellEditing(false);
      },
      tab: function (event) {
        self.doneEditing(event);
        ActionCreator.selectNextCell(Directions.RIGHT);
      },
      enter: function (event) {
        //stop handling the Table events
        event.stopPropagation();
      },
      always: function (event, shortcutFound) {
        if (!shortcutFound) {
          //When typing text we don't want any table events
          event.stopPropagation();
        }
      }
    };
  };

  handleClickOutside = (event) => {
    this.doneEditing(event);
  };

  doneEditing = (event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.props.onBlur(this.refs.input.value);
  };

  openOverlay = (event) => {
    //pass possible new text in editmode to overlay
    this.props.openOverlay(event, this.refs.input.value);
  };

  componentDidMount = () => {
    var node = this.refs.input;
    var text = node.value;
    // Sets cursor to end of input field
    node.value = ""; //textarea must be empty first to jump to end of text
    node.value = text;
  };

  render = () => {
    return (
      <div className={'cell-content editing'}>
        <textarea autoFocus className="input" name={this.getInputName()} defaultValue={this.props.defaultText}
                  ref="input" rows="4" onKeyDown={KeyboardShortcutsHelper.onKeyboardShortcut(this.getKeyboardShortcuts)}></textarea>
        <ExpandButton onTrigger={this.openOverlay}/>
      </div>
    );
  }
};

TextEditCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  langtag: React.PropTypes.string.isRequired,
  onBlur: React.PropTypes.func.isRequired,
  defaultText: React.PropTypes.string.isRequired,
  openOverlay: React.PropTypes.func.isRequired,
  closeOverlay: React.PropTypes.func.isRequired,
  saveOverlay: React.PropTypes.func.isRequired
};

module.exports = TextEditCell;
