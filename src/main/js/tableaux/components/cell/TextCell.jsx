var React = require('react');
var Dispatcher = require('../../Dispatcher');
var _ = require('lodash');

var TextEditCell = require('./TextEditCell.jsx');
var TextArea = require('../TextArea.jsx');

var ExpandButton = React.createClass({

  displayName : 'ExpandButton',

  propTypes : {
    onTrigger : React.PropTypes.func.isRequired
  },

  render : function () {
    return <button className="add" onClick={this.props.onTrigger}><span className="fa fa-expand"></span></button>
  }
});

var TextCell = React.createClass({

  getInitialState : function () {
    return {
      isEditing : false,
      hover : false
    };
  },

  onOver : function () {
    this.setState({hover : true});
  },

  onOut : function () {
    this.setState({hover : false});
  },

  handleLabelClick : function (event) {
    console.log("TextCell.handleLabelClick");
    event.stopPropagation();
    event.preventDefault();

    this.setState({isEditing : true});
  },

  handleEditDone : function (newValue) {
    var cell = this.props.cell;

    this.setState({isEditing : false});

    if (cell.isMultiLanguage) {
      var value = _.clone(cell.value);
      value[this.props.language] = newValue;
      newValue = value;
    }

    Dispatcher.trigger(cell.changeCellEvent, {newValue : newValue});
  },

  openOverlay : function (event) {
    console.log("TextCell.openOverlay");
    event.stopPropagation();
    event.preventDefault();

    var self = this;

    Dispatcher.trigger("openGenericOverlay", {
      head : this.props.cell.column.name,
      body : <TextArea initialContent={this.getValue()} onClose={self.closeOverlay} onSave={self.saveOverlay}/>
    });
  },

  closeOverlay : function (event) {
    console.log("TextCell.closeOverlay");

    Dispatcher.trigger("closeGenericOverlay");
  },

  saveOverlay : function (content, event) {
    console.log("TextCell.saveOverlay");

    this.closeOverlay(event);

    this.handleEditDone(content);
  },

  getValue : function () {
    var cell = this.props.cell;
    var language = this.props.language;

    var value;
    if (cell.isMultiLanguage) {
      value = cell.value[language];
    } else {
      value = cell.value;
    }

    return value;
  },

  renderTextCell : function (cell, value) {
    var button = "";
    if (this.state.hover) {
      button = <ExpandButton onTrigger={this.openOverlay}/>;
    }

    return (
      <div className={'cell cell-' + cell.column.getId() + '-' + cell.rowId} onMouseEnter={this.onOver}
           onMouseLeave={this.onOut}>
        <span className='cell-content' onClick={this.handleLabelClick}>
          {value}
        </span>
        {button}
      </div>
    );
  },

  render : function () {
    var cell = this.props.cell;
    var language = this.props.language;

    if (!this.state.isEditing) {
      return this.renderTextCell(cell, this.getValue());
    } else {
      return <TextEditCell cell={cell} language={language} onBlur={this.handleEditDone}/>;
    }
  }
});

module.exports = TextCell;
