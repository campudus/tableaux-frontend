var React = require('react');
var _ = require('lodash');

var Dispatcher = require('../../../dispatcher/Dispatcher');
var TextEditCell = require('./TextEditCell.jsx');
var TextArea = require('./TextArea.jsx');
var ExpandButton = require('./ExpandButton.jsx');
var OverlayHeadRowIdentificator = require('../../overlay/OverlayHeadRowIdentificator.jsx');

var TextCell = React.createClass({

  displayName : 'TextCell',

  propTypes : {
    langtag : React.PropTypes.string.isRequired,
    cell : React.PropTypes.object.isRequired,
    editing : React.PropTypes.bool.isRequired,
    selected : React.PropTypes.bool.isRequired
  },

  handleLabelClick : function (event) {
    console.log("TextCell.handleLabelClick");
    event.preventDefault();

    Dispatcher.trigger('toggleCellEditing', {
      cell : this.props.cell
    });
  },

  handleEditDone : function (newValue) {
    var cell = this.props.cell;

    if (cell.isMultiLanguage) {
      var value = _.clone(cell.value);
      value[this.props.langtag] = newValue;
      newValue = value;
    }

    Dispatcher.trigger(cell.changeCellEvent, {newValue : newValue});
    Dispatcher.trigger('toggleCellEditing', {
      cell : this.props.cell,
      editing : false
    });
  },

  openOverlay : function (event, withContent) {
    var self = this;
    var textValue = withContent ? withContent : this.getValue();
    event.stopPropagation();
    event.preventDefault();

    console.log("trigger overlay");
    Dispatcher.trigger("open-overlay", {
      head : <OverlayHeadRowIdentificator cell={self.props.cell} langtag={self.props.langtag}/>,
      body : <TextArea initialContent={textValue} onClose={self.closeOverlay} onSave={self.saveOverlay}/>,
      type : "normal"
    });

  },

  closeOverlay : function (event) {
    event.preventDefault();
    event.stopPropagation();
    Dispatcher.trigger("close-overlay");
  },

  saveOverlay : function (content, event) {
    this.handleEditDone(content);
    this.closeOverlay(event);
  },

  getValue : function () {
    var cell = this.props.cell;

    var value;
    if (cell.isMultiLanguage) {
      value = cell.value[this.props.langtag];
    } else {
      value = cell.value;
    }

    return typeof value === "undefined" ? "" : value;
  },

  renderTextCell : function (cell, value) {
    var self = this;

    var expandButton = "";
    if (this.props.selected) {
      expandButton = <ExpandButton onTrigger={self.openOverlay}></ExpandButton>;
    }

    return (
      <div onClick={this.handleLabelClick}>
        <span className='cell-content'>
          {value === null ? "" : value}
          {expandButton}
        </span>
      </div>
    );
  },

  render : function () {
    var cell = this.props.cell;

    if (!this.props.editing) {
      return this.renderTextCell(cell, this.getValue());
    } else {
      return <TextEditCell cell={cell} defaultText={this.getValue()} langtag={this.props.langtag}
                           onBlur={this.handleEditDone}
                           openOverlay={this.openOverlay} closeOverlay={this.closeOverlay}
                           saveOverlay={this.saveOverlay}/>;
    }
  }
});

module.exports = TextCell;
